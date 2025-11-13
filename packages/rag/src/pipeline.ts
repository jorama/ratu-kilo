import { Chunker, createChunker, Chunk } from './chunker';
import { EmbeddingProvider, createEmbeddingProvider } from './embeddings';
import { VectorStore, createVectorStore, Vector, Match } from './vector-store';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// =========================
// RAG PIPELINE
// =========================

export interface Document {
  id: string;
  orgId: string;
  uri: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface IngestResult {
  docId: string;
  chunks: number;
  tokens: number;
  embedded: boolean;
}

export interface RetrievedChunk {
  chunkId: string;
  docId: string;
  chunkIx: number;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export interface RAGConfig {
  orgId: string;
  vectorNamespace: string;
  chunker?: Chunker;
  embeddings?: EmbeddingProvider;
  vectorStore?: VectorStore;
  chunkOptions?: {
    targetTokens?: number;
    overlap?: number;
    preserveParagraphs?: boolean;
  };
}

export class RAGPipeline {
  private orgId: string;
  private vectorNamespace: string;
  private chunker: Chunker;
  private embeddings: EmbeddingProvider;
  private vectorStore: VectorStore;
  private chunkOptions: {
    targetTokens: number;
    overlap: number;
    preserveParagraphs: boolean;
  };

  constructor(config: RAGConfig) {
    this.orgId = config.orgId;
    this.vectorNamespace = config.vectorNamespace;
    this.chunker = config.chunker || createChunker();
    this.embeddings = config.embeddings || createEmbeddingProvider();
    this.vectorStore = config.vectorStore || createVectorStore();
    this.chunkOptions = {
      targetTokens: config.chunkOptions?.targetTokens || 800,
      overlap: config.chunkOptions?.overlap || 120,
      preserveParagraphs: config.chunkOptions?.preserveParagraphs ?? true,
    };
  }

  /**
   * Ingest a document into the RAG system
   */
  async ingest(document: Document): Promise<IngestResult> {
    // 1. Chunk the document
    const chunks = this.chunker.chunk(document.content, this.chunkOptions);

    if (chunks.length === 0) {
      return {
        docId: document.id,
        chunks: 0,
        tokens: 0,
        embedded: false,
      };
    }

    // 2. Create chunk texts for embedding
    const chunkTexts = chunks.map(chunk => chunk.content);

    // 3. Generate embeddings
    const embeddings = await this.embeddings.embed(chunkTexts);

    // 4. Prepare vectors for storage
    const vectors: Vector[] = chunks.map((chunk, index) => ({
      id: this.generateChunkId(document.id, index),
      vector: embeddings[index],
      metadata: {
        org_id: this.orgId,
        doc_id: document.id,
        chunk_ix: index,
        uri: document.uri,
        title: document.title,
        content: chunk.content,
        tokens: chunk.tokens,
        start_char: chunk.startChar,
        end_char: chunk.endChar,
        ...document.metadata,
      },
    }));

    // 5. Upsert to vector store
    await this.vectorStore.upsert(this.vectorNamespace, vectors);

    // 6. Calculate total tokens
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);

    return {
      docId: document.id,
      chunks: chunks.length,
      tokens: totalTokens,
      embedded: true,
    };
  }

  /**
   * Retrieve relevant chunks for a query
   */
  async retrieve(
    query: string,
    options: {
      topK?: number;
      filter?: Record<string, any>;
      minScore?: number;
    } = {}
  ): Promise<RetrievedChunk[]> {
    const { topK = 6, filter, minScore = 0.0 } = options;

    // 1. Embed the query
    const queryEmbeddings = await this.embeddings.embed([query]);
    const queryVector = queryEmbeddings[0];

    // 2. Search vector store
    const matches = await this.vectorStore.query(
      this.vectorNamespace,
      queryVector,
      topK,
      filter
    );

    // 3. Filter by minimum score and format results
    return matches
      .filter(match => match.score >= minScore)
      .map(match => ({
        chunkId: match.id,
        docId: match.metadata.doc_id,
        chunkIx: match.metadata.chunk_ix,
        content: match.metadata.content,
        score: match.score,
        metadata: {
          uri: match.metadata.uri,
          title: match.metadata.title,
          tokens: match.metadata.tokens,
          start_char: match.metadata.start_char,
          end_char: match.metadata.end_char,
        },
      }));
  }

  /**
   * Build context string from retrieved chunks
   */
  buildContext(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return '';
    }

    return chunks
      .map((chunk, index) => {
        const citation = `[CIT:${chunk.docId}:${chunk.chunkIx}]`;
        return `Document ${index + 1} ${citation}:\nTitle: ${chunk.metadata.title}\nContent: ${chunk.content}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Delete document from vector store
   */
  async deleteDocument(docId: string): Promise<void> {
    // Get all chunk IDs for this document
    const chunkIds: string[] = [];
    
    // We need to query to find all chunks (or maintain an index)
    // For now, we'll use a simple approach with a large topK
    const dummyVector = new Array(this.embeddings.dimensions).fill(0);
    const matches = await this.vectorStore.query(
      this.vectorNamespace,
      dummyVector,
      10000,
      { doc_id: docId }
    );

    const ids = matches.map(m => m.id);
    
    if (ids.length > 0) {
      await this.vectorStore.delete(this.vectorNamespace, ids);
    }
  }

  /**
   * Update document (delete old, ingest new)
   */
  async updateDocument(document: Document): Promise<IngestResult> {
    await this.deleteDocument(document.id);
    return await this.ingest(document);
  }

  /**
   * Generate deterministic chunk ID
   */
  private generateChunkId(docId: string, chunkIndex: number): string {
    const data = `${docId}:${chunkIndex}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Get statistics about the vector store
   */
  async getStats(): Promise<{
    namespace: string;
    vectorCount: number;
    dimensions: number;
  }> {
    const vectorStore = this.vectorStore as any;
    const count = vectorStore.count ? await vectorStore.count(this.vectorNamespace) : 0;

    return {
      namespace: this.vectorNamespace,
      vectorCount: count,
      dimensions: this.embeddings.dimensions,
    };
  }

  /**
   * Clear all vectors in namespace
   */
  async clear(): Promise<void> {
    await this.vectorStore.deleteNamespace(this.vectorNamespace);
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createRAGPipeline(
  orgId: string,
  vectorNamespace: string,
  config?: Partial<RAGConfig>
): RAGPipeline {
  return new RAGPipeline({
    orgId,
    vectorNamespace,
    ...config,
  });
}

// =========================
// BATCH OPERATIONS
// =========================

export class BatchRAGPipeline extends RAGPipeline {
  /**
   * Ingest multiple documents in parallel
   */
  async ingestBatch(
    documents: Document[],
    options: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<IngestResult[]> {
    const { concurrency = 5, onProgress } = options;
    const results: IngestResult[] = [];
    
    // Process in batches
    for (let i = 0; i < documents.length; i += concurrency) {
      const batch = documents.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(doc => this.ingest(doc))
      );
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress(results.length, documents.length);
      }
    }

    return results;
  }

  /**
   * Retrieve and deduplicate chunks from multiple queries
   */
  async retrieveMulti(
    queries: string[],
    options: {
      topK?: number;
      filter?: Record<string, any>;
      minScore?: number;
      deduplicate?: boolean;
    } = {}
  ): Promise<RetrievedChunk[]> {
    const { deduplicate = true, ...retrieveOptions } = options;

    // Retrieve for each query
    const allResults = await Promise.all(
      queries.map(query => this.retrieve(query, retrieveOptions))
    );

    // Flatten results
    let chunks = allResults.flat();

    // Deduplicate by chunk ID if requested
    if (deduplicate) {
      const seen = new Set<string>();
      chunks = chunks.filter(chunk => {
        if (seen.has(chunk.chunkId)) {
          return false;
        }
        seen.add(chunk.chunkId);
        return true;
      });
    }

    // Sort by score
    chunks.sort((a, b) => b.score - a.score);

    return chunks;
  }
}

export function createBatchRAGPipeline(
  orgId: string,
  vectorNamespace: string,
  config?: Partial<RAGConfig>
): BatchRAGPipeline {
  return new BatchRAGPipeline({
    orgId,
    vectorNamespace,
    ...config,
  });
}