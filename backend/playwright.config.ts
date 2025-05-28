import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.{test,spec,flow.test}.[jt]s',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: false // Run in headed mode for debugging
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['line']
  ]
});