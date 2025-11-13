import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// =========================
// DATABASE CLIENT
// =========================

export class DatabaseClient {
  private pool: Pool;

  constructor(connectionString?: string) {
    const connString = connectionString || process.env.POSTGRES_URL;
    
    if (!connString) {
      throw new Error('POSTGRES_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString: connString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  /**
   * Execute a query
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error: any) {
      console.error('Query error:', error.message);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute queries in a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check database connection
   */
  async ping(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// =========================
// SINGLETON INSTANCE
// =========================

let dbInstance: DatabaseClient | null = null;

export function getDatabase(connectionString?: string): DatabaseClient {
  if (!dbInstance) {
    dbInstance = new DatabaseClient(connectionString);
  }
  return dbInstance;
}

export function createDatabase(connectionString?: string): DatabaseClient {
  return new DatabaseClient(connectionString);
}