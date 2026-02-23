/**
 * HTTP request logging middleware.
 *
 * Logs incoming requests and outgoing responses with:
 * - Request method, URL, and query parameters
 * - Response status code and duration
 * - Request ID for correlation
 * - User ID when authenticated
 */

import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/logger.js';

/**
 * Extend Express Request to include request ID.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Skip logging for certain paths (e.g., health checks, metrics).
 */
const SKIP_PATHS = ['/health', '/metrics', '/favicon.ico'];

/**
 * Request logging middleware.
 *
 * Assigns a unique request ID to each request and logs:
 * - Request start: method, path, query
 * - Request end: status, duration
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip logging for excluded paths
  if (SKIP_PATHS.some((path) => req.path === path)) {
    next();
    return;
  }

  // Generate unique request ID
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.requestId = requestId;

  // Capture start time
  const startTime = Date.now();

  // Log request start
  log.http('Request received', {
    requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.socket.remoteAddress,
  });

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req.user as { id?: string } | undefined)?.id;

    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId,
      contentLength: res.get('content-length'),
    };

    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      log.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      log.warn('Request error', logData);
    } else {
      log.http('Request completed', logData);
    }
  });

  // Set request ID in response header for client correlation
  res.setHeader('x-request-id', requestId);

  next();
}

/**
 * Get the request ID from the request object.
 * Useful for including in error responses or downstream services.
 */
export function getRequestId(req: Request): string | undefined {
  return req.requestId;
}

export default requestLogger;
