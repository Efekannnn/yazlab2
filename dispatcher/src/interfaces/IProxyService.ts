import { Request } from 'express';

// Downstream servis bağlantı bilgileri
export interface ServiceTarget {
  name: string;
  url: string;
  healthEndpoint: string;
}

// Proxy iletiminin sonucu — downstream'den gelen status ve data
export interface ProxyResult {
  status: number;
  data: unknown;
  headers?: Record<string, string>;
}

// Proxy servisinin dışa açık sözleşmesi
export interface IProxyService {
  forward(req: Request, targetService: ServiceTarget): Promise<ProxyResult>;
  resolveTarget(path: string): ServiceTarget | null;
  checkHealth(service: ServiceTarget): Promise<boolean>;
}
