// =========================
// METRICS COLLECTOR
// =========================

export interface Metric {
  orgId: string;
  timestamp: Date;
  type: MetricType;
  value: number;
  metadata?: Record<string, any>;
}

export type MetricType =
  | 'query_count'
  | 'tokens_in'
  | 'tokens_out'
  | 'latency_ms'
  | 'crawl_pages'
  | 'embeddings_created'
  | 'cost_usd'
  | 'error_count';

export interface MetricsSummary {
  orgId: string;
  date: Date;
  queries: number;
  tokensIn: number;
  tokensOut: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  crawledPages: number;
  embeddingsCreated: number;
  costUsd: number;
  errors: number;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics: number;

  constructor(config?: { maxMetrics?: number }) {
    this.maxMetrics = config?.maxMetrics || 100000;
  }

  /**
   * Record a metric
   */
  record(metric: Omit<Metric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });

    // Trim old metrics if exceeding max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Record query metrics
   */
  recordQuery(orgId: string, tokensIn: number, tokensOut: number, latencyMs: number): void {
    this.record({ orgId, type: 'query_count', value: 1 });
    this.record({ orgId, type: 'tokens_in', value: tokensIn });
    this.record({ orgId, type: 'tokens_out', value: tokensOut });
    this.record({ orgId, type: 'latency_ms', value: latencyMs });
  }

  /**
   * Record crawl metrics
   */
  recordCrawl(orgId: string, pagesCount: number): void {
    this.record({ orgId, type: 'crawl_pages', value: pagesCount });
  }

  /**
   * Record embedding metrics
   */
  recordEmbeddings(orgId: string, count: number): void {
    this.record({ orgId, type: 'embeddings_created', value: count });
  }

  /**
   * Record cost
   */
  recordCost(orgId: string, costUsd: number): void {
    this.record({ orgId, type: 'cost_usd', value: costUsd });
  }

  /**
   * Record error
   */
  recordError(orgId: string, error?: string): void {
    this.record({ 
      orgId, 
      type: 'error_count', 
      value: 1,
      metadata: error ? { error } : undefined
    });
  }

  /**
   * Get metrics for a time range
   */
  getMetrics(filter: {
    orgId?: string;
    type?: MetricType;
    startDate?: Date;
    endDate?: Date;
  }): Metric[] {
    let results = this.metrics;

    if (filter.orgId) {
      results = results.filter(m => m.orgId === filter.orgId);
    }

    if (filter.type) {
      results = results.filter(m => m.type === filter.type);
    }

    if (filter.startDate) {
      results = results.filter(m => m.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter(m => m.timestamp <= filter.endDate!);
    }

    return results;
  }

  /**
   * Get summary for a date range
   */
  getSummary(orgId: string, startDate: Date, endDate: Date): MetricsSummary {
    const metrics = this.getMetrics({ orgId, startDate, endDate });

    const queries = this.sumMetrics(metrics, 'query_count');
    const tokensIn = this.sumMetrics(metrics, 'tokens_in');
    const tokensOut = this.sumMetrics(metrics, 'tokens_out');
    const latencies = this.getMetricValues(metrics, 'latency_ms');
    const crawledPages = this.sumMetrics(metrics, 'crawl_pages');
    const embeddingsCreated = this.sumMetrics(metrics, 'embeddings_created');
    const costUsd = this.sumMetrics(metrics, 'cost_usd');
    const errors = this.sumMetrics(metrics, 'error_count');

    return {
      orgId,
      date: startDate,
      queries,
      tokensIn,
      tokensOut,
      avgLatency: latencies.length > 0 ? this.average(latencies) : 0,
      p50Latency: this.percentile(latencies, 50),
      p95Latency: this.percentile(latencies, 95),
      p99Latency: this.percentile(latencies, 99),
      crawledPages,
      embeddingsCreated,
      costUsd,
      errors,
    };
  }

  /**
   * Get daily summaries
   */
  getDailySummaries(orgId: string, days: number = 30): MetricsSummary[] {
    const summaries: MetricsSummary[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      summaries.push(this.getSummary(orgId, date, endDate));
    }

    return summaries.reverse();
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThan: Date): number {
    const before = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp >= olderThan);
    return before - this.metrics.length;
  }

  /**
   * Helper: Sum metrics of a specific type
   */
  private sumMetrics(metrics: Metric[], type: MetricType): number {
    return metrics
      .filter(m => m.type === type)
      .reduce((sum, m) => sum + m.value, 0);
  }

  /**
   * Helper: Get metric values
   */
  private getMetricValues(metrics: Metric[], type: MetricType): number[] {
    return metrics
      .filter(m => m.type === type)
      .map(m => m.value);
  }

  /**
   * Helper: Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Helper: Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createMetricsCollector(config?: {
  maxMetrics?: number;
}): MetricsCollector {
  return new MetricsCollector(config);
}