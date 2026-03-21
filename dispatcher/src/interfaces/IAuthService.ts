export type UserRole = 'user' | 'admin';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface TokenVerificationResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

export interface IAuthService {
  verifyToken(token: string): TokenVerificationResult;
  extractToken(authHeader: string | undefined): string | null;
  isPublicRoute(method: string, path: string): boolean;
  isAdminRoute(method: string, path: string): boolean;
}
