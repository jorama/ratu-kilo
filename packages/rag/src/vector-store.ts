import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';

// =========================
// VECTOR STORE INTERFACE
// =========================

export interface Vector {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
}

export interface Match {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

export interface VectorStore {
  upsert(namespace: string, vectors: Vector[]): Promise<void>;
  query(namespace: string, vector: number[], topK: number, filter?: Record<string, any>): Promise<Match[]>;
  delete(namespace: string, ids: string[]): Promise<void>;
  deleteNamespace(namespace: string): Promise<void>;
}

// =========================
// QDRANT VECTOR STORE
// =========================

export class QdrantStore implements VectorStore {
  private client: QdrantClient;
  private collectionPrefix: string;

  constructor(config: {
    url: string;
    apiKey?: string;
    collectionPrefix?: string;
  }) {
    this.client = new QdrantClient({
      url: config.url,
      apiKey: config.apiKey,
    });
    this.collectionPrefix = config.collectionPrefix || 'ratu_';
  }

  /**
   * Get collection name for namespace
   */
  private getCollectionName(namespace: string): string {
    return `${this.collectionPrefix}${namespace}`;
  }

  /**
   * Ensure collection exists
   */
  private async ensureCollection(namespace: string, vectorSize: number): Promise<void> {
    const collectionName = this.getCollectionName(namespace);

    try {
      await this.client.getCollection(collectionName);
    } catch (error) {
      // Collection doesn't exist, create it
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });

      // Create payload index for common fields
      await this.client.createPayloadIndex(collectionName, {
        field_name: 'doc_id',
        field_schema: 'keyword',
      });

      await this.client.createPayloadIndex(collectionName, {
        field_name: 'chunk_ix',
        field_schema: 'integer',
      });
    }
  }

  /**
   * Upsert vectors into collection
   */
  async upsert(namespace: string, vectors: Vector[]): Promise<void> {
    if (vectors.length === 0) {
      return;
    }

    const vectorSize = vectors[0].vector.length;
    await this.ensureCollection(namespace, vectorSize);

    const collectionName = this.getCollectionName(namespace);
    const points = vectors.map(v => ({
      id: v.id,
      vector: v.vector,
      payload: v.metadata,
    }));

    // Batch upsert (Qdrant handles batching internally)
    await this.client.upsert(collectionName, {
      wait: true,
      points,
    });
  }

  /**
   * Query vectors
   */
  async query(
    namespace: string,
    vector: number[],
    topK: number,
    filter?: Record<string, any>
  ): Promise<Match[]> {
    const collectionName = this.getCollectionName(namespace);

    try {
      const searchResult = await this.client.search(collectionName, {
        vector,
        limit: topK,
        with_payload: true,
        filter: filter ? this.buildFilter(filter) : undefined,
      });

      return searchResult.map(result => ({
        id: result.id.toString(),
        score: result.score,
        metadata: result.payload as Record<string, any>,
      }));
    } catch (error: any) {
      if (error.message?.includes('Not found')) {
        // Collection doesn't exist yet
        return [];
      }
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  async delete(namespace: string, ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const collectionName = this.getCollectionName(namespace);

    try {
      await this.client.delete(collectionName, {
        wait: true,
        points: ids,
      });
    } catch (error: any) {
      if (!error.message?.includes('Not found')) {
        throw error;
      }
    }
  }

  /**
   * Delete entire namespace (collection)
   */
  async deleteNamespace(namespace: string): Promise<void> {
    const collectionName = this.getCollectionName(namespace);

    try {
      await this.client.deleteCollection(collectionName);
    } catch (error: any) {
      if (!error.message?.includes('Not found')) {
        throw error;
      }
    }
  }

  /**
   * Build Qdrant filter from simple key-value pairs
   */
  private buildFilter(filter: Record<string, any>): any {
    const must: any[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        must.push({
          key,
          match: { value },
        });
      }
    }

    return must.length > 0 ? { must } : undefined;
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(namespace: string): Promise<any> {
    const collectionName = this.getCollectionName(namespace);
    try {
      return await this.client.getCollection(collectionName);
    } catch (error) {
      return null;
    }
  }

  /**
   * Count vectors in namespace
   */
  async count(namespace: string): Promise<number> {
    const info = await this.getCollectionInfo(namespace);
    return info?.points_count || 0;
  }
}

// =========================
// IN-MEMORY VECTOR STORE (FOR TESTING)
// =========================

export class InMemoryVectorStore implements VectorStore {
  private store: Map<string, Vector[]> = new Map();

  async upsert(namespace: string, vectors: Vector[]): Promise<void> {
    const existing = this.store.get(namespace) || [];
    
    // Remove existing vectors with same IDs
    const ids = new Set(vectors.map(v => v.id));
    const filtered = existing.filter(v => !ids.has(v.id));
    
    // Add new vectors
    this.store.set(namespace, [...filtered, ...vectors]);
  }

  async query(
    namespace: string,
    vector: number[],
    topK: number,
    filter?: Record<string, any>
  ): Promise<Match[]> {
    const vectors = this.store.get(namespace) || [];
    
    // Apply filter
    let filtered = vectors;
    if (filter) {
      filtered = vectors.filter(v => {
        for (const [key, value] of Object.entries(filter)) {
          if (v.metadata[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Calculate similarities
    const matches = filtered.map(v => ({
      id: v.id,
      score: this.cosineSimilarity(vector, v.vector),
      metadata: v.metadata,
    }));

    // Sort by score and take top K
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }

  async delete(namespace: string, ids: string[]): Promise<void> {
    const vectors = this.store.get(namespace) || [];
    const idSet = new Set(ids);
    this.store.set(namespace, vectors.filter(v => !idSet.has(v.id)));
  }

  async deleteNamespace(namespace: string): Promise<void> {
    this.store.delete(namespace);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createVectorStore(config?: {
  provider?: string;
  url?: string;
  apiKey?: string;
  collectionPrefix?: string;
}): VectorStore {
  const provider = config?.provider || process.env.VECTOR_DB_PROVIDER || 'qdrant';

  switch (provider.toLowerCase()) {
    case 'qdrant':
      return new QdrantStore({
        url: config?.url || process.env.VECTOR_DB_URL || 'http://localhost:6333',
        apiKey: config?.apiKey || process.env.VECTOR_DB_KEY,
        collectionPrefix: config?.collectionPrefix || process.env.VECTOR_DB_COLLECTION_PREFIX || 'ratu_',
      });

    case 'memory':
    case 'test':
      return new InMemoryVectorStore();

    default:
      throw new Error(`Unknown vector store provider: ${provider}`);
  }
}