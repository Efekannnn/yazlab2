import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import client from 'prom-client';
import productRoutes from './routes/product.routes';

client.collectDefaultMetrics({ prefix: 'product_' });

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'product-service' });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.use('/api/products', productRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint bulunamadi' } });
});

export default app;
