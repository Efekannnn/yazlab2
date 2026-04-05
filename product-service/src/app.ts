import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import client from 'prom-client';
import productRoutes from './routes/product.routes';

// Varsayılan Node.js metriklerini product_ prefix'iyle kaydet
client.collectDefaultMetrics({ prefix: 'product_' });

const app = express();

// Güvenlik başlıkları, CORS ve JSON parse
app.use(helmet());
app.use(cors());
app.use(express.json());

// Dispatcher'ın health check'i için — auth gerektirmez
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'product-service' });
});

// Prometheus scrape endpoint'i
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Tüm ürün endpoint'leri bu prefix altında toplanır
app.use('/api/products', productRoutes);

// Tanımsız tüm endpoint'ler için 404
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint bulunamadi' } });
});

export default app;
