import mongoose from 'mongoose';
import app from './app';
import { config } from './config';

mongoose
  .connect(config.mongoUri)
  .then(() => {
    app.listen(config.port, () => {
      console.log(`product-service port ${config.port} uzerinde calisiyor`);
    });
  })
  .catch((err) => {
    console.error('MongoDB baglantisi basarisiz:', err);
    process.exit(1);
  });
