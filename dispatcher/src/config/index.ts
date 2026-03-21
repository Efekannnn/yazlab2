import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.DISPATCHER_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  services: {
    auth: {
      name: 'auth-service',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      healthEndpoint: '/api/health',
    },
    product: {
      name: 'product-service',
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
      healthEndpoint: '/api/health',
    },
    order: {
      name: 'order-service',
      url: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
      healthEndpoint: '/api/health',
    },
  },

  mongo: {
    uri: process.env.DISPATCHER_MONGO_URI || 'mongodb://localhost:27017/dispatcher_db',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
} as const;
