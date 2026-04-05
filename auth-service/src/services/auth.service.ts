import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { config } from '../config';
import {
  IAuthService,
  RegisterDTO,
  LoginDTO,
  AuthResult,
  TokenPayload,
} from '../interfaces/IAuthService';

export class AuthService implements IAuthService {
  async register(dto: RegisterDTO): Promise<AuthResult> {
    const existing = await UserModel.findOne({ email: dto.email });
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    if (!dto.email || !dto.password) {
      throw new Error('VALIDATION_ERROR');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await UserModel.create({
      email: dto.email,
      password: hashedPassword,
      role: dto.role || 'user',
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async login(dto: LoginDTO): Promise<AuthResult> {
    if (!dto.email || !dto.password) {
      throw new Error('VALIDATION_ERROR');
    }

    const user = await UserModel.findOne({ email: dto.email });
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
      return payload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error('INVALID_TOKEN');
    }
  }

  async logout(_token: string): Promise<void> {
    // JWT stateless — client tarafında token silinir
    return;
  }

  private generateToken(id: string, email: string, role: string): string {
    return jwt.sign(
      { sub: id, email, role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  }
}