import express, { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { createLoggerMiddleware } from './middleware/logger.middleware';
import { createRateLimiter } from './middleware/rate-limiter.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { createMetricsMiddleware } from './middleware/metrics.middleware';
import proxyRoutes from './routes/proxy.routes';
import { LoggerService } from './services/logger.service';
import { ProxyService } from './services/proxy.service';
import { config } from './config';

// Varsayılan Node.js metriklerini dispatcher_ prefix'iyle kaydet
client.collectDefaultMetrics({ prefix: 'dispatcher_' });

const app = express();
const loggerService = new LoggerService();
const proxyService = new ProxyService();

// Middleware zinciri: JSON parse → metrik → loglama
app.use(express.json());
app.use(createMetricsMiddleware());
app.use(createLoggerMiddleware(loggerService));

// Auth kontrolünden önce tanımlanmalı — public endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'dispatcher' });
});

// Prometheus metriklerini döndüren endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Tanımsız route'ları auth kontrolünden önce yakala ve 404 döndür
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (!proxyService.resolveTarget(req.path)) {
    next({ status: 404, code: 'NOT_FOUND', message: `Route not found: ${req.path}` });
    return;
  }
  next();
});

// JWT doğrulama → rate limiting → proxy yönlendirme → hata yakalama
app.use(createAuthMiddleware(config.jwt.secret));
app.use(createRateLimiter());
app.use(proxyRoutes);
app.use(errorHandler);

export default app;
