const { test, expect } = require('@playwright/test');
const { default: axe } = require('@axe-core/playwright');

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Log in if needed
    await page.goto('/dashboard');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Configure and run axe-core
    const accessibilityScanResults = await new axe.AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Check for critical violations
    const criticalIssues = accessibilityScanResults.violations.filter(
      (issue) => issue.impact === 'critical' || issue.impact === 'serious'
    );

    // Log detailed information about any issues found
    if (criticalIssues.length > 0) {
      console.log('Accessibility issues found:', JSON.stringify(criticalIssues, null, 2));
    }

    // Assert no critical or serious issues
    expect(criticalIssues.length).toBe(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('id', 'main-navigation');
    
    // Test skip links
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to content');
  });
});
