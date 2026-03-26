import { Request, Response, NextFunction, RequestHandler } from 'express';

interface RateLimiterOptions {
  limit: number;
  windowMs: number;
}

interface IpRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  const { limit, windowMs } = options;
  const store = new Map<string, IpRecord>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();

    const record = store.get(ip);

    if (!record || now > record.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      res.set({ 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': String(limit - 1) });
      next();
      return;
    }

    if (record.count >= limit) {
      res.set({ 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' });
      res.status(429).json({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } });
      return;
    }

    record.count += 1;
    const remaining = Math.max(0, limit - record.count);
    res.set({ 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': String(remaining) });
    next();
  };
}
