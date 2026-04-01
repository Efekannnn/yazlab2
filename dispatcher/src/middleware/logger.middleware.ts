import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ILoggerService, LogEntry } from '../interfaces/ILoggerService';

export function createLoggerMiddleware(loggerService: ILoggerService): RequestHandler {
  return function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      const entry: LogEntry = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        userId,
        userEmail,
        targetService: resolveServiceName(req.path),
        level,
        timestamp: new Date(),
      };

      loggerService.log(entry).catch(() => {});
    });

    next();
  };
}

function resolveServiceName(path: string): string {
  if (path.startsWith('/api/auth')) return 'auth-service';
  if (path.startsWith('/api/products')) return 'product-service';
  if (path.startsWith('/api/orders')) return 'order-service';
  return 'dispatcher';
}
