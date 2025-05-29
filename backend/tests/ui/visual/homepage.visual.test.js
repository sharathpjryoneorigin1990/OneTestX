/**
 * Visual regression test for the homepage
 * This test captures a screenshot of the homepage and compares it with a baseline
 * using the VisualTestHelper utility.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs-extra';
import config from './config.js';
import VisualTestHelper from './utils/visual-test-helper.js';

// Enable retries for visual tests to handle flakiness
test.describe.configure({ mode: 'serial', retries: 1 });

test.describe('Visual Regression Tests', () => {
  let helper;
  let page;

  test.beforeAll(async ({ browser }) => {
    // Create a new browser context with consistent viewport
    const context = await browser.newContext({
      viewport: config.defaults.viewport,
      deviceScaleFactor: 1,
      colorScheme: 'light', // Ensure consistent color scheme
    });
    
    // Create a new page and initialize the helper
    page = await context.newPage();
    helper = new VisualTestHelper(page);
    
    // Set default timeout for all tests
    test.setTimeout(60000);
  });

  test.afterAll(async () => {
    // Close the page after all tests
    if (page) {
      await page.close();
    }
  });

  test.beforeEach(async () => {
    // Reset the viewport before each test
    await page.setViewportSize(config.defaults.viewport);
  });

  test('Homepage matches visual baseline', async () => {
    // Navigate to the homepage
    await page.goto(config.urls.homepage);
    
    // Wait for the page to be fully loaded and stable
    await helper.waitForLoadState('networkidle');
    await helper.waitForImages();
    await helper.waitForFonts();
    await helper.waitForStableDOM();
    
    // Hide flaky elements that might cause test flakiness
    await helper.hideFlakyElements();
    
    try {
      // Take a full page screenshot and compare with baseline
      const result = await helper.matchScreenshot('homepage', {
        fullPage: true,
        threshold: config.visual.maxDiffPercentage,
        updateBaseline: config.visual.updateBaselines,
        screenshotOptions: {
          animations: config.defaults.animations,
          mask: [
            // Mask dynamic content that changes between test runs
            page.locator('.timestamp'),
            page.locator('.notification-badge')
          ]
        }
      });
      
      // Log the result for debugging
      console.log(`Visual test completed with ${result.diffPercentage.toFixed(4)}% difference`);
      
      // Additional assertions
      expect(result.diffPercentage).toBeLessThanOrEqual(config.visual.maxDiffPercentage);
      expect(result.diffPixels).toBeLessThanOrEqual(config.visual.maxDiffPixelCount);
      
    } catch (error) {
      if (error.message.includes('No baseline found')) {
        console.log('Baseline created. Please run the test again.');
      } else {
        // Attach the diff image to the test report
        if (error.diffPath) {
          await test.info().attach('visual-diff', {
            path: error.diffPath,
            contentType: 'image/png'
          });
          
          // Also attach the actual and baseline images for comparison
          if (await fs.pathExists(error.actualPath)) {
            await test.info().attach('actual', {
              path: error.actualPath,
              contentType: 'image/png'
            });
          }
          
          if (await fs.pathExists(error.baselinePath)) {
            await test.info().attach('baseline', {
              path: error.baselinePath,
              contentType: 'image/png'
            });
          }
        }
        throw error;
      }
    }
  });

  test('Header matches visual baseline', async () => {
    // Navigate to the homepage
    await page.goto(config.urls.homepage);
    
    // Wait for the header to be visible
    const header = page.locator('header').first();
    await header.waitFor({ state: 'visible' });
    
    // Scroll to the header to ensure it's in view
    await header.scrollIntoViewIfNeeded();
    
    try {
      // Take a screenshot of just the header and compare with baseline
      const result = await helper.matchScreenshot('homepage-header', {
        selector: 'header',
        fullPage: false,
        threshold: 0.05, // Stricter threshold for header
        screenshotOptions: {
          animations: 'disabled'
        }
      });
      
      expect(result.diffPercentage).toBeLessThanOrEqual(0.05);
      
    } catch (error) {
      if (error.message.includes('No baseline found')) {
        console.log('Baseline created. Please run the test again.');
      } else {
        throw error;
      }
    }
  });

  test('Footer matches visual baseline', async () => {
    // Navigate to the homepage
    await page.goto(config.urls.homepage);
    
    // Wait for the footer to be visible
    const footer = page.locator('footer').first();
    await footer.waitFor({ state: 'visible' });
    
    // Scroll to the footer to ensure it's in view
    await footer.scrollIntoViewIfNeeded();
    
    try {
      // Take a screenshot of just the footer and compare with baseline
      const result = await helper.matchScreenshot('homepage-footer', {
        selector: 'footer',
        fullPage: false,
        threshold: 0.05, // Stricter threshold for footer
        screenshotOptions: {
          animations: 'disabled'
        }
      });
      
      expect(result.diffPercentage).toBeLessThanOrEqual(0.05);
      
    } catch (error) {
      if (error.message.includes('No baseline found')) {
        console.log('Baseline created. Please run the test again.');
      } else {
        throw error;
      }
    }
  });
});
