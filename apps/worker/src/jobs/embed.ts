import { Job } from 'bull';
import { createRAGPipeline } from '@ratu/rag';
import { createMetricsCollector } from '@ratu/analytics';

const metricsCollector = createMetricsCollector();

export interface EmbedJobData {
  orgId: string;
  documents: Array<{
    id: string;
    uri: string;
    title: string;
    content: string;
  }>;
}

export async function processEmbedJob(job: Job<EmbedJobData>): Promise<any> {
  const { orgId, documents } = job.data;

  try {
    const rag = createRAGPipeline(orgId, `${orgId}-vectors`);
    const results = [];
    let totalEmbeddings = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      const result = await rag.ingest({
        ...doc,
        orgId,
      });

      results.push(result);
      totalEmbeddings += result.chunks;

      // Update progress
      const progress = Math.floor(((i + 1) / documents.length) * 100);
      await job.progress(progress);
    }

    // Record metrics
    metricsCollector.recordEmbeddings(orgId, totalEmbeddings);

    return {
      documents_processed: documents.length,
      total_chunks: totalEmbeddings,
      results,
    };
  } catch (error: any) {
    throw new Error(`Embed job failed: ${error.message}`);
  }
}