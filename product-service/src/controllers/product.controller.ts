import { Request, Response } from 'express';
import { IProductService, Product } from '../interfaces/IProductService';

/**
 * RMM Seviye 3 — HATEOAS: Ürün nesnesine ilgili endpoint linkleri ekler.
 * Her yanıt istemciye sonraki adımları söyler (self, update, delete, all).
 */
function withLinks(product: Product): object {
  const id = product.id;
  return {
    ...product,
    _links: {
      self:   { href: `/api/products/${id}`, method: 'GET' },
      update: { href: `/api/products/${id}`, method: 'PUT' },
      delete: { href: `/api/products/${id}`, method: 'DELETE' },
      all:    { href: '/api/products', method: 'GET' },
    },
  };
}

export class ProductController {
  // IProductService bağımlılığı constructor üzerinden enjekte edilir (DI)
  constructor(private readonly productService: IProductService) {}

  // GET /api/products — sayfalama ve kategori filtresiyle ürün listesi
  async getAll(req: Request, res: Response): Promise<void> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const category = req.query.category as string | undefined;

    const result = await this.productService.findAll({ page, limit, category });
    // Liste yanıtına da koleksiyon düzeyinde HATEOAS linkleri eklenir
    res.status(200).json({
      ...result,
      products: result.products.map(withLinks),
      _links: {
        self:   { href: '/api/products', method: 'GET' },
        create: { href: '/api/products', method: 'POST' },
      },
    });
  }

  // GET /api/products/:id — tek ürün; bulunamazsa 404
  async getById(req: Request, res: Response): Promise<void> {
    const product = await this.productService.findById(req.params.id);

    if (!product) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Urun bulunamadi' } });
      return;
    }

    res.status(200).json(withLinks(product));
  }

  // POST /api/products — zorunlu alan kontrolü yapıldıktan sonra ürün oluşturur
  async create(req: Request, res: Response): Promise<void> {
    const { name, description, price, stock, category } = req.body;

    if (!name || !description || price === undefined || stock === undefined || !category) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Zorunlu alanlar eksik' } });
      return;
    }

    const product = await this.productService.create({ name, description, price, stock, category });
    res.status(201).json(withLinks(product));
  }

  // PUT /api/products/:id — kısmi güncelleme; bulunamazsa 404
  async update(req: Request, res: Response): Promise<void> {
    const product = await this.productService.update(req.params.id, req.body);

    if (!product) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Urun bulunamadi' } });
      return;
    }

    res.status(200).json(withLinks(product));
  }

  // DELETE /api/products/:id — silme; bulunamazsa 404
  async remove(req: Request, res: Response): Promise<void> {
    const deleted = await this.productService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Urun bulunamadi' } });
      return;
    }

    res.status(200).json({ message: 'Urun silindi' });
  }
}
