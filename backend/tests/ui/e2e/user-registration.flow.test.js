const { test, expect } = require('@playwright/test');

// Test data generation
const generateTestUser = () => ({
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Test@1234',
});

test.describe('User Registration E2E Flow', { tag: '@e2e' }, () => {
  let testUser;

  test.beforeEach(() => {
    testUser = generateTestUser();
  });

  test('should successfully register a new user', async ({ page, baseURL }) => {
    // Navigate to registration page
    await test.step('Navigate to registration page', async () => {
      await page.goto('/register');
      await expect(page).toHaveTitle(/Register/);
    });

    // Fill and submit registration form
    await test.step('Fill and submit registration form', async () => {
      // Fill out the form
      await page.fill('input[name="username"]', testUser.username);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);
      
      // Submit the form
      await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/api/auth/register') && 
          response.status() === 201
        ),
        page.click('button[type="submit"]')
      ]);
    });

    // Verify successful registration and redirection
    await test.step('Verify successful registration', async () => {
      // Check URL changed to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Verify welcome message
      await expect(page.locator('[data-testid="welcome-message"]'))
        .toContainText(testUser.username);
      
      // Verify success notification
      await expect(page.locator('[role="alert"]'))
        .toContainText('Registration successful');
    });
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await test.step('Navigate to registration page', async () => {
      await page.goto('/register');
    });

    // Test empty form submission
    await test.step('Test empty form validation', async () => {
      await page.click('button[type="submit"]');
      
      // Verify validation messages
      const requiredFields = ['username', 'email', 'password', 'confirmPassword'];
      for (const field of requiredFields) {
        await expect(page.locator(`[data-testid="${field}-error"]`))
          .toContainText('This field is required');
      }
    });

    // Test password mismatch
    await test.step('Test password mismatch validation', async () => {
      await page.fill('input[name="password"]', 'Password123');
      await page.fill('input[name="confirmPassword"]', 'Different123');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('[data-testid="confirmPassword-error"]'))
        .toContainText('Passwords do not match');
    });
  });

  test('should show error for existing username/email', async ({ page }) => {
    const existingUser = generateTestUser();
    
    // First register a user
    await test.step('Register initial user', async () => {
      await page.goto('/register');
      await page.fill('input[name="username"]', existingUser.username);
      await page.fill('input[name="email"]', existingUser.email);
      await page.fill('input[name="password"]', existingUser.password);
      await page.fill('input[name="confirmPassword"]', existingUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    // Try to register with same credentials
    await test.step('Attempt duplicate registration', async () => {
      await page.goto('/register');
      await page.fill('input[name="username"]', existingUser.username);
      await page.fill('input[name="email"]', 'newemail@example.com');
      await page.fill('input[name="password"]', existingUser.password);
      await page.fill('input[name="confirmPassword"]', existingUser.password);
      
      await page.click('button[type="submit"]');
      
      // Verify error message for duplicate username
      await expect(page.locator('[role="alert"]'))
        .toContainText('Username already exists');
    });
  });
});
