import express, { Application, Request, Response, NextFunction } from 'express';
import orderRoutes from './routes/order.routes';

export function createApp(): Application {
  const app = express();

  app.use(express.json());

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