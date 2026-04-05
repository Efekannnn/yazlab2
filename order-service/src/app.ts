import express, { Application, Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import orderRoutes from './routes/order.routes';

client.collectDefaultMetrics({ prefix: 'order_' });

export function createApp(): Application {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'order-service' });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });

  app.use('/api/orders', orderRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  });

  return app;
}