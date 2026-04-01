/**
 * TDD RED Phase - Error Handler Middleware Tests
 *
 * Bu testler implementasyon OLMADAN yazilmistir.
 * Amac: HTTP hata yonetimi icin beklenen davranislari tanimlamak.
 *
 * Beklenen: TUM TESTLER FAIL EDECEK (import hatasi - modul yok)
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middleware/error-handler.middleware';

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  // ================================================
  // Temel format: { error: { code, message } }
  // HTTP 200 ASLA donulmez
  // ================================================

  it('should never return HTTP 200 for any error', () => {
    const err = { status: 200, message: 'Weird 200 error' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).not.toHaveBeenCalledWith(200);
  });

  it('should return JSON with error.code and error.message fields', () => {
    const err = { status: 400, code: 'VALIDATION_ERROR', message: 'Invalid input' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
        }),
      })
    );
  });

  // ================================================
  // 4xx hatalar oldugu gibi iletilir
  // ================================================

  it('should forward 400 Bad Request as-is', () => {
    const err = { status: 400, code: 'BAD_REQUEST', message: 'Bad request body' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'BAD_REQUEST' }),
      })
    );
  });

  it('should forward 401 Unauthorized as-is', () => {
    const err = { status: 401, code: 'UNAUTHORIZED', message: 'Token missing' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should forward 403 Forbidden as-is', () => {
    const err = { status: 403, code: 'FORBIDDEN', message: 'Access denied' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
  });

  it('should forward 404 Not Found as-is', () => {
    const err = { status: 404, code: 'NOT_FOUND', message: 'Route not found' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('should forward 429 Too Many Requests as-is', () => {
    const err = { status: 429, code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  // ================================================
  // Downstream erisilemediyse 503 donulur
  // ================================================

  it('should return 503 when downstream is unreachable (ECONNREFUSED)', () => {
    const err = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:3001' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(503);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'SERVICE_UNAVAILABLE' }),
      })
    );
  });

  it('should return 503 when downstream is unreachable (ETIMEDOUT)', () => {
    const err = { code: 'ETIMEDOUT', message: 'connect ETIMEDOUT' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(503);
  });

  // ================================================
  // Beklenmedik hatalar: 500 donulur, stack trace gizlenir
  // ================================================

  it('should return 500 for unexpected errors', () => {
    const err = new Error('Something went terribly wrong');

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
      })
    );
  });

  it('should hide stack trace in response for 500 errors', () => {
    const err = new Error('Secret internal error');
    err.stack = 'Error: Secret internal error\n    at sensitive/path/file.ts:42:10';

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
    expect(JSON.stringify(jsonCall)).not.toContain('sensitive/path');
    expect(JSON.stringify(jsonCall)).not.toContain('.ts:');
  });

  it('should return 500 for errors with no status field', () => {
    const err = { message: 'Unknown structural error' };

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
