import dotenv from 'dotenv';
import Queue from 'bull';
import { processCrawlJob } from './jobs/crawl';
import { processEmbedJob } from './jobs/embed';
import { processMetricsJob } from './jobs/metrics';

dotenv.config();

// =========================
// QUEUE CONFIGURATION
// =========================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
const crawlQueue = new Queue('crawl', REDIS_URL);
const embedQueue = new Queue('embed', REDIS_URL);
const metricsQueue = new Queue('metrics', REDIS_URL);

// =========================
// JOB PROCESSORS
// =========================

// Crawl job processor
crawlQueue.process(5, async (job) => {
  console.log(`Processing crawl job ${job.id}`);
  return await processCrawlJob(job);
});

// Embed job processor
embedQueue.process(3, async (job) => {
  console.log(`Processing embed job ${job.id}`);
  return await processEmbedJob(job);
});

// Metrics job processor
metricsQueue.process(1, async (job) => {
  console.log(`Processing metrics job ${job.id}`);
  return await processMetricsJob(job);
});

// =========================
// EVENT HANDLERS
// =========================

crawlQueue.on('completed', (job, result) => {
  console.log(`Crawl job ${job.id} completed:`, result);
});

crawlQueue.on('failed', (job, err) => {
  console.error(`Crawl job ${job?.id} failed:`, err.message);
});

embedQueue.on('completed', (job, result) => {
  console.log(`Embed job ${job.id} completed:`, result);
});

embedQueue.on('failed', (job, err) => {
  console.error(`Embed job ${job?.id} failed:`, err.message);
});

metricsQueue.on('completed', (job, result) => {
  console.log(`Metrics job ${job.id} completed:`, result);
});

metricsQueue.on('failed', (job, err) => {
  console.error(`Metrics job ${job?.id} failed:`, err.message);
});

// =========================
// SCHEDULED JOBS
// =========================

// Schedule daily metrics aggregation
metricsQueue.add(
  'aggregate-daily',
  {},
  {
    repeat: {
      cron: '0 0 * * *', // Daily at midnight
    },
  }
);

// =========================
// GRACEFUL SHUTDOWN
// =========================

async function shutdown() {
  console.log('Shutting down worker...');
  
  await Promise.all([
    crawlQueue.close(),
    embedQueue.close(),
    metricsQueue.close(),
  ]);
  
  console.log('Worker shut down successfully');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// =========================
// START WORKER
// =========================

console.log('='.repeat(50));
console.log('🔧 Ratu Sovereign AI Worker');
console.log('='.repeat(50));
console.log(`Redis: ${REDIS_URL}`);
console.log(`Crawl Queue: ${crawlQueue.name}`);
console.log(`Embed Queue: ${embedQueue.name}`);
console.log(`Metrics Queue: ${metricsQueue.name}`);
console.log('='.repeat(50));
console.log('Worker started, waiting for jobs...');