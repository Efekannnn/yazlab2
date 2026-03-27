import request from 'supertest';
import app from '../../src/app';

jest.mock('../../src/models/product.model', () => ({
  ProductModel: {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

import { ProductModel } from '../../src/models/product.model';

const mockProduct = {
  _id: 'prod-1',
  id: 'prod-1',
  name: 'Test Urun',
  description: 'Test aciklamasi',
  price: 99.99,
  stock: 50,
  category: 'elektronik',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('Product Service Integration', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/health', () => {
    it('200 ve status ok donmeli', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok', service: 'product-service' });
    });
  });

  describe('GET /api/products', () => {
    it('200 ve urun listesi donmeli', async () => {
      (ProductModel.countDocuments as jest.Mock).mockResolvedValue(1);
      (ProductModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockProduct]),
      });

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 1, page: 1 });
      expect(res.body.products).toHaveLength(1);
    });

    it('page ve limit query parametrelerini desteklemeli', async () => {
      (ProductModel.countDocuments as jest.Mock).mockResolvedValue(30);
      (ProductModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockProduct]),
      });

      const res = await request(app).get('/api/products?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.totalPages).toBe(3);
    });
  });

  describe('GET /api/products/:id', () => {
    it('var olan urun icin 200 donmeli', async () => {
      (ProductModel.findById as jest.Mock).mockResolvedValue(mockProduct);

      const res = await request(app).get('/api/products/prod-1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'Test Urun' });
    });

    it('bulunmayan urun icin 404 donmeli', async () => {
      (ProductModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/products/yok');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
    });
  });

  describe('POST /api/products', () => {
    it('gecerli body ile 201 donmeli', async () => {
      (ProductModel.create as jest.Mock).mockResolvedValue(mockProduct);

      const res = await request(app)
        .post('/api/products')
        .set('x-user-role', 'admin')
        .send({ name: 'Test Urun', description: 'Desc', price: 99.99, stock: 10, category: 'elektronik' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Test Urun' });
    });

    it('eksik alan varsa 400 donmeli — asla 200 + hata degil', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('x-user-role', 'admin')
        .send({ name: 'Eksik' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
      expect(ProductModel.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/products/:id', () => {
    it('var olan urunu 200 ile guncellemeli', async () => {
      const updated = { ...mockProduct, price: 149.99 };
      (ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/products/prod-1')
        .send({ price: 149.99 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(149.99);
    });

    it('bulunmayan urun icin 404 donmeli', async () => {
      (ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/products/yok')
        .send({ price: 10 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('var olan urunu silip 200 donmeli', async () => {
      (ProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockProduct);

      const res = await request(app).delete('/api/products/prod-1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ message: expect.any(String) });
    });

    it('bulunmayan urun icin 404 donmeli', async () => {
      (ProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const res = await request(app).delete('/api/products/yok');

      expect(res.status).toBe(404);
    });
  });

  describe('Bilinmeyen endpoint', () => {
    it('GET /api/unknown 404 donmeli', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.status).toBe(404);
    });
  });
});
