/**
 * TDD RED Phase - Rate Limiter Middleware Tests
 *
 * Bu testler implementasyon OLMADAN yazilmistir.
 * Amac: IP bazli istek sinirlamasi icin beklenen davranislari tanimlamak.
 *
 * Beklenen: TUM TESTLER FAIL EDECEK (import hatasi - modul yok)
 */

import { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from '../../src/middleware/rate-limiter.middleware';

describe('rateLimiter middleware', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const makeReq = (ip: string): Partial<Request> => ({
    ip,
    method: 'GET',
    path: '/api/products',
  });

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  // ================================================
  // Normal istek: next() cagrilir
  // ================================================

  it('should call next() when request count is within limit', () => {
    const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
    const req = makeReq('192.168.1.1');

    limiter(req as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  // ================================================
  // Limit asiminda 429 donulur
  // ================================================

  it('should return 429 when request limit is exceeded', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const req = makeReq('10.0.0.1');

    // 3 istek yapar (limit dolu)
    limiter(req as Request, mockRes as Response, jest.fn());
    limiter(req as Request, mockRes as Response, jest.fn());
    limiter(req as Request, mockRes as Response, jest.fn());

    // 4. istek: limit asimi
    limiter(req as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'RATE_LIMIT_EXCEEDED' }),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  // ================================================
  // X-RateLimit-Limit ve X-RateLimit-Remaining header'lari
  // ================================================

  it('should set X-RateLimit-Limit header', () => {
    const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
    const req = makeReq('172.16.0.1');

    limiter(req as Request, mockRes as Response, mockNext);

    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'X-RateLimit-Limit': '10' })
    );
  });

  it('should set X-RateLimit-Remaining header and decrement on each request', () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
    const req = makeReq('172.16.0.2');

    // 1. istek: 4 kalmali
    limiter(req as Request, mockRes as Response, mockNext);
    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'X-RateLimit-Remaining': '4' })
    );

    // 2. istek: 3 kalmali
    limiter(req as Request, mockRes as Response, mockNext);
    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'X-RateLimit-Remaining': '3' })
    );
  });

  it('should set X-RateLimit-Remaining to 0 when limit is reached (not negative)', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    const req = makeReq('172.16.0.3');

    limiter(req as Request, mockRes as Response, jest.fn());
    limiter(req as Request, mockRes as Response, jest.fn());

    // 3. istek: limit asimi, Remaining 0 olmali
    limiter(req as Request, mockRes as Response, mockNext);

    const setCalls = (mockRes.set as jest.Mock).mock.calls;
    const lastSetCall = setCalls[setCalls.length - 1][0];
    const remaining = parseInt(lastSetCall['X-RateLimit-Remaining'], 10);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });

  // ================================================
  // Farkli IP'ler bagimsiz sayac tutar
  // ================================================

  it('should track request counts independently per IP', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    const reqA = makeReq('1.1.1.1');
    const reqB = makeReq('2.2.2.2');

    // IP A: 2 istek (limit dolu)
    limiter(reqA as Request, mockRes as Response, jest.fn());
    limiter(reqA as Request, mockRes as Response, jest.fn());

    // IP B: ilk istegi olmali, next() cagrilmali
    const nextB = jest.fn();
    limiter(reqB as Request, mockRes as Response, nextB);

    expect(nextB).toHaveBeenCalled();
  });

  it('should block only the IP that exceeded the limit, not others', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const reqA = makeReq('3.3.3.3');
    const reqB = makeReq('4.4.4.4');

    // IP A: limiti assin
    limiter(reqA as Request, mockRes as Response, jest.fn());
    limiter(reqA as Request, { ...mockRes, status: jest.fn().mockReturnThis(), json: jest.fn() } as any, jest.fn());

    // IP B: hala serbest
    const nextB = jest.fn();
    limiter(reqB as Request, mockRes as Response, nextB);

    expect(nextB).toHaveBeenCalled();
  });
});
