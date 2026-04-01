import { Request } from 'express';
import axios from 'axios';
import { IProxyService, ServiceTarget, ProxyResult } from '../interfaces/IProxyService';
import { config } from '../config';

interface AxiosLikeError {
  response?: { status: number; data: unknown };
  code?: string;
}

export class ProxyService implements IProxyService {
  private routeMap: { prefix: string; target: ServiceTarget }[];

  constructor() {
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
        timeout: 10000,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosLikeError;
      if (axiosError.response) {
        return {
          status: axiosError.response.status,
          data: axiosError.response.data,
        };
      }
      throw new Error(`Service unreachable: ${targetService.name}`);
    }
  }

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
