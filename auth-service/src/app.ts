import express, { Application, Request, Response, NextFunction } from 'express';
import authRoutes from './routes/auth.routes';

export function createApp(): Application {
  const app = express();

  app.use(express.json());

  // Routes
  app.use('/api/auth', authRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  });

  return app;
}