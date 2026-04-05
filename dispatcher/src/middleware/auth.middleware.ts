import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * JWT secret alarak auth middleware döner.
 * Public route → geçer. Token eksik/geçersiz → 401. Admin route + user rolü → 403.
 * Geçerli token'daki payload, downstream'e x-user-* header'ları ile iletilir.
 */
export function createAuthMiddleware(secret: string) {
  // JWT doğrulama ve route kontrolleri için AuthService örneği oluştur
  const authService = new AuthService(secret);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Public route ise kimlik doğrulama gerekmez, doğrudan geç
    if (authService.isPublicRoute(req.method, req.path)) {
      next();
      return;
    }

    // Authorization header'ından Bearer token'ı çıkar
    const token = authService.extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: { code: 'TOKEN_MISSING', message: 'Token gerekli' },
      });
      return;
    }

    // Token'ı doğrula ve payload'ı al
    const result = authService.verifyToken(token);

    if (!result.valid || !result.payload) {
      res.status(401).json({
        error: { code: 'TOKEN_INVALID', message: 'Gecersiz token' },
      });
      return;
    }

    // Admin route'u için rol kontrolü yap
    if (authService.isAdminRoute(req.method, req.path) && result.payload.role !== 'admin') {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Bu islem icin admin yetkisi gerekli' },
      });
      return;
    }

    // Kullanıcı bilgilerini downstream servislere header ile ilet
    (req as unknown as { user: typeof result.payload }).user = result.payload;
    req.headers['x-user-id'] = result.payload.sub;
    req.headers['x-user-email'] = result.payload.email;
    req.headers['x-user-role'] = result.payload.role;

    next();
  };
}
