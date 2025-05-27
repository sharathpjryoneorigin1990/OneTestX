import { check, sleep } from 'k6';
import { BASE_URL, getAuthHeaders, getCommonOptions } from '../config.js';

export const options = {
  ...getCommonOptions('Stress Test'),
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 150 },  // Increase to 150 users
    { duration: '5m', target: 150 },  // Stay at 150 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Slightly higher threshold for stress
  },
};

const endpoints = [
  { method: 'GET', path: '/api/dashboard' },
  { method: 'POST', path: '/api/tests', body: { name: 'test', type: 'smoke' } },
  { method: 'GET', path: '/api/users' },
];

export default function () {
  const authHeaders = getAuthHeaders();
  
  endpoints.forEach(({ method, path, body }) => {
    const params = {
      headers: authHeaders,
    };
    
    const res = http.request(
      method,
      `${BASE_URL}${path}`,
      body ? JSON.stringify(body) : null,
      params
    );
    
    check(res, {
      [`${method} ${path} status was 2xx or 4xx`]: (r) => r.status >= 200 && r.status < 500,
    });
    
    sleep(0.5);
  });
}
