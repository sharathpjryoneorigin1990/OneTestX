import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,  // 1 virtual user
  duration: '10s',  // Run for 10 seconds
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% of requests should be below 1s
  },
};

const BASE_URL = 'http://localhost:3005';

export default function () {
  // Test a single endpoint
  const res = http.get(`${BASE_URL}/`);
  
  // Simple check if the response status is 200
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  // Short delay between requests
  sleep(0.5);
}
