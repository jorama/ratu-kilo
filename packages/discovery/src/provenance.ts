import { v4 as uuidv4 } from 'uuid';

// =========================
// PROVENANCE TYPES
// =========================

export type ProvenanceEventType =
  | 'crawl.started'
  | 'crawl.completed'
  | 'crawl.failed'
  | 'page.discovered'
  | 'page.crawled'
  | 'page.failed'
  | 'document.created'
  | 'document.updated'
  | 'document.removed'
  | 'content.extracted'
  | 'content.chunked'
  | 'content.embedded';

export interface ProvenanceEvent {
  id: string;
  orgId: string;
  sourceId: string;
  eventType: ProvenanceEventType;
  timestamp: Date;
  payload: Record<string, any>;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    duration?: number;
    error?: string;
  };
}

export interface CrawlSession {
  id: string;
  orgId: string;
  sourceId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  stats: {
    pagesDiscovered: number;
    pagesCrawled: number;
    pagesFailed: number;
    documentsCreated: number;
    documentsUpdated: number;
    documentsRemoved: number;
  };
}

// =========================
// PROVENANCE LOGGER
// =========================

export class ProvenanceLogger {
  private events: ProvenanceEvent[] = [];
  private sessions: Map<string, CrawlSession> = new Map();

  /**
   * Log a provenance event
   */
  log(event: Omit<ProvenanceEvent, 'id' | 'timestamp'>): ProvenanceEvent {
    const fullEvent: ProvenanceEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      ...event,
    };

    this.events.push(fullEvent);
    return fullEvent;
  }

  /**
   * Start a crawl session
   */
  startSession(orgId: string, sourceId: string): CrawlSession {
    const session: CrawlSession = {
      id: uuidv4(),
      orgId,
      sourceId,
      startTime: new Date(),
      status: 'running',
      stats: {
        pagesDiscovered: 0,
        pagesCrawled: 0,
        pagesFailed: 0,
        documentsCreated: 0,
        documentsUpdated: 0,
        documentsRemoved: 0,
      },
    };

    this.sessions.set(session.id, session);

    this.log({
      orgId,
      sourceId,
      eventType: 'crawl.started',
      payload: {
        sessionId: session.id,
      },
    });

    return session;
  }

  /**
   * End a crawl session
   */
  endSession(sessionId: string, status: 'completed' | 'failed', error?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.endTime = new Date();
    session.status = status;

    const duration = session.endTime.getTime() - session.startTime.getTime();

    this.log({
      orgId: session.orgId,
      sourceId: session.sourceId,
      eventType: status === 'completed' ? 'crawl.completed' : 'crawl.failed',
      payload: {
        sessionId,
        stats: session.stats,
      },
      metadata: {
        duration,
        error,
      },
    });
  }

  /**
   * Log page discovered
   */
  logPageDiscovered(sessionId: string, url: string, depth: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.stats.pagesDiscovered++;

    this.log({
      orgId: session.orgId,
      sourceId: session.sourceId,
      eventType: 'page.discovered',
      payload: {
        sessionId,
        url,
        depth,
      },
    });
  }

  /**
   * Log page crawled
   */
  logPageCrawled(
    sessionId: string,
    url: string,
    metadata: {
      statusCode: number;
      contentType: string;
      size: number;
      duration: number;
    }
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.stats.pagesCrawled++;

    this.log({
      orgId: session.orgId,
      sourceId: session.sourceId,
      eventType: 'page.crawled',
      payload: {
        sessionId,
        url,
        ...metadata,
      },
      metadata: {
        duration: metadata.duration,
      },
    });
  }

  /**
   * Log page failed
   */
  logPageFailed(sessionId: string, url: string, error: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.stats.pagesFailed++;

    this.log({
      orgId: session.orgId,
      sourceId: session.sourceId,
      eventType: 'page.failed',
      payload: {
        sessionId,
        url,
      },
      metadata: {
        error,
      },
    });
  }

  /**
   * Log document created
   */
  logDocumentCreated(sessionId: string, docId: string, uri: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.stats.documentsCreated++;

    this.log({
      orgId: session.orgId,
      sourceId: session.sourceId,
      eventType: 'document.created',
      payload: {
        sessionId,
        docId,
        uri,
      },
    });
  }

  /**
   * Log document updated
   */
  logDocumentUpdated(sessionId: string, docId: string, uri: string, changes: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.stats.documentsUpdated++;

    this.log({
      orgId: session.orgId,
      sourceId: session.sourceId,
      eventType: 'document.updated',
      payload: {
        sessionId,
        docId,
        uri,
        changes,
      },
    });
  }

  /**
   * Log document removed
   */
  logDocumentRemoved(sessionId: string, docId: string, uri: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.stats.documentsRemoved++;

    this.log({
      orgId: session.orgId,
      sourceId: session.sourceId,
      eventType: 'document.removed',
      payload: {
        sessionId,
        docId,
        uri,
      },
    });
  }

  /**
   * Get all events
   */
  getEvents(filter?: {
    orgId?: string;
    sourceId?: string;
    eventType?: ProvenanceEventType;
    since?: Date;
  }): ProvenanceEvent[] {
    let filtered = this.events;

    if (filter) {
      if (filter.orgId) {
        filtered = filtered.filter(e => e.orgId === filter.orgId);
      }
      if (filter.sourceId) {
        filtered = filtered.filter(e => e.sourceId === filter.sourceId);
      }
      if (filter.eventType) {
        filtered = filtered.filter(e => e.eventType === filter.eventType);
      }
      if (filter.since) {
        filtered = filtered.filter(e => e.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  /**
   * Get session
   */
  getSession(sessionId: string): CrawlSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getSessions(filter?: {
    orgId?: string;
    sourceId?: string;
    status?: CrawlSession['status'];
  }): CrawlSession[] {
    let sessions = Array.from(this.sessions.values());

    if (filter) {
      if (filter.orgId) {
        sessions = sessions.filter(s => s.orgId === filter.orgId);
      }
      if (filter.sourceId) {
        sessions = sessions.filter(s => s.sourceId === filter.sourceId);
      }
      if (filter.status) {
        sessions = sessions.filter(s => s.status === filter.status);
      }
    }

    return sessions;
  }

  /**
   * Clear old events (for memory management)
   */
  clearOldEvents(olderThan: Date): number {
    const before = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= olderThan);
    return before - this.events.length;
  }

  /**
   * Export events as JSON
   */
  exportEvents(filter?: Parameters<typeof this.getEvents>[0]): string {
    const events = this.getEvents(filter);
    return JSON.stringify(events, null, 2);
  }

  /**
   * Get event statistics
   */
  getStatistics(filter?: {
    orgId?: string;
    sourceId?: string;
    since?: Date;
  }): Record<ProvenanceEventType, number> {
    const events = this.getEvents(filter);
    const stats: Record<string, number> = {};

    for (const event of events) {
      stats[event.eventType] = (stats[event.eventType] || 0) + 1;
    }

    return stats as Record<ProvenanceEventType, number>;
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createProvenanceLogger(): ProvenanceLogger {
  return new ProvenanceLogger();
}