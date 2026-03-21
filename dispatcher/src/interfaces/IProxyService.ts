import { Request, Response } from 'express';

export interface ServiceTarget {
  name: string;
  url: string;
  healthEndpoint: string;
}

export interface ProxyResult {
  status: number;
  data: unknown;
  headers?: Record<string, string>;
}

export interface IProxyService {
  forward(req: Request, targetService: ServiceTarget): Promise<ProxyResult>;
  resolveTarget(path: string): ServiceTarget | null;
  checkHealth(service: ServiceTarget): Promise<boolean>;
}
