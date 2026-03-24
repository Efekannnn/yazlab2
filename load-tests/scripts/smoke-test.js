import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000';

export function setup() {
  // Register a test user
  const res = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ email: 'smoke@test.com', password: 'Password123!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: res.json('token') };
}

export default function (data) {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Get products (public)
  const productsRes = http.get(`${BASE_URL}/api/products`);
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  });

  // Get orders (auth required)
  const ordersRes = http.get(`${BASE_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  check(ordersRes, {
    'orders status is 200': (r) => r.status === 200,
  });

  sleep(1);
}