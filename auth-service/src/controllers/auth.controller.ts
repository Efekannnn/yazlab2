import { Request, Response } from 'express';
import { IAuthService } from '../interfaces/IAuthService';

export class AuthController {
  constructor(private authService: IAuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
      });
      return;
    }

    try {
      const result = await this.authService.register({ email, password, role });
      res.status(201).json(result);
    } catch (err: any) {
      if (err.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          error: { code: 'EMAIL_ALREADY_EXISTS', message: 'Email already in use' },
        });
      } else {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request' },
        });
      }
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
      });
      return;
    }

    try {
      const result = await this.authService.login({ email, password });
      res.status(200).json(result);
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') {
        res.status(401).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
      } else {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request' },
        });
      }
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(400).json({
        error: { code: 'NO_TOKEN', message: 'No token provided' },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      await this.authService.logout(token);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err: any) {
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Logout failed' },
      });
    }
  };

  verifyToken = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(400).json({
        error: { code: 'NO_TOKEN', message: 'No token provided' },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.authService.verifyToken(token);
      res.status(200).json(payload);
    } catch (err: any) {
      res.status(401).json({
        error: { code: err.message, message: 'Token is invalid or expired' },
      });
    }
  };
}