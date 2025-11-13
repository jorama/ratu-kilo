import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { createAuditLogger } from '@ratu/audit';
import { asyncHandler, validationError } from '../middleware/error';

const auditLogger = createAuditLogger();

export function createOrgRoutes(): Router {
  const router = Router();

  /**
   * POST /api/v1/orgs
   * Create new organization
   */
  router.post(
    '/',
    [
      body('name').isString().notEmpty().withMessage('Name is required'),
      body('slug').isString().notEmpty().withMessage('Slug is required'),
      body('admin_email').isEmail().withMessage('Valid admin email is required'),
    ],
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw validationError(errors.array());
      }

      const { name, slug, admin_email } = req.body;
      const orgId = uuidv4();
      const nodeId = uuidv4();
      const vectorNamespace = `${slug}-${orgId.substring(0, 8)}`;

      // In production, save to database
      auditLogger.log({
        orgId,
        actorType: 'system',
        actorId: 'api',
        action: 'org.created',
        targetType: 'organization',
        targetId: orgId,
        payload: { name, slug, admin_email },
        metadata: {},
      });

      res.status(201).json({
        org_id: orgId,
        node_id: nodeId,
        name,
        slug,
        vector_namespace: vectorNamespace,
        admin_invite_token: `invite_${uuidv4()}`,
        created_at: new Date().toISOString(),
      });
    })
  );

  /**
   * GET /api/v1/orgs/:orgId
   * Get organization details
   */
  router.get(
    '/:orgId',
    asyncHandler(async (req: Request, res: Response) => {
      const { orgId } = req.params;

      // In production, fetch from database
      res.json({
        org_id: orgId,
        name: 'Demo Organization',
        slug: 'demo',
        created_at: new Date().toISOString(),
      });
    })
  );

  /**
   * PATCH /api/v1/orgs/:orgId
   * Update organization
   */
  router.patch(
    '/:orgId',
    [
      body('name').optional().isString(),
      body('settings').optional().isObject(),
    ],
    asyncHandler(async (req: Request, res: Response) => {
      const { orgId } = req.params;
      const updates = req.body;

      auditLogger.log({
        orgId,
        actorType: 'user',
        actorId: 'user_id',
        action: 'org.updated',
        targetType: 'organization',
        targetId: orgId,
        payload: updates,
        metadata: {},
      });

      res.json({
        org_id: orgId,
        ...updates,
        updated_at: new Date().toISOString(),
      });
    })
  );

  return router;
}