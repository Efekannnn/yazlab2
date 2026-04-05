import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ILoggerService, LogEntry } from '../interfaces/ILoggerService';

// LoggerService bağımlılığı dışarıdan enjekte edilerek middleware döndürülür
export function createLoggerMiddleware(loggerService: ILoggerService): RequestHandler {
  return function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Yanıt tamamlandığında log kaydı oluştur
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      // Kimlik doğrulama header'larından kullanıcı bilgisi al
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;
      // Status koduna göre log seviyesini belirle
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

      // Log yazma hatası uygulamayı etkilemez
      loggerService.log(entry).catch(() => {});
    });

    next();
  };
}

// Path'e göre hedef servis adını döndürür
function resolveServiceName(path: string): string {
  if (path.startsWith('/api/auth')) return 'auth-service';
  if (path.startsWith('/api/products')) return 'product-service';
  if (path.startsWith('/api/orders')) return 'order-service';
  return 'dispatcher';
}
