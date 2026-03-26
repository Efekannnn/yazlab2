import { Router, Request, Response, NextFunction } from 'express';
import { ProxyService } from '../services/proxy.service';
import { AppError } from '../interfaces/IErrorHandler';

const router = Router();
const proxyService = new ProxyService();

router.all('*', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const target = proxyService.resolveTarget(req.path);

  if (!target) {
    const err: AppError = { status: 404, code: 'NOT_FOUND', message: `Route not found: ${req.path}` };
    next(err);
    return;
  }

  try {
    const result = await proxyService.forward(req, target);
    res.status(result.status).json(result.data);
  } catch {
    const err: AppError = { status: 503, code: 'SERVICE_UNAVAILABLE', message: `${target.name} is unavailable` };
    next(err);
  }
});

export default router;
