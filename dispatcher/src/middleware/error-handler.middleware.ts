import { Request, Response, NextFunction } from 'express';
import { AppError } from '../interfaces/IErrorHandler';

// Ağ bağlantı hatalarını temsil eden hata kodları
const NETWORK_ERROR_CODES = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH']);

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Downstream servise ulaşılamıyorsa 503 döndür
  if (err.code && NETWORK_ERROR_CODES.has(err.code)) {
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Downstream service is unavailable' } });
    return;
  }

  // Geçerli bir 4xx/5xx status yoksa 500 kullan
  const status = err.status && err.status >= 400 && err.status !== 200 ? err.status : 500;

  if (status >= 500) {
    // Bilinen hata kodu varsa olduğu gibi döndür, yoksa stack trace'i gizle
    if (err.code && err.status && err.status !== 500) {
      res.status(status).json({ error: { code: err.code, message: err.message ?? 'Service error' } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
    return;
  }

  // 4xx hataları hata kodu ve mesajıyla birlikte döndür
  res.status(status).json({
    error: {
      code: err.code ?? 'ERROR',
      message: err.message ?? 'An error occurred',
    },
  });
}
