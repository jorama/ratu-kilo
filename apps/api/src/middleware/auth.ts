import { Request, Response, NextFunction } from 'express';
import { createJWTService, createApiKeyService } from '@ratu/auth';

// =========================
// AUTH MIDDLEWARE
// =========================

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    orgId: string;
    role: string;
    email?: string;
  };
}

const jwtService = createJWTService();
const apiKeyService = createApiKeyService();

/**
 * Authentication middleware
 * Supports both JWT tokens and API keys
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      return;
    }

    const [type, credentials] = authHeader.split(' ');

    if (type === 'Bearer') {
      // JWT authentication
      try {
        const payload = jwtService.verify(credentials);
        req.user = {
          userId: payload.userId,
          orgId: payload.orgId,
          role: payload.role,
          email: payload.email,
        };
        next();
      } catch (error: any) {
        res.status(401).json({
          error: 'Unauthorized',
          message: error.message || 'Invalid token',
        });
        return;
      }
    } else if (credentials.startsWith('ratu_')) {
      // API key authentication
      const parsed = apiKeyService.parseKey(credentials);
      
      if (!parsed) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid API key format',
        });
        return;
      }

      // In production, verify against database
      // For now, we'll accept any valid format
      req.user = {
        userId: 'api_key_user',
        orgId: req.params.orgId || 'unknown',
        role: 'BOT',
      };
      next();
    } else {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization type',
      });
      return;
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}

/**
 * Optional auth middleware (doesn't fail if no auth)
 */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      await authMiddleware(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    next();
  }
}