import express, { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { createLoggerMiddleware } from './middleware/logger.middleware';
import { createRateLimiter } from './middleware/rate-limiter.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import proxyRoutes from './routes/proxy.routes';
import { LoggerService } from './services/logger.service';
import { ProxyService } from './services/proxy.service';
import { config } from './config';

client.collectDefaultMetrics({ prefix: 'dispatcher_' });

const app = express();
const loggerService = new LoggerService();
const proxyService = new ProxyService();

app.use(express.json());
app.use(createLoggerMiddleware(loggerService));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'dispatcher' });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Bilinmeyen route: auth'dan once 404 don
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (!proxyService.resolveTarget(req.path)) {
    next({ status: 404, code: 'NOT_FOUND', message: `Route not found: ${req.path}` });
    return;
  }
  next();
});

app.use(createAuthMiddleware(config.jwt.secret));
app.use(createRateLimiter());
app.use(proxyRoutes);
app.use(errorHandler);

export default app;
