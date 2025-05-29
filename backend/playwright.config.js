// @ts-check
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const isCI = !!process.env.CI;
const isVisualUpdate = process.env.UPDATE_BASELINES === 'true';

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file
  testDir: './tests',
  
  // Global test timeout (30 seconds)
  timeout: 30000,
  
  // Expect timeout (5 seconds)
  expect: {
    timeout: 5000,
    // Configure threshold for image comparison
    toMatchSnapshot: {
      // Maximum allowed percentage of different pixels (0.1% by default)
      maxDiffPixelRatio: 0.001,
      // Maximum allowed number of differing pixels
      maxDiffPixels: 10,
      // Threshold for considering images as different (0.2 by default, lower is more strict)
      threshold: 0.2,
    }
  },
  
  // Run tests in parallel
  fullyParallel: !isVisualUpdate, // Don't run in parallel when updating baselines
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: isCI,
  
  // Retry tests on CI only
  retries: isCI ? 2 : 0,
  
  // Opt out of parallel tests on CI or when updating baselines
  workers: isCI || isVisualUpdate ? 1 : undefined,
  
  // Reporters configuration
  reporter: [
    ['list'],
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: isCI ? 'never' : 'on-failure'
    }],
    ['junit', { 
      outputFile: 'test-results/junit/results.xml',
      embedAnnotationsAsProperties: true
    }]
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    
    // Screenshot settings
    screenshot: 'only-on-failure',
    
    // Video settings
    video: 'on-first-retry',
    
    // Trace settings
    trace: 'on-first-retry',
    
    // Viewport settings
    viewport: { width: 1280, height: 800 },
    
    // Browser settings
    headless: isCI, // Run headless on CI, headed locally
    ignoreHTTPSErrors: true,
    
    // Timeout settings
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Visual comparison settings
    launchOptions: {
      slowMo: isVisualUpdate ? 100 : 0, 
    },
  },

  // Configure projects for major browsers
  projects: [
    // Chromium project
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Consistent viewport for visual testing
        viewport: { width: 1280, height: 800 },
        // Enable hardware acceleration for better performance
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
          ]
        },
        // Configure network conditions
        contextOptions: {
          ignoreHTTPSErrors: true,
          javaScriptEnabled: true,
          acceptDownloads: true,
          bypassCSP: true
        }
      },
      // Output directory for test artifacts
      outputDir: 'test-results/chromium'
    },
    // Firefox project
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Consistent viewport with Chromium
        viewport: { width: 1280, height: 800 },
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true
          },
          args: [
            '--no-remote',
            '--start-maximized'
          ]
        }
      },
      // Output directory for test artifacts
      outputDir: 'test-results/firefox'
    },
    // WebKit project
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Consistent viewport with other browsers
        viewport: { width: 1280, height: 800 },
        // WebKit-specific settings
        launchOptions: {
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
          ]
        }
      },
      // Output directory for test artifacts
      outputDir: 'test-results/webkit'
    }
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    port: 3005,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
