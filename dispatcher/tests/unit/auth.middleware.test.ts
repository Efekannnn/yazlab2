/**
 * TDD RED Phase - Auth Middleware Tests
 * 
 * Bu testler AuthService implementasyonu OLMADAN yazilmistir.
 * Amac: JWT dogrulama ve route koruma mantigi icin beklenen davranislari tanimlamak.
 * 
 * Beklenen: TUM TESTLER FAIL EDECEK (import hatasi - modul yok)
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../src/services/auth.service';
import { createAuthMiddleware } from '../../src/middleware/auth.middleware';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(TEST_SECRET);
  });

  // ================================================
  // extractToken - Authorization header'dan token cikarma
  // ================================================
  describe('extractToken', () => {
    it('should extract token from valid Bearer header', () => {
      const token = authService.extractToken('Bearer eyJhbGciOiJIUzI1NiJ9.test');

      expect(token).toBe('eyJhbGciOiJIUzI1NiJ9.test');
    });

    it('should return null when header is undefined', () => {
      const token = authService.extractToken(undefined);

      expect(token).toBeNull();
    });

    it('should return null when header has no Bearer prefix', () => {
      const token = authService.extractToken('eyJhbGciOiJIUzI1NiJ9.test');

      expect(token).toBeNull();
    });

    it('should return null for empty Bearer value', () => {
      const token = authService.extractToken('Bearer ');

      expect(token).toBeNull();
    });

    it('should return null for "Bearer" without space', () => {
      const token = authService.extractToken('Bearertoken');

      expect(token).toBeNull();
    });
  });

  // ================================================
  // verifyToken - JWT token dogrulama
  // ================================================
  describe('verifyToken', () => {
    it('should return valid result for a correct token', () => {
      const payload = { sub: 'user123', email: 'test@test.com', role: 'user' };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

      const result = authService.verifyToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload!.sub).toBe('user123');
      expect(result.payload!.email).toBe('test@test.com');
      expect(result.payload!.role).toBe('user');
    });

    it('should return invalid result for expired token', () => {
      const payload = { sub: 'user123', email: 'test@test.com', role: 'user' };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '0s' });

      // Expired token'in dogrulanmasini bekle
      const result = authService.verifyToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid result for wrong secret', () => {
      const payload = { sub: 'user123', email: 'test@test.com', role: 'user' };
      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });

      const result = authService.verifyToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid result for malformed token', () => {
      const result = authService.verifyToken('not.a.valid.token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid result for empty string', () => {
      const result = authService.verifyToken('');

      expect(result.valid).toBe(false);
    });
  });

  // ================================================
  // isPublicRoute - Public/Protected route kontrolu
  // ================================================
  describe('isPublicRoute', () => {
    it('should return true for POST /api/auth/login', () => {
      expect(authService.isPublicRoute('POST', '/api/auth/login')).toBe(true);
    });

    it('should return true for POST /api/auth/register', () => {
      expect(authService.isPublicRoute('POST', '/api/auth/register')).toBe(true);
    });

    it('should return true for GET /api/products', () => {
      expect(authService.isPublicRoute('GET', '/api/products')).toBe(true);
    });

    it('should return true for GET /api/products/:id', () => {
      expect(authService.isPublicRoute('GET', '/api/products/abc123')).toBe(true);
    });

    it('should return true for GET /api/health', () => {
      expect(authService.isPublicRoute('GET', '/api/health')).toBe(true);
    });

    it('should return false for POST /api/products', () => {
      expect(authService.isPublicRoute('POST', '/api/products')).toBe(false);
    });

    it('should return false for DELETE /api/products/:id', () => {
      expect(authService.isPublicRoute('DELETE', '/api/products/abc123')).toBe(false);
    });

    it('should return false for GET /api/orders', () => {
      expect(authService.isPublicRoute('GET', '/api/orders')).toBe(false);
    });

    it('should return false for POST /api/orders', () => {
      expect(authService.isPublicRoute('POST', '/api/orders')).toBe(false);
    });
  });

  // ================================================
  // isAdminRoute - Admin-only route kontrolu
  // ================================================
  describe('isAdminRoute', () => {
    it('should return true for GET /api/logs', () => {
      expect(authService.isAdminRoute('GET', '/api/logs')).toBe(true);
    });

    it('should return false for GET /api/products', () => {
      expect(authService.isAdminRoute('GET', '/api/products')).toBe(false);
    });

    it('should return false for GET /api/orders', () => {
      expect(authService.isAdminRoute('GET', '/api/orders')).toBe(false);
    });
  });
});

// ================================================
// Auth Middleware Integration (Express middleware)
// ================================================
describe('authMiddleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/orders',
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should call next() for public routes without token', () => {
    mockReq.method = 'POST';
    mockReq.path = '/api/auth/login';

    const middleware = createAuthMiddleware(TEST_SECRET);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should return 401 when no Authorization header on protected route', () => {
    mockReq.path = '/api/orders';
    mockReq.headers = {};

    const middleware = createAuthMiddleware(TEST_SECRET);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'TOKEN_MISSING' }),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', () => {
    mockReq.path = '/api/orders';
    mockReq.headers = { authorization: 'Bearer invalid.token.here' };

    const middleware = createAuthMiddleware(TEST_SECRET);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'TOKEN_INVALID' }),
      })
    );
  });

  it('should call next() and attach user for valid token', () => {
    const payload = { sub: 'user123', email: 'test@test.com', role: 'user' };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

    mockReq.path = '/api/orders';
    mockReq.headers = { authorization: `Bearer ${token}` };

    const middleware = createAuthMiddleware(TEST_SECRET);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect((mockReq as any).user).toBeDefined();
    expect((mockReq as any).user.sub).toBe('user123');
  });

  it('should inject X-User-Id and X-User-Email headers for valid token', () => {
    const payload = { sub: 'user123', email: 'test@test.com', role: 'user' };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

    mockReq.path = '/api/orders';
    mockReq.headers = { authorization: `Bearer ${token}` };

    const middleware = createAuthMiddleware(TEST_SECRET);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.headers!['x-user-id']).toBe('user123');
    expect(mockReq.headers!['x-user-email']).toBe('test@test.com');
    expect(mockReq.headers!['x-user-role']).toBe('user');
  });

  it('should return 403 for admin route with non-admin user', () => {
    const payload = { sub: 'user123', email: 'test@test.com', role: 'user' };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

    mockReq.method = 'GET';
    mockReq.path = '/api/logs';
    mockReq.headers = { authorization: `Bearer ${token}` };

    const middleware = createAuthMiddleware(TEST_SECRET);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      })
    );
  });

  it('should allow admin user to access admin routes', () => {
    const payload = { sub: 'admin1', email: 'admin@test.com', role: 'admin' };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

    mockReq.method = 'GET';
    mockReq.path = '/api/logs';
    mockReq.headers = { authorization: `Bearer ${token}` };

    const middleware = createAuthMiddleware(TEST_SECRET);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
