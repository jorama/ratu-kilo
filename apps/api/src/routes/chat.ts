import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { createKimiClient } from '@ratu/llm';
import { createRAGPipeline } from '@ratu/rag';
import { createMetricsCollector } from '@ratu/analytics';
import { createAuditLogger } from '@ratu/audit';
import { asyncHandler, validationError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

// =========================
// CHAT ROUTES
// =========================

const metricsCollector = createMetricsCollector();
const auditLogger = createAuditLogger();

export function createChatRoutes(): Router {
  const router = Router({ mergeParams: true });

  /**
   * POST /api/v1/orgs/:orgId/chat
   * Send a chat message with RAG context
   */
  router.post(
    '/',
    [
      body('query').isString().notEmpty().withMessage('Query is required'),
      body('top_k').optional().isInt({ min: 1, max: 20 }).withMessage('top_k must be between 1 and 20'),
      body('citations').optional().isBoolean(),
      body('session_id').optional().isString(),
    ],
    asyncHandler(async (req: AuthRequest, res: Response) => {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw validationError(errors.array());
      }

      const { orgId } = req.params;
      const { query, top_k = 6, citations = true, session_id } = req.body;
      const startTime = Date.now();

      try {
        // 1. Initialize services
        const kimi = createKimiClient();
        const rag = createRAGPipeline(orgId, `${orgId}-vectors`);

        // 2. Retrieve relevant context
        const chunks = await rag.retrieve(query, { topK: top_k });
        const context = rag.buildContext(chunks);

        // 3. Build system prompt
        const systemPrompt = `You are Ratu, a sovereign AI assistant for ${orgId}.

Use the following context to answer the user's question. Always cite your sources using the [CIT:doc_id:chunk_ix] format.

Context:
${context}

If the context doesn't contain relevant information, say so clearly.`;

        // 4. Call Kimi K2
        const response = await kimi.complete(query, systemPrompt);

        // 5. Parse citations
        const parsedCitations = citations ? kimi.parseCitations(response) : [];

        // 6. Calculate metrics
        const latency = Date.now() - startTime;
        const tokensIn = context.length / 4; // Rough estimate
        const tokensOut = response.length / 4; // Rough estimate

        // 7. Record metrics
        metricsCollector.recordQuery(orgId, tokensIn, tokensOut, latency);

        // 8. Log audit event
        auditLogger.log({
          orgId,
          actorType: 'user',
          actorId: req.user?.userId || 'unknown',
          action: 'chat.message_sent',
          targetType: 'chat_session',
          targetId: session_id || 'new',
          payload: {
            query: query.substring(0, 100),
            chunks_retrieved: chunks.length,
          },
          metadata: {
            duration: latency,
          },
        });

        // 9. Send response
        res.json({
          session_id: session_id || `session_${Date.now()}`,
          answer: response,
          citations: parsedCitations.map(cit => ({
            doc_id: cit.docId,
            chunk_ix: cit.chunkIx,
            title: chunks.find(c => c.docId === cit.docId)?.metadata.title || 'Unknown',
            uri: chunks.find(c => c.docId === cit.docId)?.metadata.uri || '',
            snippet: chunks.find(c => c.docId === cit.docId)?.content.substring(0, 200) || '',
          })),
          usage: {
            tokens_in: Math.round(tokensIn),
            tokens_out: Math.round(tokensOut),
            total_tokens: Math.round(tokensIn + tokensOut),
          },
          latency_ms: latency,
          chunks_retrieved: chunks.length,
        });
      } catch (error: any) {
        // Record error
        metricsCollector.recordError(orgId, error.message);

        throw error;
      }
    })
  );

  /**
   * GET /api/v1/orgs/:orgId/chat/sessions
   * List chat sessions
   */
  router.get(
    '/sessions',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId } = req.params;

      // In production, fetch from database
      res.json({
        sessions: [],
        total: 0,
      });
    })
  );

  /**
   * GET /api/v1/orgs/:orgId/chat/sessions/:sessionId
   * Get chat session details
   */
  router.get(
    '/sessions/:sessionId',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId, sessionId } = req.params;

      // In production, fetch from database
      res.json({
        session_id: sessionId,
        org_id: orgId,
        messages: [],
        created_at: new Date().toISOString(),
      });
    })
  );

  /**
   * DELETE /api/v1/orgs/:orgId/chat/sessions/:sessionId
   * Delete chat session
   */
  router.delete(
    '/sessions/:sessionId',
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { orgId, sessionId } = req.params;

      // Log audit event
      auditLogger.log({
        orgId,
        actorType: 'user',
        actorId: req.user?.userId || 'unknown',
        action: 'chat.session_deleted',
        targetType: 'chat_session',
        targetId: sessionId,
        payload: {},
      });

      res.json({
        message: 'Session deleted successfully',
        session_id: sessionId,
      });
    })
  );

  return router;
}