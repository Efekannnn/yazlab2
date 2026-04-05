import { Router, Request, Response, NextFunction } from 'express';
import { ProxyService } from '../services/proxy.service';
import { AppError } from '../interfaces/IErrorHandler';

const router = Router();
const proxyService = new ProxyService();

// Tüm HTTP metodlarını yakalar ve hedef servise yönlendirir
router.all('*', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const target = proxyService.resolveTarget(req.path);

  // Bu noktada 404 kontrolü app.ts'de yapıldı; güvenlik için tekrar kontrol
  if (!target) {
    const err: AppError = { status: 404, code: 'NOT_FOUND', message: `Route not found: ${req.path}` };
    next(err);
    return;
  }

  try {
    // İsteği downstream servise ilet ve yanıtı olduğu gibi döndür
    const result = await proxyService.forward(req, target);
    res.status(result.status).json(result.data);
  } catch {
    // Bağlantı hatası: servis ulaşılamaz, 503 döndür
    const err: AppError = { status: 503, code: 'SERVICE_UNAVAILABLE', message: `${target.name} is unavailable` };
    next(err);
  }
});

export default router;
