import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export function createMetricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.path || '/';
      const method = req.method;
      const statusCode = String(res.statusCode);

      httpRequestsTotal.inc({ method, route, status_code: statusCode });
      httpRequestDurationSeconds.observe({ method, route, status_code: statusCode }, duration);
    });

    next();
  };
}
