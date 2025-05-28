// @ts-check
const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  console.log('Starting basic test...');
  
  // Simple navigation test
  await page.goto('https://example.com');
  const title = await page.title();
  console.log('Page title:', title);
  
  // Basic assertion
  expect(title).toContain('Example Domain');
  console.log('Test completed successfully');
});
