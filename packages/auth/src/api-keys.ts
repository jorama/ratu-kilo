import crypto from 'crypto';
import bcrypt from 'bcrypt';

// =========================
// API KEY SERVICE
// =========================

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  keyHash: string;
  scope: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface CreateApiKeyOptions {
  orgId: string;
  name: string;
  scope?: string[];
  expiresIn?: number; // days
}

export interface ApiKeyResult {
  id: string;
  key: string; // Plain text key (only shown once)
  name: string;
  scope: string[];
  expiresAt?: Date;
}

export class ApiKeyService {
  private saltRounds: number;
  private keyPrefix: string;

  constructor(config?: {
    saltRounds?: number;
    keyPrefix?: string;
  }) {
    this.saltRounds = config?.saltRounds || 10;
    this.keyPrefix = config?.keyPrefix || 'ratu_';
  }

  /**
   * Generate a new API key
   */
  async generate(options: CreateApiKeyOptions): Promise<ApiKeyResult> {
    const id = this.generateId();
    const secret = this.generateSecret();
    const key = `${this.keyPrefix}${id}_${secret}`;
    const keyHash = await this.hash(key);

    const expiresAt = options.expiresIn
      ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
      : undefined;

    return {
      id,
      key, // Plain text - only time it's visible
      name: options.name,
      scope: options.scope || ['*'],
      expiresAt,
    };
  }

  /**
   * Hash an API key
   */
  async hash(key: string): Promise<string> {
    return bcrypt.hash(key, this.saltRounds);
  }

  /**
   * Verify an API key against its hash
   */
  async verify(key: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(key, hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse API key to extract ID
   */
  parseKey(key: string): { id: string; secret: string } | null {
    if (!key.startsWith(this.keyPrefix)) {
      return null;
    }

    const withoutPrefix = key.substring(this.keyPrefix.length);
    const parts = withoutPrefix.split('_');

    if (parts.length !== 2) {
      return null;
    }

    return {
      id: parts[0],
      secret: parts[1],
    };
  }

  /**
   * Check if API key is valid (not expired, not revoked)
   */
  isValid(apiKey: ApiKey): boolean {
    // Check if revoked
    if (apiKey.revokedAt) {
      return false;
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Check if API key has required scope
   */
  hasScope(apiKey: ApiKey, requiredScope: string): boolean {
    // Wildcard scope
    if (apiKey.scope.includes('*')) {
      return true;
    }

    // Exact match
    if (apiKey.scope.includes(requiredScope)) {
      return true;
    }

    // Prefix match (e.g., 'chat:*' matches 'chat:send')
    for (const scope of apiKey.scope) {
      if (scope.endsWith(':*')) {
        const prefix = scope.substring(0, scope.length - 2);
        if (requiredScope.startsWith(prefix + ':')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate random ID
   */
  private generateId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Generate random secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(24).toString('base64url');
  }

  /**
   * Mask API key for display (show only first/last chars)
   */
  maskKey(key: string): string {
    if (key.length < 16) {
      return '***';
    }
    return `${key.substring(0, 12)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Generate key metadata for storage
   */
  generateMetadata(key: string): {
    prefix: string;
    suffix: string;
    length: number;
  } {
    return {
      prefix: key.substring(0, 12),
      suffix: key.substring(key.length - 4),
      length: key.length,
    };
  }
}

// =========================
// SCOPES
// =========================

export const API_SCOPES = {
  // Wildcard
  ALL: '*',

  // Chat
  CHAT_READ: 'chat:read',
  CHAT_WRITE: 'chat:write',
  CHAT_ALL: 'chat:*',

  // Documents
  DOCS_READ: 'docs:read',
  DOCS_WRITE: 'docs:write',
  DOCS_DELETE: 'docs:delete',
  DOCS_ALL: 'docs:*',

  // Sources
  SOURCES_READ: 'sources:read',
  SOURCES_WRITE: 'sources:write',
  SOURCES_DELETE: 'sources:delete',
  SOURCES_ALL: 'sources:*',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_ALL: 'analytics:*',

  // Admin
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
  ADMIN_ALL: 'admin:*',
} as const;

export type ApiScope = typeof API_SCOPES[keyof typeof API_SCOPES];

// =========================
// FACTORY FUNCTION
// =========================

export function createApiKeyService(config?: {
  saltRounds?: number;
  keyPrefix?: string;
}): ApiKeyService {
  return new ApiKeyService(config);
}