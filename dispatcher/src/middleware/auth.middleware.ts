import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export function createAuthMiddleware(secret: string) {
  const authService = new AuthService(secret);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (authService.isPublicRoute(req.method, req.path)) {
      next();
      return;
    }

    const token = authService.extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: { code: 'TOKEN_MISSING', message: 'Token gerekli' },
      });
      return;
    }

    const result = authService.verifyToken(token);

    if (!result.valid || !result.payload) {
      res.status(401).json({
        error: { code: 'TOKEN_INVALID', message: 'Gecersiz token' },
      });
      return;
    }

    if (authService.isAdminRoute(req.method, req.path) && result.payload.role !== 'admin') {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Bu islem icin admin yetkisi gerekli' },
      });
      return;
    }

    (req as Record<string, unknown>).user = result.payload;
    req.headers['x-user-id'] = result.payload.sub;
    req.headers['x-user-email'] = result.payload.email;
    req.headers['x-user-role'] = result.payload.role;

    next();
  };
}
