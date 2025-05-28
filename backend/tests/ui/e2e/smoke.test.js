import { test, expect } from '@playwright/test';

test('smoke test', async ({ page }) => {
  console.log('Running smoke test...');
  await page.goto('https://example.com');
  const title = await page.title();
  console.log('Page title:', title);
  expect(title).toContain('Example Domain');
});
