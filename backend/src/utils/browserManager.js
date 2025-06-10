import { chromium, firefox, webkit } from 'playwright';

// Store active browser instances
const activeBrowsers = new Map();
const activeContexts = new Map();
const activePages = new Map();

// Configuration defaults
const defaultViewport = { width: 1280, height: 720 };
const defaultBrowserType = 'chromium';

/**
 * Initialize a new browser instance
 * @param {string} sessionId - Unique session identifier
 * @param {Object} options - Browser launch options
 * @returns {Promise<Object>} - Session information
 */
export async function createBrowserSession(sessionId, options = {}) {
  try {
    console.log(`[BrowserManager] Creating new browser session: ${sessionId}`);
    
    // Close existing session if it exists
    if (activeBrowsers.has(sessionId)) {
      await closeBrowserSession(sessionId);
    }
    
    const browserType = options.browserType || defaultBrowserType;
    const headless = options.headless !== false; // Default to headless unless explicitly set to false
    
    // Select browser based on type
    let browser;
    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch({ headless });
        break;
      case 'webkit':
        browser = await webkit.launch({ headless });
        break;
      case 'chromium':
      default:
        browser = await chromium.launch({ headless });
    }
    
    // Create a browser context
    const context = await browser.newContext({
      viewport: options.viewport || defaultViewport,
      userAgent: options.userAgent,
      locale: options.locale || 'en-US',
      recordVideo: options.recordVideo ? { dir: './recordings' } : undefined,
    });
    
    // Create a new page in context
    const page = await context.newPage();
    
    // Store references
    activeBrowsers.set(sessionId, browser);
    activeContexts.set(sessionId, context);
    activePages.set(sessionId, page);
    
    // Set up page event listeners for logging
    page.on('console', msg => console.log(`[Browser:${sessionId}] Console ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[Browser:${sessionId}] Page error: ${err}`));
    
    console.log(`[BrowserManager] Browser session created: ${sessionId} (${browserType})`);
    
    return {
      sessionId,
      browserType,
      status: 'created',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[BrowserManager] Error creating browser session: ${error.message}`);
    throw error;
  }
}

/**
 * Close a browser session and clean up resources
 * @param {string} sessionId - Session to close
 * @returns {Promise<boolean>} - Success indicator
 */
export async function closeBrowserSession(sessionId) {
  try {
    console.log(`[BrowserManager] Closing browser session: ${sessionId}`);
    
    const browser = activeBrowsers.get(sessionId);
    
    if (browser) {
      await browser.close();
      activeBrowsers.delete(sessionId);
      activeContexts.delete(sessionId);
      activePages.delete(sessionId);
      console.log(`[BrowserManager] Browser session closed: ${sessionId}`);
      return true;
    } else {
      console.log(`[BrowserManager] No active browser found for session: ${sessionId}`);
      return false;
    }
  } catch (error) {
    console.error(`[BrowserManager] Error closing browser session: ${error.message}`);
    return false;
  }
}

/**
 * Navigate to a URL
 * @param {string} sessionId - Session ID
 * @param {string} url - URL to navigate to
 * @returns {Promise<Object>} - Navigation result
 */
export async function navigateTo(sessionId, url) {
  try {
    const page = activePages.get(sessionId);
    
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }
    
    console.log(`[BrowserManager] Navigating to: ${url}`);
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    
    return {
      success: true,
      url: page.url(),
      status: response ? response.status() : undefined,
      sessionId
    };
  } catch (error) {
    console.error(`[BrowserManager] Navigation error: ${error.message}`);
    throw error;
  }
}

/**
 * Take a screenshot of the current page
 * @param {string} sessionId - Session ID
 * @param {Object} options - Screenshot options
 * @returns {Promise<Buffer>} - Image buffer
 */
export async function takeScreenshot(sessionId, options = {}) {
  try {
    const page = activePages.get(sessionId);
    
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }
    
    const screenshotOptions = {
      fullPage: options.fullPage === true,
      type: options.type || 'png',
      path: options.path
    };
    
    const buffer = await page.screenshot(screenshotOptions);
    return buffer;
  } catch (error) {
    console.error(`[BrowserManager] Screenshot error: ${error.message}`);
    throw error;
  }
}

/**
 * Execute an action on the page
 * @param {string} sessionId - Session ID
 * @param {Object} actionDetails - Details of the action to perform
 * @returns {Promise<Object>} - Result of the action
 */
export async function executeAction(sessionId, actionDetails) {
  try {
    const { action, selector, value, options = {} } = actionDetails;
    const page = activePages.get(sessionId);
    
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }
    
    console.log(`[BrowserManager] Executing action: ${action} on ${selector}`);
    
    let result = { success: true };
    
    switch (action) {
      case 'click':
        await page.click(selector, options);
        break;
        
      case 'type':
        await page.fill(selector, value || '', options);
        break;
        
      case 'select':
        await page.selectOption(selector, value || '', options);
        break;
        
      case 'check':
        await page.check(selector, options);
        break;
        
      case 'uncheck':
        await page.uncheck(selector, options);
        break;
        
      case 'hover':
        await page.hover(selector, options);
        break;
        
      case 'waitForElement':
        await page.waitForSelector(selector, options);
        break;
        
      case 'waitForNavigation':
        await page.waitForNavigation(options);
        break;
        
      case 'evaluate':
        if (value && typeof value === 'string') {
          result.data = await page.evaluate(value);
        }
        break;
        
      default:
        throw new Error(`Unknown action type: ${action}`);
    }
    
    return {
      ...result,
      action,
      selector,
      sessionId
    };
  } catch (error) {
    console.error(`[BrowserManager] Action error: ${error.message}`);
    throw error;
  }
}

/**
 * Get the HTML content of the current page
 * @param {string} sessionId - Session ID
 * @returns {Promise<string>} - HTML content
 */
export async function getPageContent(sessionId) {
  try {
    const page = activePages.get(sessionId);
    
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }
    
    const content = await page.content();
    return content;
  } catch (error) {
    console.error(`[BrowserManager] Error getting page content: ${error.message}`);
    throw error;
  }
}

/**
 * Get all active browser sessions
 * @returns {Array<string>} - List of active session IDs
 */
export function getActiveSessions() {
  return Array.from(activeBrowsers.keys());
}

/**
 * Get page metadata for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - Page metadata
 */
export async function getPageMetadata(sessionId) {
  try {
    const page = activePages.get(sessionId);
    
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }
    
    const url = page.url();
    const title = await page.title();
    
    return {
      url,
      title,
      sessionId
    };
  } catch (error) {
    console.error(`[BrowserManager] Error getting page metadata: ${error.message}`);
    throw error;
  }
}
