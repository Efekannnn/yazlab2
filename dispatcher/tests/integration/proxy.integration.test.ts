/**
 * TDD RED Phase - Proxy Integration Tests
 *
 * Bu testler app.ts implementasyonu OLMADAN yazilmistir.
 * Downstream servisler axios mock ile simule edilir.
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

const makeUserToken = (role = 'user') =>
  jwt.sign({ sub: 'user123', email: 'test@test.com', role }, TEST_SECRET, { expiresIn: '1h' });

const makeAdminToken = () =>
  jwt.sign({ sub: 'admin1', email: 'admin@test.com', role: 'admin' }, TEST_SECRET, { expiresIn: '1h' });

describe('Proxy Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================================================
  // Public endpoint: token olmadan 200
  // ================================================

  it('GET /api/products - public, token olmadan 200 donmeli', async () => {
    mockedAxios.request = jest.fn().mockResolvedValue({ status: 200, data: [], headers: {} });

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
  });

  // ================================================
  // Protected endpoint: token olmadan 401
  // ================================================

  it('GET /api/orders - token olmadan 401 donmeli', async () => {
    const res = await request(app).get('/api/orders');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  // ================================================
  // Gecerli token: downstream X-User-Id alir
  // ================================================

  it('GET /api/orders - gecerli token ile X-User-Id downstream e iletilmeli', async () => {
    mockedAxios.request = jest.fn().mockResolvedValue({ status: 200, data: [], headers: {} });

    await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${makeUserToken()}`);

    const callArgs = (mockedAxios.request as jest.Mock).mock.calls[0][0];
    expect(callArgs.headers['x-user-id']).toBe('user123');
    expect(callArgs.headers['x-user-email']).toBe('test@test.com');
  });

  // ================================================
  // Admin-only endpoint: user token ile 403
  // ================================================

  it('GET /api/logs - user token ile 403 donmeli', async () => {
    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${makeUserToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /api/logs - admin token ile downstream a iletilmeli', async () => {
    mockedAxios.request = jest.fn().mockResolvedValue({ status: 200, data: [], headers: {} });

    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
  });

  // ================================================
  // Bilinmeyen path: 404
  // ================================================

  it('GET /api/unknown - 404 donmeli', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // ================================================
  // Downstream cevap vermez: 503
  // ================================================

  it('GET /api/orders - downstream erisilemediyse 503 donmeli', async () => {
    mockedAxios.request = jest.fn().mockRejectedValue({ code: 'ECONNREFUSED' });

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${makeUserToken()}`);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  // ================================================
  // Hata response: asla { error: true } + 200 donmez
  // ================================================

  it('hata durumunda asla HTTP 200 donmemeli', async () => {
    mockedAxios.request = jest.fn().mockRejectedValue({ code: 'ECONNREFUSED' });

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${makeUserToken()}`);

    expect(res.status).not.toBe(200);
  });
});
