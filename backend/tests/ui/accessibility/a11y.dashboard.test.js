const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  auth: {
    username: process.env.TEST_USERNAME || 'testuser@example.com',
    password: process.env.TEST_PASSWORD || 'testpassword123'
  },
  timeouts: {
    navigation: 30000, // 30 seconds
    element: 10000,    // 10 seconds
    test: 60000       // 60 seconds
  },
  testResultsDir: path.join(__dirname, '..', '..', '..', 'test-results', 'accessibility')
};

// Ensure test results directory exists
try {
  if (!fs.existsSync(config.testResultsDir)) {
    fs.mkdirSync(config.testResultsDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create test results directory:', error);
  process.exit(1);
}

// Helper function to save test artifacts
const saveArtifact = async (name, content, type = 'json') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filePath = path.join(config.testResultsDir, `${name}-${timestamp}.${type}`);
  
  try {
    if (type === 'json') {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    } else if (type === 'png') {
      await content.screenshot({ path: filePath, fullPage: true });
    }
    return filePath;
  } catch (error) {
    console.error(`Failed to save ${name}:`, error);
    return null;
  }
};

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page, context }, testInfo) => {
    testInfo.setTimeout(config.timeouts.test);
    
    try {
      // Clear browser context
      await context.clearCookies();
      await context.clearPermissions();
      
      // Navigate to login page
      await page.goto(`${config.baseURL}/login`, { 
        waitUntil: 'networkidle',
        timeout: config.timeouts.navigation 
      });
      
      // Fill in login form
      await page.fill('input[type="email"]', config.auth.username, { timeout: config.timeouts.element });
      await page.fill('input[type="password"]', config.auth.password, { timeout: config.timeouts.element });
      
      // Click login button and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: config.timeouts.navigation }),
        page.click('button[type="submit"]', { timeout: config.timeouts.element })
      ]);
      
      // Wait for the dashboard to load
      await page.waitForSelector('.dashboard', { 
        state: 'visible', 
        timeout: config.timeouts.element 
      });
      
      // Inject axe-core
      await injectAxe(page);
    } catch (error) {
      console.error('Test setup failed:', error);
      const screenshotPath = await saveArtifact('setup-failure', page, 'png');
      throw new Error(`Test setup failed. Screenshot saved to: ${screenshotPath}`);
    }
  });
  
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = await saveArtifact(`test-failure-${testInfo.title.replace(/\s+/g, '-').toLowerCase()}`, page, 'png');
      console.log(`Test failed. Screenshot saved to: ${screenshotPath}`);
    }
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Wait for the main content to be loaded
    await page.waitForSelector('main', { 
      state: 'attached', 
      timeout: config.timeouts.element 
    });
    
    // Run accessibility scan with axe-core
    const scanResults = await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      },
      axeOptions: {
        runOnly: {
          type: 'tags',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        },
        rules: {
          'color-contrast': { enabled: true },
          'link-name': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true },
          'skip-link': { enabled: true }
        }
      },
      timeout: config.timeouts.element
    });

    // Process and log the results
    const criticalIssues = scanResults.violations.filter(
      (issue) => issue.impact === 'critical' || issue.impact === 'serious'
    );

    // Save detailed accessibility report if issues found
    if (criticalIssues.length > 0) {
      const report = {
        url: page.url(),
        timestamp: new Date().toISOString(),
        summary: {
          critical: criticalIssues.filter(i => i.impact === 'critical').length,
          serious: criticalIssues.filter(i => i.impact === 'serious').length,
          total: criticalIssues.length
        },
        issues: criticalIssues.map(issue => ({
          id: issue.id,
          impact: issue.impact,
          description: issue.description,
          help: issue.help,
          helpUrl: issue.helpUrl,
          nodes: issue.nodes.length,
          html: issue.nodes.map(n => n.html).slice(0, 3) // Sample of first 3 nodes
        }))
      };
      
      const reportPath = await saveArtifact('a11y-issues', report);
      console.log(`Accessibility issues report saved to: ${reportPath}`);
      
      // Save page HTML for debugging
      const htmlPath = await saveArtifact('page-content', { html: await page.content() });
      console.log(`Page HTML saved to: ${htmlPath}`);
    }

    // Save screenshot for reference
    await saveArtifact('accessibility-scan', page, 'png');

    // Assert no critical or serious issues
    expect(criticalIssues, `Found ${criticalIssues.length} accessibility issues. Check the report for details.`)
      .toHaveLength(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Wait for the main content to be loaded
    await page.waitForSelector('main', { 
      state: 'attached',
      timeout: config.timeouts.element 
    });
    
    // Test skip link functionality
    await test.step('Test skip link', async () => {
      const skipLink = page.locator('a[href="#main-content"], a[href="#main"]').first();
      const skipLinkCount = await skipLink.count();
      
      if (skipLinkCount > 0) {
        // Press tab to focus the skip link
        await page.keyboard.press('Tab');
        await expect(skipLink).toBeFocused();
        
        // Activate the skip link
        await page.keyboard.press('Enter');
        
        // Verify focus is moved to main content
        const mainContent = page.locator('main').first();
        await expect(mainContent).toBeFocused();
      }
    });
    
    // Test tab order and focus management
    await test.step('Test tab order and focus', async () => {
      // Get all focusable elements
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([type="hidden"]):not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]'
      ].join(',');
      
      const focusableElements = page.locator(focusableSelectors);
      const count = await focusableElements.count();
      
      // Test tabbing through all focusable elements
      const tabOrder = [];
      
      // Start from the beginning of the document
      await page.keyboard.press('Home');
      
      // Tab through all focusable elements
      for (let i = 0; i < count; i++) {
        await page.keyboard.press('Tab');
        
        // Get the currently focused element
        const focusedElement = page.locator(':focus');
        if (await focusedElement.count() === 0) break;
        
        // Verify the element is visible and focusable
        await expect(focusedElement).toBeVisible();
        await expect(focusedElement).not.toHaveAttribute('tabindex', '-1');
        
        // Log the focused element for debugging
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        const text = await focusedElement.innerText().catch(() => '');
        const ariaLabel = await focusedElement.getAttribute('aria-label') || '';
        tabOrder.push({ index: i, tagName, text: text.substring(0, 50), ariaLabel });
        
        // Test Enter key on interactive elements
        if (['a', 'button'].includes(tagName)) {
          const originalUrl = page.url();
          await page.keyboard.press('Enter');
          
          // If the URL changed, go back
          if (page.url() !== originalUrl) {
            await page.goBack();
            // Refocus the element after navigation
            await page.keyboard.press('Tab');
            for (let j = 0; j <= i; j++) {
              await page.keyboard.press('Tab');
            }
          }
        }
      }
      
      // Save tab order for debugging
      await saveArtifact('keyboard-tab-order', { tabOrder });
    });
    
    // Test common keyboard interactions
    await test.step('Test common keyboard interactions', async () => {
      // Test Escape key closes modals/dropdowns
      await page.keyboard.press('Escape');
      
      // Test Space key on buttons
      const buttons = page.locator('button:not([disabled])');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        await buttons.first().focus();
        await page.keyboard.press(' ');
        // Add assertions for expected behavior after space press
      }
      
      // Test arrow key navigation in menus/radios if they exist
      const menus = page.locator('[role="menu"], [role="radiogroup"]');
      if (await menus.count() > 0) {
        await menus.first().focus();
        await page.keyboard.press('ArrowDown');
        // Add assertions for menu navigation
      }
    });
  });
});
