import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/product-db',
  nodeEnv: process.env.NODE_ENV || 'development',
};
