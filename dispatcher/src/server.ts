import mongoose from 'mongoose';
import app from './app';
import { config } from './config';

async function start(): Promise<void> {
  await mongoose.connect(config.mongo.uri);
  app.listen(config.port, () => {
    console.log(`Dispatcher running on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start dispatcher:', err);
  process.exit(1);
});
