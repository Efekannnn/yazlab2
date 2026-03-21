import jwt from 'jsonwebtoken';
import { IAuthService, JwtPayload, TokenVerificationResult } from '../interfaces/IAuthService';

export class AuthService implements IAuthService {
  private secret: string;

  private publicRoutes = [
    { method: 'POST', pattern: '/api/auth/login' },
    { method: 'POST', pattern: '/api/auth/register' },
    { method: 'GET', prefix: '/api/products' },
    { method: 'GET', pattern: '/api/health' },
  ];

  private adminRoutes = [
    { method: 'GET', pattern: '/api/logs' },
  ];

  constructor(secret: string) {
    this.secret = secret;
  }

  extractToken(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    return token.length > 0 ? token : null;
  }

  verifyToken(token: string): TokenVerificationResult {
    if (!token) {
      return { valid: false, error: 'Token is empty' };
    }

    try {
      const decoded = jwt.verify(token, this.secret) as JwtPayload;
      return { valid: true, payload: decoded };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Token verification failed';
      return { valid: false, error: message };
    }
  }

  isPublicRoute(method: string, path: string): boolean {
    return this.publicRoutes.some((route) => {
      if (route.method !== method) return false;
      if ('pattern' in route && route.pattern) return path === route.pattern;
      if ('prefix' in route && route.prefix) return path.startsWith(route.prefix);
      return false;
    });
  }

  isAdminRoute(method: string, path: string): boolean {
    return this.adminRoutes.some((route) => {
      return route.method === method && path.startsWith(route.pattern);
    });
  }
}
