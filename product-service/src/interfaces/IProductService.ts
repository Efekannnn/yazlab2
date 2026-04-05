// Uygulama genelinde kullanılan saf ürün veri modeli
export interface Product {
  id?: string;        // MongoDB ObjectId string olarak
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// GET /api/products için opsiyonel sorgu parametreleri
export interface ProductQuery {
  page?: number;
  limit?: number;
  category?: string;
}

// Sayfalanmış ürün listesi yanıt yapısı
export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

// Oluşturma isteğinde id, createdAt ve updatedAt gönderilmez
export type CreateProductData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

// Product servisinin dışa açık sözleşmesi
export interface IProductService {
  create(data: CreateProductData): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAll(query: ProductQuery): Promise<PaginatedProducts>;
  update(id: string, data: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}
