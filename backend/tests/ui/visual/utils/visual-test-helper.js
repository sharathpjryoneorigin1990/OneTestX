import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';
import { assertVisualMatch } from './visual-assertions.js';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add missing path import if not already present
if (!global.path) {
  global.path = path;
}

export default class VisualTestHelper {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object
   * @param {Object} options - Configuration options
   * @param {string} [options.screenshotDir] - Base directory for screenshots
   * @param {number} [options.threshold] - Default threshold for visual comparison (0-100)
   * @param {boolean} [options.updateBaselines] - Whether to update baselines when they don't exist
   * @param {Object} [options.viewport] - Default viewport size
   */
  constructor(page, options = {}) {
    this.page = page;
    this.config = {
      ...config.defaults,
      ...config.visual,
      dirs: config.dirs,
      ...options
    };
    
    // Set default viewport if provided
    if (this.config.viewport) {
      this.page.setViewportSize(this.config.viewport);
    }
    
    // Ensure all required directories exist
    this.ensureDirs();
  }

  /**
   * Ensure all required directories exist
   * @private
   */
  async ensureDirs() {
    await Promise.all([
      fs.ensureDir(this.config.dirs.baseline),
      fs.ensureDir(this.config.dirs.actual),
      fs.ensureDir(this.config.dirs.diffs)
    ]);
  }
  
  /**
   * Get the full path for a screenshot
   * @param {string} testName - Name of the test
   * @param {string} [type='actual'] - Type of screenshot ('baseline', 'actual', 'diff')
   * @returns {string} Full path to the screenshot
   */
  getScreenshotPath(testName, type = 'actual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = type === 'baseline' 
      ? `${testName}.png`
      : `${testName}_${timestamp}.png`;
      
    return path.join(this.config.dirs[type === 'baseline' ? 'baseline' : type], fileName);
  }

  /**
   * Take a screenshot and compare it with the baseline
   * @param {string} testName - Unique name for the test (used for file names)
   * @param {Object} [options] - Screenshot and comparison options
   * @param {number} [options.threshold] - Override default threshold
   * @param {string} [options.selector] - CSS selector to capture
   * @param {boolean} [options.fullPage] - Capture full page (defaults to config value)
   * @param {Object} [options.screenshotOptions] - Additional Playwright screenshot options
   * @param {boolean} [options.updateBaseline] - Update baseline if it doesn't exist
   * @returns {Promise<Object>} Comparison result
   */
  async matchScreenshot(testName, options = {}) {
    const {
      threshold = this.config.maxDiffPercentage,
      selector = null,
      fullPage = this.config.fullPage,
      updateBaseline = this.config.updateBaselines,
      screenshotOptions = {}
    } = options;
    
    // Generate file paths
    const baselinePath = this.getScreenshotPath(testName, 'baseline');
    const actualPath = this.getScreenshotPath(testName, 'actual');
    const diffPath = this.getScreenshotPath(testName, 'diff');
    
    // Take the screenshot
    const screenshot = await (selector
      ? this.page.locator(selector).screenshot({
          animations: this.config.animations,
          ...screenshotOptions
        })
      : this.page.screenshot({
          fullPage,
          animations: this.config.animations,
          ...screenshotOptions
        }));
    
    // Save the actual screenshot
    await fs.writeFile(actualPath, screenshot);
    
    // Check if baseline exists
    const baselineExists = await fs.pathExists(baselinePath);
    if (!baselineExists && updateBaseline) {
      await this.updateBaseline(testName, { selector, fullPage, screenshotOptions });
      return {
        match: true,
        diffPixels: 0,
        diffPercentage: 0,
        baselinePath,
        actualPath,
        diffPath: null,
        message: `New baseline created at ${baselinePath}`
      };
    }

    // Ensure the page is stable before taking a screenshot
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(this.config.timeouts?.animation || 500);
    
    // Assert the visual match
    try {
      return await assertVisualMatch(testName, screenshot, {
        threshold,
        screenshotDir: this.config.dirs.screenshots,
        updateBaselines: this.config.updateBaselines
      });
    } catch (error) {
      // Enhance error with additional context
      if (error.isVisualMismatch) {
        error.testName = testName;
        error.actualPath = actualPath;
        error.baselinePath = baselinePath;
        error.diffPath = diffPath;
        
        // Save the diff image if it doesn't exist
        if (error.diffPixels > 0 && !await fs.pathExists(diffPath)) {
          const result = await this.compareImages(baselinePath, actualPath, diffPath, { threshold });
          error.diffPath = result.diffPath;
        }
      }
      throw error;
    }
  }

  /**
   * Compare two images and return the difference
   * @param {string} baselinePath - Path to the baseline image
   * @param {string} actualPath - Path to the actual image
   * @param {string} diffPath - Path to save the diff image
   * @param {Object} [options] - Comparison options
   * @returns {Promise<Object>} Comparison result
   */
  async compareImages(baselinePath, actualPath, diffPath, options = {}) {
    const { assertVisualMatch } = require('./visual-assertions');
    
    // Read the actual image
    const screenshot = await fs.readFile(actualPath);
    
    // Compare with baseline
    return assertVisualMatch(
      path.basename(actualPath, path.extname(actualPath)),
      screenshot,
      {
        ...options,
        baselinePath,
        actualPath,
        diffPath
      }
    );
  }
  
  /**
   * Update the baseline image for a test
   * @param {string} testName - Name of the test to update
   * @param {Object} [options] - Screenshot options
   * @param {string} [options.selector] - CSS selector to capture
   * @param {boolean} [options.fullPage] - Capture full page (defaults to config value)
   * @param {Object} [options.screenshotOptions] - Additional screenshot options
   * @returns {Promise<string>} Path to the updated baseline image
   */
  async updateBaseline(testName, options = {}) {
    const { 
      selector = null, 
      fullPage = this.config.fullPage,
      screenshotOptions = {}
    } = options;
    
    const baselinePath = this.getScreenshotPath(testName, 'baseline');
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(baselinePath));
    
    // Take a new screenshot
    const screenshot = await (selector
      ? this.page.locator(selector).screenshot({
          animations: this.config.animations,
          ...screenshotOptions
        })
      : this.page.screenshot({ 
          fullPage,
          animations: this.config.animations,
          ...screenshotOptions 
        }));
    
    // Save as the new baseline
    await fs.writeFile(baselinePath, screenshot);
    console.log(`Baseline updated: ${baselinePath}`);
    
    return baselinePath;
  }

  /**
   * Hide elements that might cause flaky tests (e.g., animations, timers)
   * @param {string[]} [selectors] - CSS selectors of elements to hide
   * @returns {Promise<void>}
   */
  async hideFlakyElements(selectors) {
    const defaultSelectors = [
      // Animations and transitions
      '.animate', '[class*="animation"]', '.transition', '[class*="transition"]',
      // Loading indicators
      '.loading', '.spinner', '.loader', '[class*="loading"]',
      // Notifications and popups
      '.Toastify', '.notifications', '.alert', '.snackbar',
      // Date/Time pickers
      '.react-datepicker', '.datepicker', '.timepicker',
      // Material-UI components
      '.MuiPickersPopper-root', '.MuiBackdrop-root',
      // Tooltips and popovers
      '.tooltip', '.popover', '[data-tooltip]', '[data-tippy-root]',
      // Carousels and sliders
      '.carousel', '.slider', '.slick-',
      // Videos and iframes
      'video', 'iframe',
      // Charts and graphs
      'canvas', '.chart', '.graph',
      // Custom elements that might change
      '[data-testid*="loading"]', '[class*="skeleton"]'
    ];
    
    const elementsToHide = Array.isArray(selectors) && selectors.length > 0 
      ? selectors 
      : defaultSelectors;
    
    if (elementsToHide.length === 0) return;
    
    try {
      await this.page.addStyleTag({
        content: `${elementsToHide.join(', ')} { 
          animation: none !important; 
          transition: none !important; 
          opacity: 0 !important; 
          visibility: hidden !important; 
          pointer-events: none !important;
        }`
      });
    } catch (error) {
      console.warn('Failed to hide flaky elements:', error.message);
    }
  }
  
  /**
   * Wait for all images to load on the page
   * @returns {Promise<void>}
   */
  async waitForImages() {
    try {
      await this.page.evaluate(async () => {
        const selectors = Array.from(document.images);
        await Promise.all(
          selectors.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve); // Don't fail on broken images
            });
          })
        );
      });
    } catch (error) {
      console.warn('Error waiting for images to load:', error.message);
    }
  }
  
  /**
   * Wait for all fonts to be loaded
   * @returns {Promise<void>}
   */
  async waitForFonts() {
    try {
      await this.page.evaluate(() => document.fonts.ready);
    } catch (error) {
      console.warn('Error waiting for fonts to load:', error.message);
    }
  }
  
  /**
   * Wait for the page to be fully stable (no network activity, animations, etc.)
   * @param {Object} [options] - Options
   * @param {number} [options.timeout=5000] - Maximum time to wait in milliseconds
   * @returns {Promise<void>}
   */
  async waitForStableDOM(options = {}) {
    const { timeout = 5000 } = options;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isStable = await this.page.evaluate(() => {
        // Check for ongoing animations
        const hasAnimations = Array.from(document.getAnimations()).some(
          animation => animation.playState === 'running'
        );
        
        // Check for pending network requests
        const hasPendingRequests = window.performance
          .getEntriesByType('resource')
          .some(resource => !['fetch', 'xmlhttprequest'].includes(resource.initiatorType) && 
                           resource.duration === 0);
        
        return !hasAnimations && !hasPendingRequests;
      });
      
      if (isStable) return;
      await this.page.waitForTimeout(100);
    }
    
    console.warn('Page did not stabilize within the timeout period');
  }

  /**
   * Wait for all images to load
   * @returns {Promise<void>}
   */
  async waitForImages() {
    await this.page.evaluate(async () => {
      const selectors = Array.from(document.images);
      await Promise.all(
        selectors.map((img) => {
          if (img.complete) return;
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        })
      );
    });
  }
}

// No default export needed as we're using ES modules
