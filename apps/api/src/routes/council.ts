import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { createKimiClient, createCouncil } from '@ratu/llm';
import { createRAGPipeline } from '@ratu/rag';
import { createMetricsCollector } from '@ratu/analytics';
import { asyncHandler, validationError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

const metricsCollector = createMetricsCollector();

export function createCouncilRoutes(): Router {
  const router = Router({ mergeParams: true });

  /**
   * POST /api/v1/orgs/:orgId/council
   * Run council analysis
   */
  router.post(
    '/',
    [
      body('query').isString().notEmpty().withMessage('Query is required'),
      body('roles').optional().isArray(),
      body('strategy').optional().isIn(['deliberate', 'consensus', 'critic']),
      body('top_k').optional().isInt({ min: 1, max: 20 }),
    ],
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw validationError(errors.array());
      }

      const { orgId } = req.params;
      const { query, roles = ['researcher', 'analyst', 'editor'], strategy = 'consensus', top_k = 6 } = req.body;
      const startTime = Date.now();

      // 1. Retrieve context
      const rag = createRAGPipeline(orgId, `${orgId}-vectors`);
      const chunks = await rag.retrieve(query, { topK: top_k });
      const context = rag.buildContext(chunks);

      // 2. Run council
      const kimi = createKimiClient();
      const council = createCouncil(kimi);
      const result = await council.run(context, roles, { type: strategy });

      // 3. Calculate metrics
      const latency = Date.now() - startTime;
      metricsCollector.recordQuery(orgId, result.usage.tokensIn, result.usage.tokensOut, latency);

      // 4. Send response
      res.json({
        final: result.final,
        panel: result.panel,
        citations: result.citations,
        usage: result.usage,
        latency_ms: latency,
        strategy,
      });
    })
  );

  return router;
}