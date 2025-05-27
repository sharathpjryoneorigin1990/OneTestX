import { check, sleep } from 'k6';
import { BASE_URL, getAuthHeaders, getCommonOptions } from '../config.js';

export const options = {
  ...getCommonOptions('Soak Test'),
  vus: 10,
  duration: '1h',  // Run for 1 hour
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'], // Stricter failure rate for soak test
  },
};

const endpoints = [
  { method: 'GET', path: '/api/dashboard' },
  { method: 'GET', path: '/api/tests' },
  { method: 'GET', path: '/api/users' },
];

export function setup() {
  // This runs once before the test
  console.log('Starting soak test...');
  return { startTime: new Date().toISOString() };
}

export default function (data) {
  const authHeaders = getAuthHeaders();
  
  // Test each endpoint
  endpoints.forEach(({ method, path }) => {
    const res = http.request(method, `${BASE_URL}${path}`, null, {
      headers: authHeaders,
    });
    
    check(res, {
      [`${method} ${path} status was 200`]: (r) => r.status === 200,
    });
    
    sleep(2); // Longer sleep to simulate real user behavior
  });
}

export function teardown(data) {
  // This runs once after the test
  console.log(`Soak test completed at ${new Date().toISOString()}`);
  console.log(`Test duration: ${(new Date() - new Date(data.startTime)) / 1000} seconds`);
}
