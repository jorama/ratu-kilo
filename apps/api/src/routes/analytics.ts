import { Router, Response } from 'express';
import { createMetricsCollector } from '@ratu/analytics';
import { asyncHandler } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

const metricsCollector = createMetricsCollector();

export function createAnalyticsRoutes(): Router {
  const router = Router({ mergeParams: true });

  /**
   * GET /api/v1/orgs/:orgId/analytics/daily
   * Get daily metrics
   */
  router.get(
    '/daily',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const summaries = metricsCollector.getDailySummaries(orgId, days);

      res.json({
        org_id: orgId,
        summaries,
        period_days: days,
      });
    })
  );

  /**
   * GET /api/v1/orgs/:orgId/analytics/summary
   * Get summary metrics
   */
  router.get(
    '/summary',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId } = req.params;
      const startDate = req.query.start_date 
        ? new Date(req.query.start_date as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.end_date
        ? new Date(req.query.end_date as string)
        : new Date();

      const summary = metricsCollector.getSummary(orgId, startDate, endDate);

      res.json(summary);
    })
  );

  return router;
}