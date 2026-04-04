import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100
    { duration: '30s', target: 200 },  // Ramp up to 200
    { duration: '1m', target: 300 },   // Ramp up to 300
    { duration: '1m', target: 500 },   // Stress - 500 users
    { duration: '30s', target: 500 },  // Stay at 500
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
    error_rate: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:3000';

export function setup() {
  let res = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ email: 'stress@test.com', password: 'Password123!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status === 409 || !res.json('token')) {
    res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'stress@test.com', password: 'Password123!' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  return { token: res.json('token') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  const startTime = Date.now();

  // Random scenario selection
  const scenario = Math.floor(Math.random() * 4);

  switch (scenario) {
    case 0: {
      // List products
      const res = http.get(`${BASE_URL}/api/products`);
      check(res, { 'products 200': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
      requestCount.add(1);
      break;
    }
    case 1: {
      // Create order
      const res = http.post(
        `${BASE_URL}/api/orders`,
        JSON.stringify({
          items: [{ productId: 'stress-product', quantity: 1, price: 25 }],
        }),
        { headers }
      );
      check(res, { 'order created': (r) => r.status === 201 });
      errorRate.add(res.status !== 201);
      requestCount.add(1);
      break;
    }
    case 2: {
      // List orders
      const res = http.get(`${BASE_URL}/api/orders`, { headers });
      check(res, { 'orders 200': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
      requestCount.add(1);
      break;
    }
    case 3: {
      // Login
      const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: 'stress@test.com', password: 'Password123!' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      check(res, { 'login 200': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
      requestCount.add(1);
      break;
    }
  }

  responseTime.add(Date.now() - startTime);
  sleep(0.5);
}

export function handleSummary(data) {
  return {
    './load-tests/results/stress-summary.json': JSON.stringify(data, null, 2),
  };
}