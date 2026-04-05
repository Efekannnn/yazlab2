// Kullanıcı rol tipleri — JWT payload'ında taşınır
export type UserRole = 'user' | 'admin';

// JWT içeriği — tüm servisler bu yapıyı ortak kullanır
export interface JwtPayload {
  sub: string;      // Kullanıcı ID
  email: string;
  role: UserRole;
  iat: number;      // Token oluşturma zamanı
  exp: number;      // Token sona erme zamanı
}

// Token doğrulama sonucu — valid false ise payload boş gelir
export interface TokenVerificationResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

// Auth servisinin dışa açık sözleşmesi
export interface IAuthService {
  verifyToken(token: string): TokenVerificationResult;
  extractToken(authHeader: string | undefined): string | null;
  isPublicRoute(method: string, path: string): boolean;
  isAdminRoute(method: string, path: string): boolean;
}
