import { IProductService, Product, CreateProductData, ProductQuery, PaginatedProducts } from '../interfaces/IProductService';
import { ProductModel, ProductDocument } from '../models/product.model';
import { config } from '../config';

// MongoDB sorgusu için dinamik filtre yapısı
interface ProductFilter {
  category?: string;
}

// Mongoose Document'ını saf Product nesnesine dönüştürür
function toProduct(doc: ProductDocument): Product {
  return {
    id: doc._id?.toString() ?? doc.id,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    stock: doc.stock,
    category: doc.category,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class ProductService implements IProductService {
  // Ürün oluşturmadan önce iş kurallarını doğrular
  async create(data: CreateProductData): Promise<Product> {
    if (data.price <= 0) {
      throw new Error('Fiyat sifirdan buyuk olmali');
    }
    if (data.stock < 0) {
      throw new Error('Stok negatif olamaz');
    }

    const doc = await ProductModel.create(data);
    return toProduct(doc);
  }

  // ID ile tekil ürün arar; bulunamazsa null döner
  async findById(id: string): Promise<Product | null> {
    const doc = await ProductModel.findById(id);
    return doc ? toProduct(doc) : null;
  }

  // Sayfalama ve kategori filtresiyle ürün listesi döndürür
  async findAll(query: ProductQuery): Promise<PaginatedProducts> {
    const page = query.page || 1;
    const limit = query.limit || config.pagination.defaultLimit;
    const skip = (page - 1) * limit;

    const filter: ProductFilter = {};
    if (query.category) {
      filter.category = query.category;
    }

    const total = await ProductModel.countDocuments(filter);
    // En yeni ürünler önce gelecek şekilde sırala
    const docs = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      products: docs as Product[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Kısmi güncelleme — { new: true } ile güncellenmiş kaydı döndürür
  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(id, data, { new: true });
    return doc ? toProduct(doc) : null;
  }

  // Silme — kayıt bulunduysa true, bulunamadıysa false döner
  async delete(id: string): Promise<boolean> {
    const doc = await ProductModel.findByIdAndDelete(id);
    return doc !== null;
  }
}
