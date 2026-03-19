import { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/auth.controller';
import { IAuthService } from '../../src/interfaces/IAuthService';

describe('AuthController - Unit Tests', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<IAuthService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyToken: jest.fn(),
      logout: jest.fn(),
    };

    controller = new AuthController(mockAuthService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('register()', () => {
    it('should return 201 and token on successful register', async () => {
      mockReq = {
        body: { email: 'test@test.com', password: 'Password123!' },
      };
      const mockResult = {
        token: 'jwt.token',
        user: { id: '1', email: 'test@test.com', role: 'user' },
      };
      mockAuthService.register.mockResolvedValue(mockResult);

      await controller.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 409 if email already exists', async () => {
      mockReq = {
        body: { email: 'existing@test.com', password: 'Password123!' },
      };
      mockAuthService.register.mockRejectedValue(new Error('EMAIL_ALREADY_EXISTS'));

      await controller.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'Email already in use' },
      });
    });

    it('should return 400 if body is missing fields', async () => {
      mockReq = { body: {} };
      mockAuthService.register.mockRejectedValue(new Error('VALIDATION_ERROR'));

      await controller.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login()', () => {
    it('should return 200 and token on successful login', async () => {
      mockReq = {
        body: { email: 'test@test.com', password: 'Password123!' },
      };
      const mockResult = {
        token: 'jwt.token',
        user: { id: '1', email: 'test@test.com', role: 'user' },
      };
      mockAuthService.login.mockResolvedValue(mockResult);

      await controller.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 401 on invalid credentials', async () => {
      mockReq = {
        body: { email: 'test@test.com', password: 'wrong' },
      };
      mockAuthService.login.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

      await controller.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    });
  });

  describe('logout()', () => {
    it('should return 200 on successful logout', async () => {
      mockReq = {
        headers: { authorization: 'Bearer jwt.token' },
      };
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should return 400 if no token provided', async () => {
      mockReq = { headers: {} };

      await controller.logout(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('verifyToken()', () => {
    it('should return 200 and payload for valid token', async () => {
      mockReq = {
        headers: { authorization: 'Bearer valid.token' },
      };
      const mockPayload = { sub: '1', email: 'test@test.com', role: 'user' };
      mockAuthService.verifyToken.mockResolvedValue(mockPayload);

      await controller.verifyToken(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayload);
    });

    it('should return 401 for invalid token', async () => {
      mockReq = {
        headers: { authorization: 'Bearer bad.token' },
      };
      mockAuthService.verifyToken.mockRejectedValue(new Error('INVALID_TOKEN'));

      await controller.verifyToken(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});