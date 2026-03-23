import request from 'supertest';
import { Application } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../../src/app';


let mongoServer: MongoMemoryServer;
let app: Application;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const userHeaders = {
  'x-user-id': 'user1',
  'x-user-email': 'test@test.com',
  'x-user-role': 'user',
};

const adminHeaders = {
  'x-user-id': 'admin1',
  'x-user-email': 'admin@test.com',
  'x-user-role': 'admin',
};

describe('POST /api/orders', () => {
  it('should create order and return 201', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(userHeaders)
      .send({
        items: [{ productId: 'prod1', quantity: 2, price: 50 }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.totalPrice).toBe(100);
    expect(res.body.status).toBe('pending');
  });

  it('should return 400 if items are empty', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(userHeaders)
      .send({ items: [] });

    expect(res.status).toBe(400);
  });

  it('should return 400 if user headers missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: 'prod1', quantity: 1, price: 50 }] });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/orders')
      .set(userHeaders)
      .send({ items: [{ productId: 'prod1', quantity: 1, price: 50 }] });
  });

  it('should return 200 with orders list', async () => {
    const res = await request(app).get('/api/orders').set(userHeaders);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('admin should see all orders', async () => {
    const res = await request(app).get('/api/orders').set(adminHeaders);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/orders/:id', () => {
  let orderId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(userHeaders)
      .send({ items: [{ productId: 'prod1', quantity: 1, price: 50 }] });
    orderId = res.body.id;
  });

  it('should return 200 with order detail', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set(userHeaders);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
  });

  it('should return 404 for nonexistent order', async () => {
    const res = await request(app)
      .get('/api/orders/000000000000000000000000')
      .set(userHeaders);

    expect(res.status).toBe(404);
  });

  it('should return 403 if different user tries to access', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set({ 'x-user-id': 'user2', 'x-user-email': 'user2@test.com', 'x-user-role': 'user' });

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/orders/:id', () => {
  let orderId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(userHeaders)
      .send({ items: [{ productId: 'prod1', quantity: 1, price: 50 }] });
    orderId = res.body.id;
  });

  it('should return 200 on status update', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}`)
      .set(adminHeaders)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('should return 404 for nonexistent order', async () => {
    const res = await request(app)
      .put('/api/orders/000000000000000000000000')
      .set(adminHeaders)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/orders/:id', () => {
  let orderId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(userHeaders)
      .send({ items: [{ productId: 'prod1', quantity: 1, price: 50 }] });
    orderId = res.body.id;
  });

  it('should return 200 on successful delete', async () => {
    const res = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set(adminHeaders);

    expect(res.status).toBe(200);
  });

  it('should return 404 for nonexistent order', async () => {
    const res = await request(app)
      .delete('/api/orders/000000000000000000000000')
      .set(adminHeaders);

    expect(res.status).toBe(404);
  });
});