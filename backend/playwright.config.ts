import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['github']
  ],
  timeout: 30 * 1000,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
    timeout: 5000
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    // UI Test Projects
    {
      name: 'ui-smoke',
      testDir: './tests/ui/smoke',
      testMatch: /.*\.test\.[tj]s/,
      use: { 
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
      },
      retries: 1,
    },
    {
      name: 'ui-e2e',
      testDir: './tests/ui/e2e',
      testMatch: /.*\.flow\.test\.[tj]s/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      timeout: 60 * 1000, // Longer timeout for E2E tests
    },
    {
      name: 'ui-visual',
      testDir: './tests/ui/visual',
      testMatch: /.*\.visual\.test\.[tj]s/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      snapshotDir: './test-results/screenshots',
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.01,
          threshold: 0.2,
        },
      },
    },
    {
      name: 'ui-accessibility',
      testDir: './tests/ui/accessibility',
      testMatch: /.*\.a11y\.test\.[tj]s/,
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Cross-browser testing
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});