import { Job } from 'bull';
import { createMetricsCollector } from '@ratu/analytics';

const metricsCollector = createMetricsCollector();

export interface MetricsJobData {
  type: 'aggregate-daily' | 'cleanup';
  orgId?: string;
}

export async function processMetricsJob(job: Job<MetricsJobData>): Promise<any> {
  const { type, orgId } = job.data;

  try {
    switch (type) {
      case 'aggregate-daily':
        return await aggregateDailyMetrics(orgId);
      
      case 'cleanup':
        return await cleanupOldMetrics();
      
      default:
        throw new Error(`Unknown metrics job type: ${type}`);
    }
  } catch (error: any) {
    throw new Error(`Metrics job failed: ${error.message}`);
  }
}

async function aggregateDailyMetrics(orgId?: string): Promise<any> {
  // In production, this would:
  // 1. Query metrics from the last 24 hours
  // 2. Aggregate by organization
  // 3. Store in metrics_daily table
  // 4. Clean up raw metrics

  console.log('Aggregating daily metrics...');
  
  return {
    aggregated: true,
    timestamp: new Date().toISOString(),
  };
}

async function cleanupOldMetrics(): Promise<any> {
  // Clean up metrics older than 90 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const removed = metricsCollector.clearOldMetrics(cutoffDate);

  console.log(`Cleaned up ${removed} old metrics`);

  return {
    removed,
    cutoff_date: cutoffDate.toISOString(),
  };
}