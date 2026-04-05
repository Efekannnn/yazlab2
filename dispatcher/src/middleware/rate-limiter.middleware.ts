import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimiterOptions } from '../interfaces/IRateLimiter';
import { config } from '../config';

// Her IP için istek sayısı ve pencere süresi bilgisini tutar
interface IpRecord {
  count: number;
  resetAt: number;
}

// Config'den gelen varsayılan rate limit ayarları
const DEFAULT_OPTIONS: RateLimiterOptions = {
  limit: config.rateLimit.max,
  windowMs: config.rateLimit.windowMs,
};

export function createRateLimiter(options: RateLimiterOptions = DEFAULT_OPTIONS): RequestHandler {
  const { limit, windowMs } = options;
  // IP bazlı istek kayıtlarını bellekte tutar
  const store = new Map<string, IpRecord>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();

    const record = store.get(ip);

    // Kayıt yoksa veya pencere süresi dolmuşsa sıfırla
    if (!record || now > record.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      res.set({ 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': String(limit - 1) });
      next();
      return;
    }

    // Limit aşıldıysa 429 döndür
    if (record.count >= limit) {
      res.set({ 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' });
      res.status(429).json({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } });
      return;
    }

    // Sayacı artır ve kalan hakkı header'a yaz
    record.count += 1;
    const remaining = Math.max(0, limit - record.count);
    res.set({ 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': String(remaining) });
    next();
  };
}
