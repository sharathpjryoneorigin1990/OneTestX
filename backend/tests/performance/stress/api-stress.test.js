const { test, expect } = require('@playwright/test');

// Stress test example for API endpoints
test.describe('API Stress Test', () => {
  test('should handle high load on API', async ({ request }) => {
    // Test configuration
    const iterations = 50; // Number of requests to simulate
    const endpoint = '/api/your-endpoint';
    
    // Track response times
    const responseTimes = [];
    let errors = 0;
    
    // Run multiple requests
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        const response = await request.post(endpoint, {
          data: { test: `test-${i}` }
        });
        
        // Verify response status
        expect(response.status()).toBe(200);
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      } catch (error) {
        errors++;
        console.error(`Request ${i + 1} failed:`, error);
      }
    }
    
    // Calculate metrics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const successRate = ((iterations - errors) / iterations) * 100;
    
    console.log(`\nStress Test Results:`);
    console.log(`- Total Requests: ${iterations}`);
    console.log(`- Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`- Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    // Add assertions
    expect(successRate).toBeGreaterThanOrEqual(95); // At least 95% success rate
    expect(avgResponseTime).toBeLessThan(1000); // Avg response under 1s
  });
});
