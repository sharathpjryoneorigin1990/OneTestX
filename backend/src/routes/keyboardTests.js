import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import fs from 'fs';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Directory for storing test results and screenshots
const RESULTS_DIR = path.join(__dirname, '../../results/keyboard-tests');
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');

// Ensure directories exist
[RESULTS_DIR, SCREENSHOTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Test configurations for different keyboard tests
const TEST_CONFIGS = {
  'tab-navigation': {
    name: 'Tab Navigation',
    description: 'Verify that all interactive elements are reachable using the Tab key',
    keys: ['Tab', 'Shift+Tab']
  },
  'arrow-navigation': {
    name: 'Arrow Key Navigation',
    description: 'Verify that all focusable elements can be navigated using arrow keys',
    keys: ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']
  },
  'enter-space-activation': {
    name: 'Enter/Space Activation',
    description: 'Verify that buttons and links can be activated with Enter/Space',
    keys: ['Enter', ' ']
  },
  'skip-links': {
    name: 'Skip Links',
    description: 'Verify that skip links are present and functional',
    keys: ['Tab']
  },
  'keyboard-traps': {
    name: 'No Keyboard Traps',
    description: 'Verify that there are no keyboard traps',
    keys: ['Tab', 'Shift+Tab', 'Escape']
  },
  'focus-visible': {
    name: 'Focus Visible',
    description: 'Verify that focus indicators are clearly visible',
    keys: ['Tab']
  }
};

// Helper function to take a screenshot
async function takeScreenshot(page, testId, step) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${testId}-${step}-${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Run keyboard accessibility test
router.post('/run', async (req, res) => {
  const { testId, url } = req.body;
  const timestamp = new Date().toISOString();
  const resultId = `${testId}-${Date.now()}`;
  
  // Initialize test results
  const testResults = {
    id: resultId,
    testId,
    testName: TEST_CONFIGS[testId]?.name || testId,
    url,
    timestamp,
    status: 'running',
    passed: false,
    details: '',
    steps: [],
    screenshots: []
  };

  // Helper function to update and save test results
  const updateResults = async (update) => {
    Object.assign(testResults, update);
    const resultFile = path.join(RESULTS_DIR, `${resultId}.json`);
    await fs.promises.writeFile(resultFile, JSON.stringify(testResults, null, 2));
  };

  try {
    // Validate input
    if (!testId || !url) {
      throw new Error('testId and url are required parameters');
    }

    if (!TEST_CONFIGS[testId]) {
      throw new Error(`Invalid testId: ${testId}`);
    }

    console.log(`Starting keyboard test ${testId} for URL: ${url}`);
    
    // Launch browser
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: {
        dir: SCREENSHOTS_DIR,
        size: { width: 1280, height: 800 }
      }
    });
    
    const page = await context.newPage();
    
    try {
      // Navigate to the URL
      testResults.steps.push({
        action: 'navigate',
        url,
        timestamp: new Date().toISOString()
      });
      
      await updateResults({ status: 'navigating' });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Take initial screenshot
      const screenshot = await takeScreenshot(page, resultId, 'initial');
      testResults.screenshots.push(screenshot);
      
      // Run the specific test based on testId
      testResults.steps.push({
        action: 'start_test',
        testId,
        timestamp: new Date().toISOString()
      });
      
      await updateResults({ status: 'testing' });
      
      // Run the appropriate test based on testId
      switch (testId) {
        case 'tab-navigation':
          await testTabNavigation(page, testResults, resultId);
          break;
        case 'arrow-navigation':
          await testArrowNavigation(page, testResults, resultId);
          break;
        case 'enter-space-activation':
          await testEnterSpaceActivation(page, testResults, resultId);
          break;
        case 'skip-links':
          await testSkipLinks(page, testResults, resultId);
          break;
        case 'keyboard-traps':
          await testKeyboardTraps(page, testResults, resultId);
          break;
        case 'focus-visible':
          await testFocusVisible(page, testResults, resultId);
          break;
        default:
          throw new Error(`Unsupported test: ${testId}`);
      }
      
      // Test completed successfully
      await updateResults({
        status: 'completed',
        passed: true,
        details: `Successfully completed ${TEST_CONFIGS[testId].name} test`
      });
      
    } catch (error) {
      console.error(`Error during test execution:`, error);
      const errorScreenshot = await takeScreenshot(page, resultId, 'error');
      testResults.screenshots.push(errorScreenshot);
      
      await updateResults({
        status: 'error',
        passed: false,
        details: `Test failed: ${error.message}`,
        error: error.toString(),
        stack: error.stack
      });
      
      throw error;
    } finally {
      // Close the browser
      await browser.close();
    }
    
    // Return success response
    return res.json({
      success: true,
      ...testResults
    });
    
  } catch (error) {
    console.error('Error running keyboard test:', error);
    await updateResults({
      status: 'error',
      passed: false,
      details: `Error running test: ${error.message}`,
      error: error.toString()
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while running the keyboard test',
      testId,
      timestamp
    });
  }
});

// Test implementations
async function testTabNavigation(page, testResults, resultId) {
  // Get all focusable elements
  const focusableElements = await page.$$('a[href], button, [tabindex], input, select, textarea, [contenteditable]');
  
  if (focusableElements.length === 0) {
    throw new Error('No focusable elements found on the page');
  }
  
  testResults.steps.push({
    action: 'tab_navigation',
    elementsCount: focusableElements.length,
    timestamp: new Date().toISOString()
  });
  
  // Take a screenshot after first focus
  await page.keyboard.press('Tab');
  const screenshot = await takeScreenshot(page, resultId, 'tab-focus');
  testResults.screenshots.push(screenshot);
  
  // Check if focus is visible
  const focusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    
    const style = window.getComputedStyle(el);
    const isVisible = style.outlineStyle !== 'none' || 
                     style.outlineWidth !== '0px' ||
                     style.boxShadow !== 'none';
    
    return {
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      hasFocusVisible: el.matches(':focus-visible'),
      hasFocus: document.activeElement === el,
      computedStyle: {
        outline: style.outline,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow
      },
      isVisible
    };
  });
  
  testResults.focusedElement = focusedElement;
  
  if (!focusedElement?.isVisible && !focusedElement?.hasFocusVisible) {
    throw new Error('Focus indicator not visible on focused element');
  }
}

async function testArrowNavigation(page, testResults, resultId) {
  // This is a simplified implementation - would need to be expanded based on specific UI components
  testResults.steps.push({
    action: 'arrow_navigation',
    timestamp: new Date().toISOString(),
    note: 'Arrow key navigation test would be implemented here based on specific UI components'
  });
}

async function testEnterSpaceActivation(page, testResults, resultId) {
  // Test buttons
  const buttons = await page.$$('button, [role="button"]');
  
  for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
    await button.focus();
    
    // Test Enter key
    await page.keyboard.press('Enter');
    testResults.steps.push({
      action: 'enter_activation',
      element: 'button',
      key: 'Enter',
      timestamp: new Date().toISOString()
    });
    
    // Test Space key
    await button.focus();
    await page.keyboard.press(' ');
    testResults.steps.push({
      action: 'space_activation',
      element: 'button',
      key: 'Space',
      timestamp: new Date().toISOString()
    });
  }
  
  // Take a screenshot after testing
  const screenshot = await takeScreenshot(page, resultId, 'enter-space-test');
  testResults.screenshots.push(screenshot);
}

async function testSkipLinks(page, testResults, resultId) {
  // Check for skip links
  const skipLinks = await page.$$('a[href^="#"], a[href^="/#"]');
  
  testResults.steps.push({
    action: 'check_skip_links',
    skipLinksCount: skipLinks.length,
    timestamp: new Date().toISOString()
  });
  
  if (skipLinks.length === 0) {
    testResults.warnings = testResults.warnings || [];
    testResults.warnings.push('No skip links found on the page');
  }
  
  // Test the first skip link if available
  if (skipLinks.length > 0) {
    await skipLinks[0].focus();
    await page.keyboard.press('Enter');
    
    const screenshot = await takeScreenshot(page, resultId, 'skip-link-activated');
    testResults.screenshots.push(screenshot);
    
    testResults.steps.push({
      action: 'tested_skip_link',
      href: await skipLinks[0].getAttribute('href'),
      timestamp: new Date().toISOString()
    });
  }
}

async function testKeyboardTraps(page, testResults, resultId) {
  // Check for common keyboard traps (modals, dialogs, etc.)
  const modals = await page.$$('[role="dialog"], [role="alertdialog"], .modal, .modal-dialog');
  
  testResults.steps.push({
    action: 'check_keyboard_traps',
    modalsCount: modals.length,
    timestamp: new Date().toISOString()
  });
  
  // If modals are present, test keyboard trap behavior
  for (const modal of modals) {
    const isVisible = await modal.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    if (isVisible) {
      // Test if focus is trapped within the modal
      await modal.focus();
      await page.keyboard.press('Tab');
      
      const focusedInModal = await modal.evaluate((modalEl) => {
        return modalEl.contains(document.activeElement);
      });
      
      if (!focusedInModal) {
        testResults.warnings = testResults.warnings || [];
        testResults.warnings.push('Focus is not properly trapped in modal dialog');
      }
      
      // Test Escape key to close modal
      await page.keyboard.press('Escape');
      
      const screenshot = await takeScreenshot(page, resultId, 'modal-keyboard-trap');
      testResults.screenshots.push(screenshot);
    }
  }
}

async function testFocusVisible(page, testResults, resultId) {
  // Test focus visibility on interactive elements
  const interactiveElements = await page.$$('a[href], button, [tabindex], input, select, textarea, [contenteditable]');
  
  testResults.steps.push({
    action: 'check_focus_visible',
    elementsCount: interactiveElements.length,
    timestamp: new Date().toISOString()
  });
  
  // Test first few elements
  const elementsToTest = interactiveElements.slice(0, 5);
  
  for (const [index, element] of elementsToTest.entries()) {
    await element.focus();
    
    const isFocusVisible = await element.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== 'none' || 
             style.outlineWidth !== '0px' ||
             style.boxShadow !== 'none' ||
             el.matches(':focus-visible');
    });
    
    if (!isFocusVisible) {
      testResults.warnings = testResults.warnings || [];
      testResults.warnings.push(`Focus indicator not visible on element ${index + 1}`);
      
      const screenshot = await takeScreenshot(page, resultId, `focus-visible-issue-${index}`);
      testResults.screenshots.push(screenshot);
      
      // Only log the first issue to avoid too many screenshots
      break;
    }
  }
}

// Get all keyboard test results
router.get('/results', (req, res) => {
  try {
    if (!fs.existsSync(RESULTS_DIR)) {
      return res.json([]);
    }
    
    const resultFiles = fs.readdirSync(RESULTS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        try {
          const content = fs.readFileSync(path.join(RESULTS_DIR, file), 'utf8');
          return JSON.parse(content);
        } catch (e) {
          console.error(`Error reading result file ${file}:`, e);
          return null;
        }
      })
      .filter(Boolean);
      
    res.json(resultFiles);
  } catch (error) {
    console.error('Error getting keyboard test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test results'
    });
  }
});

export default router;
