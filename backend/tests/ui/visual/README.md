# Visual Testing

This directory contains visual regression tests for the application. These tests capture screenshots of UI components and compare them against baseline images to detect visual regressions.

## Getting Started

### Prerequisites

- Node.js 16+
- Playwright (`npm install -D @playwright/test`)
- A running instance of the application (frontend and backend)

### Running Tests

1. **Run all visual tests**:
   ```bash
   npm run test:visual
   ```

2. **Update baseline images**:
   If you've made intentional UI changes, update the baseline images with:
   ```bash
   npm run test:visual:update
   ```

3. **Set up test directories**:
   ```bash
   npm run test:visual:setup
   ```

## Writing Visual Tests

1. Create a new test file in this directory (e.g., `homepage.visual.test.js`)
2. Use the following template:

```javascript
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs-extra');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// Test configuration
const SCREENSHOT_DIR = path.join(__dirname, '../../../screenshots');
const BASELINE_DIR = path.join(SCREENSHOT_DIR, 'baseline');
const ACTUAL_DIR = path.join(SCREENSHOT_DIR, 'actual');
const DIFF_DIR = path.join(SCREENSHOT_DIR, 'diffs');

test('homepage should match baseline', async ({ page }) => {
  // Navigate to the page
  await page.goto('/');
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  const testName = 'homepage';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baselinePath = path.join(BASELINE_DIR, `${testName}.png`);
  const actualPath = path.join(ACTUAL_DIR, `${testName}_${timestamp}.png`);
  const diffPath = path.join(DIFF_DIR, `${testName}_diff_${timestamp}.png`);
  
  // Take a screenshot
  await page.screenshot({ path: actualPath, fullPage: true });
  
  // Compare with baseline
  const baselineExists = await fs.pathExists(baselinePath);
  if (!baselineExists) {
    console.log('No baseline found. Creating baseline...');
    await fs.copy(actualPath, baselinePath);
    test.skip();
    return;
  }
  
  // Compare images and handle differences
  // ...
});
```

## Best Practices

1. **Use descriptive test names**: Clearly describe what's being tested
2. **Wait for page to load**: Use `waitForLoadState('networkidle')` to ensure the page is fully loaded
3. **Handle dynamic content**: Ignore or mask dynamic content that changes between test runs
4. **Keep tests focused**: Test one component or page per test
5. **Update baselines intentionally**: Only update baselines when you've made intentional UI changes

## Troubleshooting

- **Test failures**: Check the diff images in the `screenshots/diffs` directory
- **Missing baselines**: Run the test once to generate baseline images
- **Flaky tests**: Add more specific selectors or increase timeouts

## CI/CD Integration

Visual tests can be integrated into your CI/CD pipeline. Make sure to:

1. Install dependencies
2. Build the application
3. Start the application server
4. Run the visual tests
5. Store test artifacts (screenshots, diffs) for debugging
