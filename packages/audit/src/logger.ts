import { v4 as uuidv4 } from 'uuid';

// =========================
// AUDIT LOG TYPES
// =========================

export type ActorType = 'user' | 'system' | 'api_key' | 'bot';
export type TargetType = 
  | 'organization'
  | 'user'
  | 'api_key'
  | 'data_source'
  | 'document'
  | 'chat_session'
  | 'message'
  | 'agent'
  | 'tool';

export type AuditAction =
  // Organization
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  // User
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'user.password_changed'
  // API Key
  | 'apikey.created'
  | 'apikey.revoked'
  | 'apikey.used'
  // Data Source
  | 'source.created'
  | 'source.updated'
  | 'source.deleted'
  | 'source.crawl_started'
  | 'source.crawl_completed'
  | 'source.crawl_failed'
  // Document
  | 'doc.created'
  | 'doc.updated'
  | 'doc.deleted'
  // Chat
  | 'chat.session_created'
  | 'chat.message_sent'
  | 'chat.session_deleted'
  // Council
  | 'council.executed'
  // System
  | 'system.backup_created'
  | 'system.maintenance';

export interface AuditLog {
  id: string;
  orgId: string;
  actorType: ActorType;
  actorId: string;
  action: AuditAction;
  targetType: TargetType;
  targetId: string;
  payload: Record<string, any>;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    duration?: number;
    error?: string;
  };
  timestamp: Date;
}

export interface AuditLogFilter {
  orgId?: string;
  actorId?: string;
  actorType?: ActorType;
  action?: AuditAction;
  targetType?: TargetType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// =========================
// AUDIT LOGGER
// =========================

export class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs: number;

  constructor(config?: {
    maxLogs?: number;
  }) {
    this.maxLogs = config?.maxLogs || 100000;
  }

  /**
   * Log an audit event
   */
  log(event: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      id: uuidv4(),
      timestamp: new Date(),
      ...event,
    };

    this.logs.push(log);

    // Trim old logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    return log;
  }

  /**
   * Query audit logs
   */
  query(filter: AuditLogFilter = {}): AuditLog[] {
    let results = this.logs;

    // Apply filters
    if (filter.orgId) {
      results = results.filter(log => log.orgId === filter.orgId);
    }

    if (filter.actorId) {
      results = results.filter(log => log.actorId === filter.actorId);
    }

    if (filter.actorType) {
      results = results.filter(log => log.actorType === filter.actorType);
    }

    if (filter.action) {
      results = results.filter(log => log.action === filter.action);
    }

    if (filter.targetType) {
      results = results.filter(log => log.targetType === filter.targetType);
    }

    if (filter.targetId) {
      results = results.filter(log => log.targetId === filter.targetId);
    }

    if (filter.startDate) {
      results = results.filter(log => log.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter(log => log.timestamp <= filter.endDate!);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get audit trail for a specific target
   */
  getTrail(targetType: TargetType, targetId: string): AuditLog[] {
    return this.query({ targetType, targetId });
  }

  /**
   * Get user activity
   */
  getUserActivity(userId: string, limit: number = 50): AuditLog[] {
    return this.query({ actorId: userId, limit });
  }

  /**
   * Get organization activity
   */
  getOrgActivity(orgId: string, limit: number = 100): AuditLog[] {
    return this.query({ orgId, limit });
  }

  /**
   * Get statistics
   */
  getStatistics(filter: Omit<AuditLogFilter, 'limit' | 'offset'> = {}): {
    total: number;
    byAction: Record<string, number>;
    byActorType: Record<string, number>;
    byTargetType: Record<string, number>;
  } {
    const logs = this.query({ ...filter, limit: this.maxLogs });

    const stats = {
      total: logs.length,
      byAction: {} as Record<string, number>,
      byActorType: {} as Record<string, number>,
      byTargetType: {} as Record<string, number>,
    };

    for (const log of logs) {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byActorType[log.actorType] = (stats.byActorType[log.actorType] || 0) + 1;
      stats.byTargetType[log.targetType] = (stats.byTargetType[log.targetType] || 0) + 1;
    }

    return stats;
  }

  /**
   * Export logs as JSON
   */
  export(filter: AuditLogFilter = {}): string {
    const logs = this.query(filter);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear old logs
   */
  clearOldLogs(olderThan: Date): number {
    const before = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= olderThan);
    return before - this.logs.length;
  }

  /**
   * Get log count
   */
  count(filter: Omit<AuditLogFilter, 'limit' | 'offset'> = {}): number {
    return this.query({ ...filter, limit: this.maxLogs }).length;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

export function createAuditLogger(config?: {
  maxLogs?: number;
}): AuditLogger {
  return new AuditLogger(config);
}

/**
 * Create audit log entry helper
 */
export function createAuditEntry(
  orgId: string,
  actorType: ActorType,
  actorId: string,
  action: AuditAction,
  targetType: TargetType,
  targetId: string,
  payload?: Record<string, any>,
  metadata?: AuditLog['metadata']
): Omit<AuditLog, 'id' | 'timestamp'> {
  return {
    orgId,
    actorType,
    actorId,
    action,
    targetType,
    targetId,
    payload: payload || {},
    metadata: metadata || {},
  };
}