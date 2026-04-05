import { IProductService, Product } from '../../src/interfaces/IProductService';

// Mock mongoose model
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

import { ProductService } from '../../src/services/product.service';
import { ProductModel } from '../../src/models/product.model';

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

describe('ProductService', () => {
  let service: IProductService;

  beforeEach(() => {
    service = new ProductService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('gecerli veri ile urun olusturmali', async () => {
      (ProductModel.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.create({
        name: 'Test Urun',
        description: 'Test aciklamasi',
        price: 99.99,
        stock: 50,
        category: 'elektronik',
      });

      expect(result).toMatchObject({ name: 'Test Urun', price: 99.99 });
      expect(ProductModel.create).toHaveBeenCalledTimes(1);
    });

    it('fiyat sifir veya negatifse hata firlatmali', async () => {
      await expect(
        service.create({ name: 'X', description: 'Y', price: 0, stock: 1, category: 'A' })
      ).rejects.toThrow();
    });

    it('stok negatifse hata firlatmali', async () => {
      await expect(
        service.create({ name: 'X', description: 'Y', price: 10, stock: -1, category: 'A' })
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('var olan id icin urun donmeli', async () => {
      (ProductModel.findById as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.findById('prod-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('prod-1');
    });

    it('bulunmayan id icin null donmeli', async () => {
      (ProductModel.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('yok');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('varsayilan sayfalama ile urun listesi donmeli', async () => {
      (ProductModel.countDocuments as jest.Mock).mockResolvedValue(2);
      (ProductModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockProduct, mockProduct]),
      });

      const result = await service.findAll({});

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('page ve limit parametrelerini desteklemeli', async () => {
      (ProductModel.countDocuments as jest.Mock).mockResolvedValue(25);
      (ProductModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockProduct]),
      });

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(3);
    });

    it('kategori filtrelemesini desteklemeli', async () => {
      (ProductModel.countDocuments as jest.Mock).mockResolvedValue(1);
      const findMock = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockProduct]),
      });
      (ProductModel.find as jest.Mock).mockImplementation(findMock);

      await service.findAll({ category: 'elektronik' });

      expect(findMock).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'elektronik' })
      );
    });
  });

  describe('update', () => {
    it('var olan urunu guncellemeli ve guncel hali donmeli', async () => {
      const updated = { ...mockProduct, price: 149.99 };
      (ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await service.update('prod-1', { price: 149.99 });

      expect(result?.price).toBe(149.99);
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'prod-1',
        expect.anything(),
        expect.objectContaining({ new: true })
      );
    });

    it('bulunmayan urun icin null donmeli', async () => {
      (ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await service.update('yok', { price: 10 });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('var olan urunu silmeli ve true donmeli', async () => {
      (ProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.delete('prod-1');

      expect(result).toBe(true);
    });

    it('bulunmayan urun icin false donmeli', async () => {
      (ProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await service.delete('yok');

      expect(result).toBe(false);
    });
  });
});
