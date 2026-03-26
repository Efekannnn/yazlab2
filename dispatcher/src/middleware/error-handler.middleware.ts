import { Request, Response, NextFunction } from 'express';
import { AppError } from '../interfaces/IErrorHandler';

const NETWORK_ERROR_CODES = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH']);

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.code && NETWORK_ERROR_CODES.has(err.code)) {
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Downstream service is unavailable' } });
    return;
  }

  const status = err.status && err.status >= 400 && err.status !== 200 ? err.status : 500;

  if (status >= 500) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
    return;
  }

  res.status(status).json({
    error: {
      code: err.code ?? 'ERROR',
      message: err.message ?? 'An error occurred',
    },
  });
}
