import axios, { AxiosInstance } from 'axios';

// =========================
// EMBEDDING PROVIDERS
// =========================

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  dimensions: number;
  model: string;
}

export interface EmbeddingConfig {
  provider: string;
  apiBase: string;
  apiKey: string;
  model: string;
  dimensions?: number;
  batchSize?: number;
}

// =========================
// OPENAI EMBEDDINGS
// =========================

export class OpenAIEmbeddings implements EmbeddingProvider {
  private client: AxiosInstance;
  public dimensions: number;
  public model: string;
  private batchSize: number;

  constructor(config: {
    apiKey: string;
    apiBase?: string;
    model?: string;
    dimensions?: number;
    batchSize?: number;
  }) {
    this.model = config.model || 'text-embedding-3-large';
    this.dimensions = config.dimensions || 1536;
    this.batchSize = config.batchSize || 100;

    this.client = axios.create({
      baseURL: config.apiBase || 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // Process in batches
    const batches = this.createBatches(texts, this.batchSize);
    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      const embeddings = await this.embedBatch(batch);
      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.client.post('/embeddings', {
        model: this.model,
        input: texts,
        dimensions: this.dimensions,
      });

      return response.data.data
        .sort((a: any, b: any) => a.index - b.index)
        .map((item: any) => item.embedding);
    } catch (error: any) {
      throw new Error(`OpenAI embedding error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}

// =========================
// CUSTOM/LOCAL EMBEDDINGS
// =========================

export class CustomEmbeddings implements EmbeddingProvider {
  private client: AxiosInstance;
  public dimensions: number;
  public model: string;
  private batchSize: number;

  constructor(config: {
    apiBase: string;
    apiKey?: string;
    model: string;
    dimensions: number;
    batchSize?: number;
  }) {
    this.model = config.model;
    this.dimensions = config.dimensions;
    this.batchSize = config.batchSize || 100;

    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    this.client = axios.create({
      baseURL: config.apiBase,
      headers,
      timeout: 60000,
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const batches = this.createBatches(texts, this.batchSize);
    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      const embeddings = await this.embedBatch(batch);
      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.client.post('/embeddings', {
        model: this.model,
        input: texts,
      });

      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      }

      if (response.data.data) {
        return response.data.data
          .sort((a: any, b: any) => (a.index || 0) - (b.index || 0))
          .map((item: any) => item.embedding || item);
      }

      if (response.data.embeddings) {
        return response.data.embeddings;
      }

      throw new Error('Unexpected response format from embedding API');
    } catch (error: any) {
      throw new Error(`Custom embedding error: ${error.response?.data?.error || error.message}`);
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createEmbeddingProvider(config?: Partial<EmbeddingConfig>): EmbeddingProvider {
  const provider = config?.provider || process.env.EMBEDDINGS_PROVIDER || 'openai';
  const apiBase = config?.apiBase || process.env.EMBEDDINGS_API_BASE || 'https://api.openai.com/v1';
  const apiKey = config?.apiKey || process.env.EMBEDDINGS_API_KEY || '';
  const model = config?.model || process.env.EMBEDDINGS_MODEL || 'text-embedding-3-large';
  const dimensions = config?.dimensions || parseInt(process.env.EMBEDDINGS_DIMENSIONS || '1536', 10);

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIEmbeddings({
        apiKey,
        apiBase,
        model,
        dimensions,
      });

    case 'custom':
    case 'local':
      return new CustomEmbeddings({
        apiBase,
        apiKey,
        model,
        dimensions,
      });

    default:
      throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

// =========================
// EMBEDDING UTILITIES
// =========================

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

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

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}