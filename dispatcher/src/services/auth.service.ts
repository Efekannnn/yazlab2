import jwt from 'jsonwebtoken';
import { IAuthService, JwtPayload, TokenVerificationResult } from '../interfaces/IAuthService';

type ExactRoute = { method: string; pattern: string };
type PrefixRoute = { method: string; prefix: string };
type RouteRule = ExactRoute | PrefixRoute;

const PUBLIC_ROUTES: RouteRule[] = [
  { method: 'POST', pattern: '/api/auth/login' },
  { method: 'POST', pattern: '/api/auth/register' },
  { method: 'GET', prefix: '/api/products' },
  { method: 'GET', pattern: '/api/health' },
];

const ADMIN_ROUTES: ExactRoute[] = [
  { method: 'GET', pattern: '/api/logs' },
];

function matchesRoute(rule: RouteRule, method: string, path: string): boolean {
  if (rule.method !== method) return false;
  if ('pattern' in rule) return path === rule.pattern;
  return path.startsWith(rule.prefix);
}

export class AuthService implements IAuthService {
  private readonly secret: string;

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

  /** JWT'yi doğrular. Geçerliyse payload, değilse error mesajı döner. */
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
    return PUBLIC_ROUTES.some((rule) => matchesRoute(rule, method, path));
  }

  isAdminRoute(method: string, path: string): boolean {
    return ADMIN_ROUTES.some((rule) => matchesRoute(rule, method, path));
  }
}
