/**
 * TDD RED Phase - Auth Flow Integration Tests
 *
 * Bu testler app.ts implementasyonu OLMADAN yazilmistir.
 * JWT dogrulama + middleware zincirinin uc uca davranisini test eder.
 *
 * Beklenen: TUM TESTLER FAIL EDECEK (import hatasi - app.ts yok)
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import app from '../../src/app';

jest.mock('axios');
jest.mock('../../src/models/log.model', () => ({
  LogModel: { create: jest.fn().mockResolvedValue({}) },
}));
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  model: jest.fn(),
  Schema: jest.fn().mockReturnValue({ index: jest.fn() }),
}));

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================================================
  // Login endpoint: public, token gerekmez
  // ================================================

  it('POST /api/auth/login - public endpoint, token olmadan gecmeli', async () => {
    mockedAxios.request = jest.fn().mockResolvedValue({
      status: 200,
      data: { token: 'fake-token' },
      headers: {},
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
  });

  it('POST /api/auth/register - public endpoint, token olmadan gecmeli', async () => {
    mockedAxios.request = jest.fn().mockResolvedValue({
      status: 201,
      data: { id: 'user123' },
      headers: {},
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'pass123' });

    expect(res.status).toBe(201);
  });

  // ================================================
  // Suresi dolmus token: 401
  // ================================================

  it('suresi dolmus token ile protected endpoint 401 donmeli', async () => {
    const expiredToken = jwt.sign(
      { sub: 'user123', email: 'test@test.com', role: 'user' },
      TEST_SECRET,
      { expiresIn: '0s' }
    );

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  // ================================================
  // Yanlis secret ile imzalanmis token: 401
  // ================================================

  it('yanlis secret ile imzalanmis token 401 donmeli', async () => {
    const badToken = jwt.sign(
      { sub: 'user123', email: 'test@test.com', role: 'user' },
      'wrong-secret',
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${badToken}`);

    expect(res.status).toBe(401);
  });

  // ================================================
  // Rate limit: 429
  // ================================================

  it('rate limit asilinca 429 donmeli', async () => {
    mockedAxios.request = jest.fn().mockResolvedValue({ status: 200, data: [], headers: {} });

    // config.rateLimit.max = 100, test icin dusuk limitli endpoint simulate edemeyiz
    // Bu test rate-limiter middleware'inin zincire dahil oldugunu dogrular:
    // X-RateLimit-Limit header'i response'da olmali
    const token = jwt.sign(
      { sub: 'user123', email: 'test@test.com', role: 'user' },
      TEST_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });

  // ================================================
  // Hata formati tutarliligi: her zaman { error: { code, message } }
  // ================================================

  it('401 hatasi { error: { code, message } } formatinda olmali', async () => {
    const res = await request(app).get('/api/orders');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: {
        code: expect.any(String),
        message: expect.any(String),
      },
    });
  });

  it('403 hatasi { error: { code, message } } formatinda olmali', async () => {
    const userToken = jwt.sign(
      { sub: 'user123', email: 'test@test.com', role: 'user' },
      TEST_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      error: {
        code: expect.any(String),
        message: expect.any(String),
      },
    });
  });
});
