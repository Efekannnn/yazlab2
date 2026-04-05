import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  // docker-compose'da MONGO_URI env değişkeniyle override edilir
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/product-db',
  nodeEnv: process.env.NODE_ENV || 'development',
  pagination: {
    defaultLimit: 20,  // Sayfa başına varsayılan ürün sayısı
    maxLimit: 100,     // İstemcinin alabileceği maksimum kayıt sayısı
  },
};
