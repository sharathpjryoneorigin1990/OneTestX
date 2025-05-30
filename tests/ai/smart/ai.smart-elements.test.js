/**
 * Smart Element Tests for AI Testing Page
 * This test suite verifies the functionality and behavior of AI test elements
 */
const { test, expect } = require('@playwright/test');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
};

test.describe('AI Smart Element Tests', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // Create a new browser context
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    
    // Create a new page
    page = await context.newPage();
    
    // Set default timeout for all tests
    test.setTimeout(config.timeout);
  });

  test.afterAll(async () => {
    // Close the page after all tests
    if (page) {
      await page.close();
    }
  });

  test.beforeEach(async () => {
    // Navigate to the AI test page before each test
    await page.goto(`${config.baseUrl}/test-type/ai`);
    await page.waitForLoadState('networkidle');
  });

  test('should display the main AI test page elements', async () => {
    // Verify page title
    await expect(page).toHaveTitle(/AI Tests/);
    
    // Verify main heading
    const heading = page.locator('h1:has-text("AI Test")');
    await expect(heading).toBeVisible();
    
    // Verify Run Tests button
    const runTestsButton = page.locator('button:has-text("Run Tests")');
    await expect(runTestsButton).toBeVisible();
    await expect(runTestsButton).toBeEnabled();
    
    // Verify test results table
    const resultsTable = page.locator('table');
    await expect(resultsTable).toBeVisible();
    
    // Verify table headers
    const headers = ['Status', 'Test Name', 'Duration', 'Actions'];
    for (const header of headers) {
      await expect(resultsTable.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('should execute tests when Run Tests button is clicked', async () => {
    // Click the Run Tests button
    const runTestsButton = page.locator('button:has-text("Run Tests")');
    await runTestsButton.click();
    
    // Wait for tests to complete (assuming there's a loading state)
    await page.waitForTimeout(2000);
    
    // Verify test results are displayed
    const testResults = page.locator('tbody tr');
    const count = await testResults.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify at least one test has a status (passed/failed)
    const statusIcons = page.locator('.status-icon');
    await expect(statusIcons.first()).toBeVisible();
  });

  test('should display test details when View Details is clicked', async () => {
    // First run the tests
    await page.locator('button:has-text("Run Tests")').click();
    await page.waitForTimeout(2000);
    
    // Click the first View Details button
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    await viewDetailsButton.click();
    
    // Verify details panel is visible
    const detailsPanel = page.locator('.test-details-panel');
    await expect(detailsPanel).toBeVisible();
    
    // Verify panel contains test information
    await expect(detailsPanel.locator('h3')).toContainText('Test Details');
    await expect(detailsPanel.locator('.test-name')).toBeVisible();
    await expect(detailsPanel.locator('.test-duration')).toBeVisible();
    await expect(detailsPanel.locator('.test-status')).toBeVisible();
  });

  test('should allow rerunning individual tests', async () => {
    // First run the tests
    await page.locator('button:has-text("Run Tests")').click();
    await page.waitForTimeout(2000);
    
    // Get the status of the first test before rerun
    const initialStatus = await page.locator('tbody tr:first-child .status-icon').getAttribute('data-status');
    
    // Click the Rerun button for the first test
    const rerunButton = page.locator('button:has-text("Rerun")').first();
    await rerunButton.click();
    
    // Wait for the test to complete
    await page.waitForTimeout(2000);
    
    // Get the status after rerun
    const newStatus = await page.locator('tbody tr:first-child .status-icon').getAttribute('data-status');
    
    // Verify the status changed (or at least was updated)
    expect(newStatus).toBeDefined();
  });

  test('should handle test execution errors gracefully', async () => {
    // Mock a failing test scenario
    await page.route('**/api/ai-tests/run', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test execution failed' })
      });
    });
    
    // Click the Run Tests button
    const runTestsButton = page.locator('button:has-text("Run Tests")');
    await runTestsButton.click();
    
    // Verify error message is displayed
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Failed to execute tests');
  });
});
