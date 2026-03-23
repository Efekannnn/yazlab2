import request from 'supertest';
import { Application } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../src/app';

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

describe('POST /api/auth/register', () => {
  it('should register a new user and return 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.user.role).toBe('user');
  });

  it('should return 409 if email already registered', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'Password123!' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'Password123!' });

    expect(res.status).toBe(400);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'Password123!' });
  });

  it('should login and return 200 with token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should return 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 if user not found', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'Password123!' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  let token: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'logout@test.com', password: 'Password123!' });
    token = res.body.token;
  });

  it('should return 200 on logout', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should return 400 if no token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/verify', () => {
  let token: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'verify@test.com', password: 'Password123!' });
    token = res.body.token;
  });

  it('should return 200 and payload for valid token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sub');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('role');
  });

  it('should return 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer bad.token.here');

    expect(res.status).toBe(401);
  });
});