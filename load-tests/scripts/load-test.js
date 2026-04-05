import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const orderDuration = new Trend('order_creation_duration');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 200 },  // Ramp up to 200 users
    { duration: '1m', target: 200 },   // Stay at 200 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    error_rate: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000';

export function setup() {
  let res = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ email: 'loadtest@test.com', password: 'Password123!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status === 409 || !res.json('token')) {
    res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'loadtest@test.com', password: 'Password123!' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  return { token: res.json('token') };
}

export function handleSummary(data) {
  return {
    './load-tests/results/load-summary.json': JSON.stringify(data, null, 2),
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // Scenario 1: List products
  const productsRes = http.get(`${BASE_URL}/api/products`);
  check(productsRes, {
    'list products 200': (r) => r.status === 200,
  });
  errorRate.add(productsRes.status !== 200);

  sleep(0.5);

  // Scenario 2: Create order
  const startTime = Date.now();
  const orderRes = http.post(
    `${BASE_URL}/api/orders`,
    JSON.stringify({
      items: [{ productId: 'test-product', quantity: 1, price: 50 }],
    }),
    { headers }
  );
  orderDuration.add(Date.now() - startTime);
  check(orderRes, {
    'create order 201': (r) => r.status === 201,
  });
  errorRate.add(orderRes.status !== 201);

  sleep(0.5);

  // Scenario 3: List orders
  const ordersRes = http.get(`${BASE_URL}/api/orders`, { headers });
  check(ordersRes, {
    'list orders 200': (r) => r.status === 200,
  });
  errorRate.add(ordersRes.status !== 200);

  sleep(1);
}