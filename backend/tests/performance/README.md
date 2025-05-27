# Performance Testing with K6

This directory contains performance tests for the application using [K6](https://k6.io/).

## Test Types

1. **Smoke Test** (`smoke.js`)
   - Quick verification that the system works under minimal load
   - 1 virtual user for 1 minute

2. **Load Test** (`load-test.js`)
   - Simulates average expected traffic
   - Ramps up to 50 users over 2 minutes, stays for 5 minutes, then ramps down

3. **Stress Test** (`stress-test.js`)
   - Pushes the system to its limits
   - Ramps up to 150 users with various endpoint testing

4. **Soak Test** (`soak-test.js`)
   - Long-running test to check for memory leaks
   - 10 users for 1 hour

## Running Tests

1. **Prerequisites**
   - Install K6: `winget install k6` (Windows) or `brew install k6` (macOS)

2. **Run a specific test**
   ```bash
   k6 run tests/performance/k6/smoke.js
   ```

3. **Run with environment variables**
   ```bash
   k6 run -e USERNAME=test -e PASSWORD=pass tests/performance/k6/load-test.js
   ```

4. **Run with HTML report**
   ```bash
   k6 run --out json=test_results.json tests/performance/k6/load-test.js
   k6 report test_results.json
   ```

## Test Results

- Results are output to the console by default
- For detailed analysis, use the `--out` flag to export to JSON
- Use `k6 report` to generate an HTML report from JSON results

## Adding New Tests

1. Create a new `.js` file in the `k6` directory
2. Import necessary functions from `config.js`
3. Define your test scenarios and thresholds
4. Update this README with details about the new test

## Best Practices

- Keep tests focused on specific scenarios
- Use realistic user behavior patterns
- Set appropriate thresholds for your requirements
- Run tests in a staging environment that mirrors production
- Monitor system resources during tests
