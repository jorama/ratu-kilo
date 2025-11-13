import { Request, Response, NextFunction } from 'express';

// =========================
// ERROR HANDLER MIDDLEWARE
// =========================

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Global error handler
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    error: err.name || 'Error',
    message: err.message || 'An unexpected error occurred',
    code: err.code,
    details: err.details,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
}

/**
 * Async handler wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error
 */
export function createError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Not found error
 */
export function notFoundError(resource: string = 'Resource'): ApiError {
  return createError(`${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Validation error
 */
export function validationError(details: any): ApiError {
  return createError('Validation failed', 400, 'VALIDATION_ERROR', details);
}

/**
 * Unauthorized error
 */
export function unauthorizedError(message: string = 'Unauthorized'): ApiError {
  return createError(message, 401, 'UNAUTHORIZED');
}

/**
 * Forbidden error
 */
export function forbiddenError(message: string = 'Forbidden'): ApiError {
  return createError(message, 403, 'FORBIDDEN');
}