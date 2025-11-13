import { Job } from 'bull';
import { createCrawler, createProvenanceLogger } from '@ratu/discovery';
import { createRAGPipeline } from '@ratu/rag';
import { createMetricsCollector } from '@ratu/analytics';

const metricsCollector = createMetricsCollector();

export interface CrawlJobData {
  orgId: string;
  sourceId: string;
  url: string;
  mode: 'full' | 'delta';
  maxDepth?: number;
  maxPages?: number;
}

export async function processCrawlJob(job: Job<CrawlJobData>): Promise<any> {
  const { orgId, sourceId, url, mode, maxDepth = 3, maxPages = 100 } = job.data;
  const provenance = createProvenanceLogger();
  const session = provenance.startSession(orgId, sourceId);

  try {
    // Update job progress
    await job.progress(10);

    // Initialize crawler
    const crawler = createCrawler({
      orgId,
      sourceId,
      startUrl: url,
      maxDepth,
      maxPages,
      respectRobotsTxt: true,
    });

    await job.progress(20);

    // Initialize RAG pipeline
    const rag = createRAGPipeline(orgId, `${orgId}-vectors`);
    let pagesProcessed = 0;

    // Crawl and process pages
    const stats = await crawler.crawl(async (result) => {
      pagesProcessed++;
      
      // Log page crawled
      provenance.logPageCrawled(session.id, result.url, {
        statusCode: result.metadata.statusCode,
        contentType: result.metadata.contentType,
        size: result.html.length,
        duration: 0,
      });

      // Ingest into RAG
      try {
        await rag.ingest({
          id: result.metadata.checksum,
          orgId,
          uri: result.url,
          title: result.title,
          content: result.content,
          metadata: {
            source_id: sourceId,
            checksum: result.metadata.checksum,
            last_modified: result.metadata.lastModified,
          },
        });

        provenance.logDocumentCreated(session.id, result.metadata.checksum, result.url);
      } catch (error: any) {
        provenance.logPageFailed(session.id, result.url, error.message);
      }

      // Update progress
      const progress = Math.min(90, 20 + (pagesProcessed / maxPages) * 70);
      await job.progress(progress);
    });

    // Record metrics
    metricsCollector.recordCrawl(orgId, stats.pagesVisited);

    // End session
    provenance.endSession(session.id, 'completed');

    await job.progress(100);

    return {
      session_id: session.id,
      pages_visited: stats.pagesVisited,
      pages_failed: stats.pagesFailed,
      total_bytes: stats.totalBytes,
      duration: stats.duration,
    };
  } catch (error: any) {
    provenance.endSession(session.id, 'failed', error.message);
    throw error;
  }
}