import jwt from 'jsonwebtoken';
import { IAuthService, JwtPayload, TokenVerificationResult } from '../interfaces/IAuthService';

// Tam path eşleşmesi gerektiren route kuralı
type ExactRoute = { method: string; pattern: string };
// Prefix ile başlayan tüm path'leri kapsayan route kuralı
type PrefixRoute = { method: string; prefix: string };
// Discriminated union: her iki kural tipini tek çatıda toplar
type RouteRule = ExactRoute | PrefixRoute;

// JWT gerektirmeyen açık endpoint'ler
const PUBLIC_ROUTES: RouteRule[] = [
  { method: 'POST', pattern: '/api/auth/login' },
  { method: 'POST', pattern: '/api/auth/register' },
  { method: 'GET', prefix: '/api/products' },
  { method: 'GET', pattern: '/api/health' },
];

// Yalnızca admin rolüyle erişilebilen endpoint'ler
const ADMIN_ROUTES: ExactRoute[] = [
  { method: 'GET', pattern: '/api/logs' },
];

// Verilen route kuralının method ve path ile eşleşip eşleşmediğini kontrol eder
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

  // Authorization header'ından "Bearer <token>" formatını çözümler
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

  // Verilen method+path kombinasyonu public route listesinde mi?
  isPublicRoute(method: string, path: string): boolean {
    return PUBLIC_ROUTES.some((rule) => matchesRoute(rule, method, path));
  }

  // Verilen method+path kombinasyonu admin-only route listesinde mi?
  isAdminRoute(method: string, path: string): boolean {
    return ADMIN_ROUTES.some((rule) => matchesRoute(rule, method, path));
  }
}
