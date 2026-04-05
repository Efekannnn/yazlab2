import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3003,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/order-db',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  nodeEnv: process.env.NODE_ENV || 'development',
};