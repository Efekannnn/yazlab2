import { Request } from 'express';
import axios from 'axios';
import { IProxyService, ServiceTarget, ProxyResult } from '../interfaces/IProxyService';
import { config } from '../config';

// Axios'un fırlattığı hata nesnesinin tip tanımı
interface AxiosLikeError {
  response?: { status: number; data: unknown };
  code?: string;
}

export class ProxyService implements IProxyService {
  // Path prefix'ine göre hedef servisi belirleyen yönlendirme tablosu
  private routeMap: { prefix: string; target: ServiceTarget }[];

  constructor() {
    // /api/logs istekleri auth-service üzerinden karşılanır
    this.routeMap = [
      { prefix: '/api/auth', target: config.services.auth },
      { prefix: '/api/logs', target: config.services.auth },
      { prefix: '/api/products', target: config.services.product },
      { prefix: '/api/orders', target: config.services.order },
    ];
  }

  /** İstek path'ine göre hedef servisi döner. Eşleşme yoksa null. */
  resolveTarget(path: string): ServiceTarget | null {
    const match = this.routeMap.find((route) => path.startsWith(route.prefix));
    return match ? { ...match.target } : null;
  }

  /**
   * Gelen isteği hedef servise iletir. Downstream 4xx/5xx dönerse
   * hata fırlatmaz, status + data ile döner. Bağlantı yoksa Error fırlatır.
   */
  async forward(req: Request, targetService: ServiceTarget): Promise<ProxyResult> {
    const url = `${targetService.url}${req.path}`;

    const headers: Record<string, string> = {};
    // Yalnızca bu header'lar downstream'e iletilir
    const forwardHeaders = ['content-type', 'x-user-id', 'x-user-email', 'x-user-role'];

    for (const key of forwardHeaders) {
      if (req.headers[key]) {
        headers[key] = req.headers[key] as string;
      }
    }

    try {
      const response = await axios.request({
        method: req.method,
        url,
        headers,
        data: req.body,
        params: req.query,
        timeout: 10000, // 10 saniye zaman aşımı
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosLikeError;
      // Downstream hata döndürdüyse status ve datayı olduğu gibi ilet
      if (axiosError.response) {
        return {
          status: axiosError.response.status,
          data: axiosError.response.data,
        };
      }
      // Bağlantı kurulamadıysa hata fırlat (error-handler 503 döndürür)
      throw new Error(`Service unreachable: ${targetService.name}`);
    }
  }

  // Servisin /health endpoint'ine istek atarak ayakta olup olmadığını kontrol eder
  async checkHealth(service: ServiceTarget): Promise<boolean> {
    try {
      const response = await axios.get(`${service.url}${service.healthEndpoint}`, {
        timeout: 3000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
