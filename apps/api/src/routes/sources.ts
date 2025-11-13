import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { createCrawler } from '@ratu/discovery';
import { createAuditLogger } from '@ratu/audit';
import { asyncHandler, validationError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

const auditLogger = createAuditLogger();

export function createSourceRoutes(): Router {
  const router = Router({ mergeParams: true });

  /**
   * POST /api/v1/orgs/:orgId/sources
   * Add data source
   */
  router.post(
    '/',
    [
      body('type').isIn(['website', 'pdf', 'api']).withMessage('Invalid source type'),
      body('url').isURL().withMessage('Valid URL is required'),
      body('crawl_rules').optional().isObject(),
    ],
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw validationError(errors.array());
      }

      const { orgId } = req.params;
      const { type, url, crawl_rules } = req.body;
      const sourceId = uuidv4();

      auditLogger.log({
        orgId,
        actorType: 'user',
        actorId: req.user?.userId || 'unknown',
        action: 'source.created',
        targetType: 'data_source',
        targetId: sourceId,
        payload: { type, url, crawl_rules },
        metadata: {},
      });

      res.status(201).json({
        source_id: sourceId,
        org_id: orgId,
        type,
        url,
        crawl_rules: crawl_rules || {},
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    })
  );

  /**
   * POST /api/v1/orgs/:orgId/sources/:sourceId/crawl
   * Trigger crawl
   */
  router.post(
    '/:sourceId/crawl',
    [
      body('mode').optional().isIn(['full', 'delta']).withMessage('Mode must be full or delta'),
    ],
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId, sourceId } = req.params;
      const { mode = 'delta' } = req.body;
      const jobId = uuidv4();

      auditLogger.log({
        orgId,
        actorType: 'user',
        actorId: req.user?.userId || 'unknown',
        action: 'source.crawl_started',
        targetType: 'data_source',
        targetId: sourceId,
        payload: { mode, job_id: jobId },
        metadata: {},
      });

      res.json({
        job_id: jobId,
        source_id: sourceId,
        mode,
        status: 'queued',
        created_at: new Date().toISOString(),
      });
    })
  );

  /**
   * GET /api/v1/orgs/:orgId/sources
   * List sources
   */
  router.get(
    '/',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId } = req.params;

      res.json({
        sources: [],
        total: 0,
      });
    })
  );

  /**
   * GET /api/v1/orgs/:orgId/sources/:sourceId
   * Get source details
   */
  router.get(
    '/:sourceId',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId, sourceId } = req.params;

      res.json({
        source_id: sourceId,
        org_id: orgId,
        type: 'website',
        url: 'https://example.com',
        status: 'active',
      });
    })
  );

  return router;
}