import { NextResponse } from 'next/server';
import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

interface ViewportSize {
  width: number;
  height: number;
}

interface TestResult {
  id: string;
  url: string;
  viewport: string;
  timestamp: string;
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
    viewport: ViewportSize;
  };
}

// Helper function to clean up resources
async function cleanupResources(page: Page | null, browser: Browser | null) {
  try {
    if (page && !page.isClosed()) {
      await page.close().catch(console.error);
    }
    if (browser) {
      await browser.close().catch(console.error);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

export async function POST(request: Request) {
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    // Parse request body
    const body = await request.json();
    const { url, viewport = 'desktop' } = body as { url: string; viewport?: string };

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

    // Configure viewport sizes
    const viewportSizes = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 800 },
    } as const;

    const viewportSize: ViewportSize = viewportSizes[viewport as keyof typeof viewportSizes] || viewportSizes.desktop;

    // Configure browser launch options
    const launchOptions: puppeteer.PuppeteerLaunchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        `--window-size=${viewportSize.width},${viewportSize.height}`
      ],
      timeout: 60000,
      ignoreHTTPSErrors: true
    };

    // Launch browser and set up page
    console.log('Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    if (!browser) throw new Error('Failed to launch browser');
    
    console.log('Browser launched, creating new page...');
    page = await browser.newPage();
    if (!page) throw new Error('Failed to create new page');
    
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(60000);
    
    // Set viewport and other page settings
    await page.setViewport(viewportSize);
    await page.setBypassCSP(true);
    
    // Set up request interception for better performance
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Skip non-essential resources
      if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate to the target URL
    console.log(`Navigating to ${testUrl.toString()}...`);
    
    let response: HTTPResponse | null = null;
    try {
      response = await page.goto(testUrl.toString(), {
        waitUntil: ['domcontentloaded', 'load', 'networkidle0'],
        timeout: 60000
      });
      
      if (!response) {
        throw new Error('No response received from page load');
      }
      
      if (!response.ok()) {
        throw new Error(`Page load failed with status: ${response.status()}`);
      }
      
      console.log('Page loaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown navigation error';
      console.error('Navigation error:', errorMessage);
      throw new Error(`Failed to load page: ${errorMessage}`);
    }

    // Wait for page to be fully interactive
    console.log('Waiting for page to be fully interactive...');
    try {
      await page.waitForFunction(
        'document.readyState === "complete"',
        { timeout: 30000 }
      );
      console.log('Page is fully loaded');
    } catch (error) {
      console.warn('Page did not reach complete state, continuing anyway');
    }

    // Run accessibility tests with Axe
    console.log('Running accessibility tests...');
    
    let results;
    try {
      const axe = new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .options({
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
          },
          rules: {
            'color-contrast': { enabled: true },
            'image-alt': { enabled: true },
            'label': { enabled: true },
            'link-name': { enabled: true },
            'button-name': { enabled: true }
          },
          resultTypes: ['violations', 'incomplete', 'inapplicable', 'passes']
        });
      
      results = await axe.analyze();
      
      if (!results) {
        throw new Error('No results returned from accessibility analysis');
      }
      
      console.log(`Found ${results.violations.length} accessibility violations`);
    } catch (error) {
      console.error('Error during accessibility analysis:', error);
      throw new Error(`Accessibility analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Format the results
    const formatNodes = (nodes: any[]) => {
      return nodes.map(node => ({
        html: node.html || '',
        target: node.target || [],
        ...(node.failureSummary && { failureSummary: node.failureSummary }),
        ...(node.any && {
          relatedNodes: node.any.flatMap((a: any) => 
            (a.relatedNodes || []).map((n: any) => ({
              html: n.html || '',
              target: n.target || []
            }))
          )
        })
      }));
    };

    const formatIssue = (issue: any) => ({
      id: issue.id,
      description: issue.description,
      help: issue.help,
      helpUrl: issue.helpUrl,
      impact: issue.impact || 'moderate',
      tags: issue.tags || [],
      nodes: formatNodes(issue.nodes || [])
    });

    const formattedResults: TestResult = {
      id: `test_${Date.now()}`,
      url: testUrl.toString(),
      viewport,
      timestamp: new Date().toISOString(),
      issues: {
        violations: results.violations.map(formatIssue),
        passes: results.passes.map(formatIssue),
        incomplete: results.incomplete.map(formatIssue),
        inapplicable: results.inapplicable.map(formatIssue)
      },
      metadata: {
        testEngine: results.testEngine || 'axe-core',
        testRunner: results.testRunner || 'axe-puppeteer',
        testEnvironment: results.testEnvironment || 'node',
        url: results.url || testUrl.toString(),
        timestamp: results.timestamp || new Date().toISOString(),
        pageTitle: await page.title(),
        viewport: viewportSize
      }
    };

    console.log('Accessibility tests completed successfully');
    return NextResponse.json(formattedResults);
    
  } catch (error) {
    console.error('Error during test execution:', error);
    
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
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: details,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    // Ensure resources are always cleaned up
    await cleanupResources(page, browser);
  }
}

// Configure Next.js to run this as a serverless function
export const dynamic = 'force-dynamic';

// Error handling for uncaught exceptions
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
