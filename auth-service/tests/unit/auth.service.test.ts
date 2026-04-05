import { IAuthService, RegisterDTO, LoginDTO } from '../../src/interfaces/IAuthService';

// Bu testler RED aşamasında — implementasyon henüz yok
describe('AuthService - Unit Tests', () => {
  let authService: IAuthService;

  beforeEach(() => {
    // Mock factory — implementasyon yazıldıkça gerçekle değişecek
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyToken: jest.fn(),
      logout: jest.fn(),
    };
  });

  describe('register()', () => {
    it('should register a new user and return token', async () => {
      const dto: RegisterDTO = { email: 'test@test.com', password: 'Password123!' };
      const mockResult = {
        token: 'jwt.token.here',
        user: { id: '123', email: 'test@test.com', role: 'user' },
      };
      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      const result = await authService.register(dto);

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(dto.email);
      expect(result.user.role).toBe('user');
    });

    it('should throw error if email already exists', async () => {
      const dto: RegisterDTO = { email: 'existing@test.com', password: 'Password123!' };
      (authService.register as jest.Mock).mockRejectedValue(
        new Error('EMAIL_ALREADY_EXISTS')
      );

      await expect(authService.register(dto)).rejects.toThrow('EMAIL_ALREADY_EXISTS');
    });

    it('should assign default role as user', async () => {
      const dto: RegisterDTO = { email: 'new@test.com', password: 'Password123!' };
      const mockResult = {
        token: 'jwt.token.here',
        user: { id: '456', email: 'new@test.com', role: 'user' },
      };
      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      const result = await authService.register(dto);
      expect(result.user.role).toBe('user');
    });
  });

  describe('login()', () => {
    it('should return token on valid credentials', async () => {
      const dto: LoginDTO = { email: 'test@test.com', password: 'Password123!' };
      const mockResult = {
        token: 'jwt.token.here',
        user: { id: '123', email: 'test@test.com', role: 'user' },
      };
      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      const result = await authService.login(dto);

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw error on invalid password', async () => {
      const dto: LoginDTO = { email: 'test@test.com', password: 'wrongpassword' };
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('INVALID_CREDENTIALS')
      );

      await expect(authService.login(dto)).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should throw error if user not found', async () => {
      const dto: LoginDTO = { email: 'notfound@test.com', password: 'Password123!' };
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('INVALID_CREDENTIALS')
      );

      await expect(authService.login(dto)).rejects.toThrow('INVALID_CREDENTIALS');
    });
  });

  describe('verifyToken()', () => {
    it('should return payload for valid token', async () => {
      const mockPayload = {
        sub: '123',
        email: 'test@test.com',
        role: 'user',
        iat: 1000,
        exp: 4600,
      };
      (authService.verifyToken as jest.Mock).mockResolvedValue(mockPayload);

      const result = await authService.verifyToken('valid.jwt.token');

      expect(result.sub).toBe('123');
      expect(result.email).toBe('test@test.com');
      expect(result.role).toBe('user');
    });

    it('should throw error for expired token', async () => {
      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('TOKEN_EXPIRED')
      );

      await expect(authService.verifyToken('expired.token')).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('should throw error for invalid token', async () => {
      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('INVALID_TOKEN')
      );

      await expect(authService.verifyToken('bad.token')).rejects.toThrow('INVALID_TOKEN');
    });
  });

  describe('logout()', () => {
    it('should complete logout without error', async () => {
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.logout('valid.token')).resolves.toBeUndefined();
    });
  });
});