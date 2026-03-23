export interface RegisterDTO {
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface IAuthService {
  register(dto: RegisterDTO): Promise<AuthResult>;
  login(dto: LoginDTO): Promise<AuthResult>;
  verifyToken(token: string): Promise<TokenPayload>;
  logout(token: string): Promise<void>;
}