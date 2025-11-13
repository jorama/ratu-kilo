import crypto from 'crypto';

// =========================
// SESSION MANAGEMENT
// =========================

export interface Session {
  id: string;
  userId: string;
  orgId: string;
  role: string;
  data: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
}

export interface SessionStore {
  get(sessionId: string): Promise<Session | null>;
  set(session: Session): Promise<void>;
  delete(sessionId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  cleanup(): Promise<number>; // Remove expired sessions
}

// =========================
// IN-MEMORY SESSION STORE
// =========================

export class InMemorySessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();

  async get(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      await this.delete(sessionId);
      return null;
    }

    // Update last accessed
    session.lastAccessedAt = new Date();
    return session;
  }

  async set(session: Session): Promise<void> {
    this.sessions.set(session.id, session);

    // Track user sessions
    if (!this.userSessions.has(session.userId)) {
      this.userSessions.set(session.userId, new Set());
    }
    this.userSessions.get(session.userId)!.add(session.id);
  }

  async delete(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      
      // Remove from user sessions
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    const sessionIds = this.userSessions.get(userId);
    if (sessionIds) {
      for (const sessionId of sessionIds) {
        this.sessions.delete(sessionId);
      }
      this.userSessions.delete(userId);
    }
  }

  async cleanup(): Promise<number> {
    const now = new Date();
    let count = 0;

    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt < now) {
        await this.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  // Helper methods
  getSessionCount(): number {
    return this.sessions.size;
  }

  getUserSessionCount(userId: string): number {
    return this.userSessions.get(userId)?.size || 0;
  }
}

// =========================
// SESSION SERVICE
// =========================

export class SessionService {
  private store: SessionStore;
  private defaultTTL: number; // milliseconds

  constructor(config: {
    store?: SessionStore;
    ttl?: number; // seconds
  }) {
    this.store = config.store || new InMemorySessionStore();
    this.defaultTTL = (config.ttl || 86400) * 1000; // Default 24 hours
  }

  /**
   * Create a new session
   */
  async create(data: {
    userId: string;
    orgId: string;
    role: string;
    data?: Record<string, any>;
    ttl?: number; // seconds
  }): Promise<Session> {
    const session: Session = {
      id: this.generateSessionId(),
      userId: data.userId,
      orgId: data.orgId,
      role: data.role,
      data: data.data || {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (data.ttl ? data.ttl * 1000 : this.defaultTTL)),
      lastAccessedAt: new Date(),
    };

    await this.store.set(session);
    return session;
  }

  /**
   * Get session by ID
   */
  async get(sessionId: string): Promise<Session | null> {
    return await this.store.get(sessionId);
  }

  /**
   * Update session data
   */
  async update(sessionId: string, data: Partial<Session['data']>): Promise<Session | null> {
    const session = await this.store.get(sessionId);
    if (!session) {
      return null;
    }

    session.data = { ...session.data, ...data };
    session.lastAccessedAt = new Date();
    await this.store.set(session);
    return session;
  }

  /**
   * Extend session expiration
   */
  async extend(sessionId: string, ttl?: number): Promise<Session | null> {
    const session = await this.store.get(sessionId);
    if (!session) {
      return null;
    }

    session.expiresAt = new Date(Date.now() + (ttl ? ttl * 1000 : this.defaultTTL));
    session.lastAccessedAt = new Date();
    await this.store.set(session);
    return session;
  }

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<void> {
    await this.store.delete(sessionId);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.store.deleteByUserId(userId);
  }

  /**
   * Validate session
   */
  async validate(sessionId: string): Promise<Session | null> {
    const session = await this.store.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Auto-extend on validation
    await this.extend(sessionId);
    
    return session;
  }

  /**
   * Cleanup expired sessions
   */
  async cleanup(): Promise<number> {
    return await this.store.cleanup();
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval(intervalSeconds: number = 3600): NodeJS.Timeout {
    return setInterval(async () => {
      const count = await this.cleanup();
      if (count > 0) {
        console.log(`Cleaned up ${count} expired sessions`);
      }
    }, intervalSeconds * 1000);
  }
}

// =========================
// FACTORY FUNCTIONS
// =========================

export function createSessionService(config?: {
  store?: SessionStore;
  ttl?: number;
}): SessionService {
  return new SessionService(config || {});
}

export function createInMemorySessionStore(): InMemorySessionStore {
  return new InMemorySessionStore();
}