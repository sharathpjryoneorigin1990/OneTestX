import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { writeFile, unlink, readFile, access } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';

// Maximum time to wait for page to be considered loaded (in milliseconds)
const PAGE_LOAD_TIMEOUT = 30000; // 30 seconds
const NAVIGATION_TIMEOUT = 60000; // 60 seconds

// Default viewport sizes
const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

// Authentication credentials (should be moved to environment variables in production)
const AUTH_CREDENTIALS = {
  username: process.env.AUTH_USERNAME || '',
  password: process.env.AUTH_PASSWORD || '',
};

// Helper function to wait for network idle
const waitForNetworkIdle = (page: any, timeout: number, maxInflightRequests = 0) => {
  return Promise.race([
    page.waitForLoadState('networkidle', { timeout }),
    page.waitForFunction(
      (max: number) => {
        const anyWindow = window as any;
        return (anyWindow._requestCount || 0) <= max;
      },
      { timeout },
      maxInflightRequests
    ),
  ]).catch(() => {}); // Ignore timeout errors
};

interface TestOptions {
  url: string;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  timeout?: number;
  auth?: {
    username: string;
    password: string;
  };
  waitForSelector?: string;
  waitForTimeout?: number;
  takeScreenshot?: boolean;
}

interface TestResult {
  id: string;
  url: string;
  viewport: string;
  timestamp: string;
  success: boolean;
  pageTitle?: string;
  pageContent?: string;
  screenshot?: string;
  error?: string;
  issues: {
    violations: any[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  };
  metadata: {
    testEngine: string;
    testRunner: string;
    testEnvironment: string;
    url: string;
    timestamp: string;
    pageTitle: string;
    viewport: {
      width: number;
      height: number;
    };
    timing: {
      navigation: number;
      contentLoad: number;
      domContentLoaded: number;
      load: number;
      domInteractive: number;
    };
  };
}

interface ViewportSize {
  width: number;
  height: number;
}

// Helper function to run accessibility test using Puppeteer and axe-core
async function runAccessibilityTest(
  url: string, 
  viewport: 'mobile' | 'tablet' | 'desktop' = 'desktop',
  options: Partial<TestOptions> = {}
): Promise<TestResult> {
  const testId = `test_${Date.now()}`;
  const timestamp = new Date().toISOString();
  const viewportSize = VIEWPORT_SIZES[viewport] || VIEWPORT_SIZES.desktop;
  
  const {
    auth,
    waitForSelector,
    waitForTimeout = 5000,
    takeScreenshot = false,
    timeout = NAVIGATION_TIMEOUT
  } = options;

  const result: Partial<TestResult> = {
    id: testId,
    url,
    viewport,
    timestamp,
    success: false,
    issues: {
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: []
    },
    metadata: {
      testEngine: 'axe-core',
      testRunner: 'puppeteer',
      testEnvironment: 'headless',
      url,
      timestamp,
      pageTitle: 'Unknown',
      viewport: viewportSize,
      timing: {
        navigation: 0,
        contentLoad: 0,
        domContentLoaded: 0,
        load: 0,
        domInteractive: 0
      }
    }
  };

  let browser;
  let page;
  
  try {
    console.log(`Starting accessibility test for URL: ${url}`);
    
    // Launch browser with appropriate arguments
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        `--window-size=${viewportSize.width},${viewportSize.height}`
      ],
      defaultViewport: {
        width: viewportSize.width,
        height: viewportSize.height,
        deviceScaleFactor: 1,
      },
      timeout: timeout
    });

    // Create a new page
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: viewportSize.width,
      height: viewportSize.height,
      deviceScaleFactor: 1,
    });
    
    // Enable request interception to block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Block unnecessary resources to speed up page load
      const resourceType = req.resourceType();
      if (
        ['image', 'stylesheet', 'font', 'media'].includes(resourceType) ||
        req.url().includes('google-analytics') ||
        req.url().includes('googletagmanager') ||
        req.url().includes('facebook') ||
        req.url().includes('twitter')
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Handle authentication if credentials are provided
    if (auth?.username && auth?.password) {
      await page.authenticate({
        username: auth.username,
        password: auth.password
      });
    }

    // Navigate to the URL
    console.log(`Navigating to: ${url}`);
    const navigationStart = Date.now();
    const response = await page.goto(url, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: timeout
    });
    
    // Wait for additional time if specified
    if (waitForTimeout > 0) {
      console.log(`Waiting for additional ${waitForTimeout}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitForTimeout));
    }
    
    // Wait for specific selector if provided
    if (waitForSelector) {
      console.log(`Waiting for selector: ${waitForSelector}`);
      try {
        await page.waitForSelector(waitForSelector, {
          timeout: timeout
        });
      } catch (e) {
        console.warn(`Selector ${waitForSelector} not found`);
      }
    }
    
    // Wait for network to be idle
    await waitForNetworkIdle(page, 2000);
    
    // Get page metrics and timing
    const metrics = await page.metrics();
    const timing = await page.evaluate(() => ({
      navigation: window.performance.timing.navigationStart,
      contentLoad: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
      domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
      load: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
      domInteractive: window.performance.timing.domInteractive - window.performance.timing.navigationStart
    }));
    
    // Get page title and content
    const pageTitle = await page.title();
    const pageContent = await page.content();
    
    // Take screenshot if requested
    let screenshot = '';
    if (takeScreenshot) {
      screenshot = await page.screenshot({ encoding: 'base64' }) as string;
    }
    
    // Run accessibility tests
    console.log('Running accessibility tests...');
    const axe = new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .options({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        },
        resultTypes: ['violations', 'incomplete', 'inapplicable', 'passes'],
        rules: {
          'color-contrast': { enabled: true },
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true }
        }
      });
    
    const axeResults = await axe.analyze();
    
    // Format the results
    result.success = true;
    result.pageTitle = pageTitle;
    result.pageContent = pageContent;
    result.screenshot = screenshot;
    result.issues = {
      violations: axeResults.violations || [],
      passes: axeResults.passes || [],
      incomplete: axeResults.incomplete || [],
      inapplicable: axeResults.inapplicable || []
    };
    
    if (result.metadata) {
      result.metadata.pageTitle = pageTitle;
      result.metadata.testEngine = axeResults.testEngine?.name || 'axe-core';
      result.metadata.timing = timing;
    }
    
    console.log('Accessibility test completed successfully');
    return result as TestResult;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in runAccessibilityTest:', error);
    
    // Try to capture screenshot on error
    if (page) {
      try {
        result.screenshot = await page.screenshot({ encoding: 'base64' }) as string;
      } catch (e) {
        console.error('Failed to capture error screenshot:', e);
      }
    }
    
    result.success = false;
    result.error = errorMessage;
    
    // Add error to incomplete results
    result.issues = result.issues || {
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: []
    };
    
    result.issues.incomplete.push({
      id: 'test-error',
      impact: 'critical',
      tags: ['test-error'],
      description: 'An error occurred during testing',
      help: errorMessage,
      helpUrl: '',
      nodes: [{
        html: '<html>',
        target: ['html'],
        failureSummary: `Test failed with error: ${errorMessage}`
      }]
    });
    
    return result as TestResult;
    
  } finally {
    // Clean up
    try {
      if (page) await page.close().catch(console.error);
      if (browser) await browser.close().catch(console.error);
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      url, 
      viewport = 'desktop',
      waitForSelector,
      waitForTimeout,
      takeScreenshot = false,
      timeout = NAVIGATION_TIMEOUT,
      auth
    } = body as { 
      url: string; 
      viewport?: 'mobile' | 'tablet' | 'desktop';
      waitForSelector?: string;
      waitForTimeout?: number;
      takeScreenshot?: boolean;
      timeout?: number;
      auth?: {
        username: string;
        password: string;
      };
    };

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let testUrl: URL;
    try {
      testUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Use provided auth or fallback to environment variables
    const authOptions = auth || {
      username: AUTH_CREDENTIALS.username,
      password: AUTH_CREDENTIALS.password
    };

    // Run the accessibility test with all options
    const results = await runAccessibilityTest(
      testUrl.toString(), 
      viewport,
      {
        auth: authOptions,
        waitForSelector,
        waitForTimeout,
        takeScreenshot,
        timeout
      }
    );

    // Return the results
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    let errorMessage = 'Failed to perform accessibility test';
    let details = error instanceof Error ? error.message : 'Unknown error';

    // Provide more user-friendly error messages
    if (details.includes('Navigation failed') || details.includes('Timeout')) {
      errorMessage = 'The website took too long to load or is not accessible';
    } else if (details.includes('ERR_CONNECTION_REFUSED')) {
      errorMessage = 'Could not connect to the website. Please check the URL and try again.';
    } else if (details.includes('ERR_NAME_NOT_RESOLVED')) {
      errorMessage = 'Could not resolve the website address. Please check the URL for typos.';
    } else if (details.includes('ERR_SSL_PROTOCOL_ERROR') || details.includes('CERT_HAS_EXPIRED')) {
      errorMessage = 'SSL/security error occurred while accessing the website.';
    } else if (details.includes('frame was detached')) {
      errorMessage = 'The browser encountered an error while loading the page. The page might be too complex or have security restrictions.';
    } else if (details.includes('net::ERR_CONNECTION_REFUSED')) {
      errorMessage = 'Connection refused. The server may be down or not accepting connections.';
    } else if (details.includes('net::ERR_CONNECTION_TIMED_OUT')) {
      errorMessage = 'Connection timed out. The server is taking too long to respond.';
    } else if (details.includes('net::ERR_CERT_AUTHORITY_INVALID') || details.includes('net::ERR_CERT_DATE_INVALID')) {
      errorMessage = 'SSL certificate error. The website\'s security certificate is not valid.';
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: details,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Configure Next.js to run this as a serverless function
export const dynamic = 'force-dynamic';

// Error handling for uncaught exceptions
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
