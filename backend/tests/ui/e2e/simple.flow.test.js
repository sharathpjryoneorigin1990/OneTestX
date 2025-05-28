import { test, expect } from '@playwright/test';

test('basic test', async ({ page, browserName }) => {
  console.log('Test started with browser:', browserName);
  
  try {
    console.log('Navigating to example.com...');
    const response = await page.goto('https://example.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('Navigation status:', response?.status());
    console.log('Page URL:', page.url());
    
    const title = await page.title();
    console.log('Page title:', title);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/example.png' });
    console.log('Screenshot saved to: test-results/example.png');
    
    // Verify the title
    expect(title).toContain('Example Domain');
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
});
