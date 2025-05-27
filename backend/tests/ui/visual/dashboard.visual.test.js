const { test, expect } = require('@playwright/test');

// Configure visual comparison threshold (0-1)
const SCREENSHOT_OPTIONS = { threshold: 0.1 };

test.describe('Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should match dashboard screenshot', async ({ page }) => {
    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot('dashboard.png', SCREENSHOT_OPTIONS);
  });

  test('should display all dashboard widgets correctly', async ({ page }) => {
    // Check visibility of all dashboard widgets
    const widgets = ['revenue-chart', 'user-stats', 'recent-activity'];
    
    for (const widget of widgets) {
      await expect(page.locator(`[data-testid="${widget}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="${widget}"]`))
        .toHaveScreenshot(`${widget}.png`, SCREENSHOT_OPTIONS);
    }
  });
});
