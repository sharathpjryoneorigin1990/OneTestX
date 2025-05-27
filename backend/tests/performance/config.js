import http from 'k6/http';

// Base configuration for all tests
export const BASE_URL = 'http://localhost:3005';

// Common thresholds (95th percentile < 500ms, max < 2000ms)
export const COMMON_THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'max<2000'],
  http_req_failed: ['rate<0.1'], // Less than 10% failed requests
  iteration_duration: ['p(95)<1000'],
};

// Authentication helper
export function getAuthHeaders() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      username: __ENV.USERNAME || 'testuser',
      password: __ENV.PASSWORD || 'testpass',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return {
    'Authorization': `Bearer ${res.json('token')}`,
    'Content-Type': 'application/json',
  };
}

// Common options
export function getCommonOptions(testName) {
  return {
    ext: {
      loadimpact: {
        name: testName,
      },
    },
    thresholds: COMMON_THRESHOLDS,
  };
}
