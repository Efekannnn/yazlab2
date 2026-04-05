import mongoose, { Schema, Document } from 'mongoose';

// Mongoose Document ile ürün alanlarını birleştiren tip tanımı
export interface ProductDocument extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0.01 }, // Fiyat sıfırdan büyük olmalı
    stock: { type: Number, required: true, min: 0 },    // Stok negatif olamaz
    category: { type: String, required: true },
  },
  { timestamps: true } // createdAt ve updatedAt otomatik eklenir
);

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema);
