import { Request, Response } from 'express';
import { ProductController } from '../../src/controllers/product.controller';
import { IProductService, Product, PaginatedProducts } from '../../src/interfaces/IProductService';

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Test Urun',
  description: 'Test aciklamasi',
  price: 99.99,
  stock: 50,
  category: 'elektronik',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPaginated: PaginatedProducts = {
  products: [mockProduct],
  total: 1,
  page: 1,
  totalPages: 1,
};

const mockService: jest.Mocked<IProductService> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

function mockRes(): { res: Response; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  const res = { json, status } as unknown as Response;
  return { res, json, status };
}

describe('ProductController', () => {
  let controller: ProductController;

  beforeEach(() => {
    controller = new ProductController(mockService);
    jest.clearAllMocks();
  });

  // ================================================
  // RMM Seviye 3 — HATEOAS _links kontrolu
  // ================================================

  describe('HATEOAS _links', () => {
    it('getById response _links objesi icermeli', async () => {
      mockService.findById.mockResolvedValue(mockProduct);
      const req = { params: { id: 'prod-1' } } as unknown as Request;
      const { res, json } = mockRes();

      await controller.getById(req, res);

      const response = json.mock.calls[0][0];
      expect(response._links).toBeDefined();
      expect(response._links.self.href).toContain('prod-1');
      expect(response._links.update.method).toBe('PUT');
      expect(response._links.delete.method).toBe('DELETE');
    });

    it('create response _links objesi icermeli', async () => {
      mockService.create.mockResolvedValue(mockProduct);
      const req = {
        body: { name: 'Test', description: 'Desc', price: 99.99, stock: 10, category: 'A' },
      } as unknown as Request;
      const { res, json } = mockRes();

      await controller.create(req, res);

      const response = json.mock.calls[0][0];
      expect(response._links).toBeDefined();
      expect(response._links.self).toBeDefined();
    });

    it('getAll response _links objesi icermeli', async () => {
      mockService.findAll.mockResolvedValue(mockPaginated);
      const req = { query: {} } as Request;
      const { res, json } = mockRes();

      await controller.getAll(req, res);

      const response = json.mock.calls[0][0];
      expect(response._links).toBeDefined();
      expect(response._links.self.href).toBe('/api/products');
    });
  });

  describe('GET /api/products - getAll', () => {
    it('200 ve urun listesi donmeli', async () => {
      mockService.findAll.mockResolvedValue(mockPaginated);
      const req = { query: {} } as Request;
      const { res, json, status } = mockRes();

      await controller.getAll(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ products: expect.any(Array), total: 1 })
      );
    });

    it('page ve limit query parametrelerini servise iletmeli', async () => {
      mockService.findAll.mockResolvedValue(mockPaginated);
      const req = { query: { page: '2', limit: '5' } } as unknown as Request;
      const { res } = mockRes();

      await controller.getAll(req, res);

      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 5 })
      );
    });
  });

  describe('GET /api/products/:id - getById', () => {
    it('var olan urun icin 200 donmeli', async () => {
      mockService.findById.mockResolvedValue(mockProduct);
      const req = { params: { id: 'prod-1' } } as unknown as Request;
      const { res, json, status } = mockRes();

      await controller.getById(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ id: 'prod-1' }));
    });

    it('bulunmayan urun icin 404 donmeli', async () => {
      mockService.findById.mockResolvedValue(null);
      const req = { params: { id: 'yok' } } as unknown as Request;
      const { res, json, status } = mockRes();

      await controller.getById(req, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
  });

  describe('POST /api/products - create', () => {
    it('gecerli body ile 201 donmeli', async () => {
      mockService.create.mockResolvedValue(mockProduct);
      const req = {
        body: { name: 'Test', description: 'Desc', price: 99.99, stock: 10, category: 'A' },
        headers: { 'x-user-role': 'admin' },
      } as unknown as Request;
      const { res, json, status } = mockRes();

      await controller.create(req, res);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Urun' }));
    });

    it('eksik zorunlu alan varsa 400 donmeli (asla 200 + hata degil)', async () => {
      const req = {
        body: { name: 'Test' },
        headers: { 'x-user-role': 'admin' },
      } as unknown as Request;
      const { res, json, status } = mockRes();

      await controller.create(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Object) })
      );
      expect(mockService.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/products/:id - update', () => {
    it('var olan urunu 200 ile guncellemeli', async () => {
      const updated = { ...mockProduct, price: 149.99 };
      mockService.update.mockResolvedValue(updated);
      const req = {
        params: { id: 'prod-1' },
        body: { price: 149.99 },
      } as unknown as Request;
      const { res, json, status } = mockRes();

      await controller.update(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ price: 149.99 }));
    });

    it('bulunmayan urun icin 404 donmeli', async () => {
      mockService.update.mockResolvedValue(null);
      const req = {
        params: { id: 'yok' },
        body: { price: 10 },
      } as unknown as Request;
      const { res, json, status } = mockRes();

      await controller.update(req, res);

      expect(status).toHaveBeenCalledWith(404);
    });
  });

  describe('DELETE /api/products/:id - remove', () => {
    it('var olan urunu silip 200 donmeli', async () => {
      mockService.delete.mockResolvedValue(true);
      const req = { params: { id: 'prod-1' } } as unknown as Request;
      const { res, json, status } = mockRes();

      await controller.remove(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    it('bulunmayan urun icin 404 donmeli', async () => {
      mockService.delete.mockResolvedValue(false);
      const req = { params: { id: 'yok' } } as unknown as Request;
      const { res, json, status } = mockRes();

      await controller.remove(req, res);

      expect(status).toHaveBeenCalledWith(404);
    });
  });
});
