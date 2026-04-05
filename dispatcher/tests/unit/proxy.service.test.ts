/**
 * TDD RED Phase - Proxy Service Tests
 * 
 * Bu testler ProxyService implementasyonu OLMADAN yazilmistir.
 * Amac: Servise yonlendirme mantigi icin beklenen davranislari tanimlamak.
 * 
 * Beklenen: TUM TESTLER FAIL EDECEK (import hatasi - modul yok)
 */

import { ProxyService } from '../../src/services/proxy.service';
import { ServiceTarget } from '../../src/interfaces/IProxyService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProxyService', () => {
  let proxyService: ProxyService;

  beforeEach(() => {
    proxyService = new ProxyService();
    jest.clearAllMocks();
  });

  // ================================================
  // resolveTarget - URL'den hedef servisi belirleme
  // ================================================
  describe('resolveTarget', () => {
    it('should resolve /api/auth/* paths to auth-service', () => {
      const target = proxyService.resolveTarget('/api/auth/login');

      expect(target).not.toBeNull();
      expect(target!.name).toBe('auth-service');
      expect(target!.url).toContain('3001');
    });

    it('should resolve /api/products/* paths to product-service', () => {
      const target = proxyService.resolveTarget('/api/products');

      expect(target).not.toBeNull();
      expect(target!.name).toBe('product-service');
      expect(target!.url).toContain('3002');
    });

    it('should resolve /api/products/:id paths to product-service', () => {
      const target = proxyService.resolveTarget('/api/products/abc123');

      expect(target).not.toBeNull();
      expect(target!.name).toBe('product-service');
    });

    it('should resolve /api/orders/* paths to order-service', () => {
      const target = proxyService.resolveTarget('/api/orders');

      expect(target).not.toBeNull();
      expect(target!.name).toBe('order-service');
      expect(target!.url).toContain('3003');
    });

    it('should resolve /api/orders/:id paths to order-service', () => {
      const target = proxyService.resolveTarget('/api/orders/xyz789');

      expect(target).not.toBeNull();
      expect(target!.name).toBe('order-service');
    });

    it('should return null for unknown paths', () => {
      const target = proxyService.resolveTarget('/api/unknown/route');

      expect(target).toBeNull();
    });

    it('should return null for root path', () => {
      const target = proxyService.resolveTarget('/');

      expect(target).toBeNull();
    });
  });

  // ================================================
  // forward - Istegi hedef servise yonlendirme
  // ================================================
  describe('forward', () => {
    const mockTarget: ServiceTarget = {
      name: 'product-service',
      url: 'http://product-service:3002',
      healthEndpoint: '/api/health',
    };

    it('should forward GET request and return response', async () => {
      const mockResponse = {
        status: 200,
        data: { data: [{ id: '1', name: 'Product 1' }] },
        headers: { 'content-type': 'application/json' },
      };
      mockedAxios.request.mockResolvedValue(mockResponse);

      const mockReq = {
        method: 'GET',
        path: '/api/products',
        headers: { 'content-type': 'application/json' },
        body: {},
        query: {},
      } as any;

      const result = await proxyService.forward(mockReq, mockTarget);

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should forward POST request with body', async () => {
      const requestBody = { name: 'New Product', price: 29.99 };
      const mockResponse = {
        status: 201,
        data: { data: { id: '2', ...requestBody } },
        headers: {},
      };
      mockedAxios.request.mockResolvedValue(mockResponse);

      const mockReq = {
        method: 'POST',
        path: '/api/products',
        headers: { 'content-type': 'application/json' },
        body: requestBody,
        query: {},
      } as any;

      const result = await proxyService.forward(mockReq, mockTarget);

      expect(result.status).toBe(201);
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: requestBody,
        })
      );
    });

    it('should forward custom headers (X-User-Id, X-User-Email)', async () => {
      mockedAxios.request.mockResolvedValue({ status: 200, data: {}, headers: {} });

      const mockReq = {
        method: 'GET',
        path: '/api/orders',
        headers: {
          'content-type': 'application/json',
          'x-user-id': 'user123',
          'x-user-email': 'test@test.com',
          'x-user-role': 'user',
        },
        body: {},
        query: {},
      } as any;

      await proxyService.forward(mockReq, mockTarget);

      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-user-id': 'user123',
            'x-user-email': 'test@test.com',
            'x-user-role': 'user',
          }),
        })
      );
    });

    it('should throw error when target service is unreachable', async () => {
      mockedAxios.request.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
      });

      const mockReq = {
        method: 'GET',
        path: '/api/products',
        headers: {},
        body: {},
        query: {},
      } as any;

      await expect(proxyService.forward(mockReq, mockTarget)).rejects.toThrow();
    });

    it('should propagate 4xx errors from target service', async () => {
      mockedAxios.request.mockRejectedValue({
        response: {
          status: 404,
          data: { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        },
      });

      const mockReq = {
        method: 'GET',
        path: '/api/products/nonexistent',
        headers: {},
        body: {},
        query: {},
      } as any;

      const result = await proxyService.forward(mockReq, mockTarget);

      expect(result.status).toBe(404);
    });
  });

  // ================================================
  // checkHealth - Servis saglik kontrolu
  // ================================================
  describe('checkHealth', () => {
    const mockTarget: ServiceTarget = {
      name: 'auth-service',
      url: 'http://auth-service:3001',
      healthEndpoint: '/api/health',
    };

    it('should return true when service is healthy', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'ok' },
      });

      const isHealthy = await proxyService.checkHealth(mockTarget);

      expect(isHealthy).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://auth-service:3001/api/health',
        expect.objectContaining({ timeout: expect.any(Number) })
      );
    });

    it('should return false when service is unreachable', async () => {
      mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));

      const isHealthy = await proxyService.checkHealth(mockTarget);

      expect(isHealthy).toBe(false);
    });

    it('should return false when service returns non-200', async () => {
      mockedAxios.get.mockResolvedValue({ status: 503 });

      const isHealthy = await proxyService.checkHealth(mockTarget);

      expect(isHealthy).toBe(false);
    });
  });
});
