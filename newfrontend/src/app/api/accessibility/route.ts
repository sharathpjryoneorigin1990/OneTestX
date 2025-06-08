import { NextResponse } from 'next/server';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { AxeResults, RunOptions } from 'axe-core';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

type ViewportType = 'desktop' | 'mobile' | 'tablet';

interface TestResult {
  id: string;
  url: string;
  viewport: ViewportType;
  timestamp: string;
  issues: {
    violations: any[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  };
  metadata: {
    testRunner: {
      name: string;
      version: string;
    };
    timestamp: string;
    url: string;
    toolOptions: {
      resultTypes: string[];
      reporter: string;
    };
  };
}

// Directory to store test results
const RESULTS_DIR = path.join(process.cwd(), 'results', 'accessibility');

// Ensure results directory exists
async function ensureResultsDir() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating results directory:', error);
  }
}

// Handle GET /api/accessibility
async function handleListTests() {
  try {
    await ensureResultsDir();
    const files = await fs.readdir(RESULTS_DIR);
    
    const testFiles = files.filter(file => file.endsWith('.json'));
    
    const testResults = await Promise.all(
      testFiles.map(async (file) => {
        try {
          const content = await fs.readFile(path.join(RESULTS_DIR, file), 'utf-8');
          return JSON.parse(content);
        } catch (error) {
          console.error(`Error reading test file ${file}:`, error);
          return null;
        }
      })
    );
    
    return NextResponse.json(testResults.filter(Boolean));
  } catch (error) {
    console.error('Error listing test results:', error);
    return NextResponse.json(
      { error: 'Failed to list test results' },
      { status: 500 }
    );
  }
}

// Handle GET /api/accessibility/:testId
async function handleGetTestResult(testId: string) {
  try {
    const filePath = path.join(RESULTS_DIR, `${testId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const testResult = JSON.parse(fileContent);
    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error reading test result:', error);
    return NextResponse.json(
      { error: 'Test result not found' },
      { status: 404 }
    );
  }
}

// Main request handler
export async function GET(
  request: Request,
  { params }: { params?: { testId?: string } }
) {
  const url = new URL(request.url);
  const testId = params?.testId || url.searchParams.get('testId');
  
  if (testId) {
    return handleGetTestResult(testId);
  }
  
  return handleListTests();
}

// POST /api/accessibility/run
export async function POST(request: Request) {
  let browser: Browser | null = null;
  
  try {
    const { url, viewport = 'desktop' as ViewportType } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Validate URL
    let testUrl: URL;
    try {
      testUrl = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Launch browser
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: getViewportSize(viewport),
      userAgent: getUserAgent(viewport)
    });
    
    const page = await context.newPage();
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Inject axe-core from CDN
    await page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.9.1/axe.min.js'
    });
    
    // Run accessibility tests
    const results = await page.evaluate(async () => {
      // TypeScript doesn't know about axe injected into the page
      const axe = (window as any).axe;
      
      const options: RunOptions = {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        },
        resultTypes: ['violations', 'inapplicable', 'incomplete', 'passes']
      };
      
      return await axe.run(document, options) as AxeResults;
    });
    
    // Format results
    const testResult: TestResult = {
      id: `test_${Date.now()}`,
      url: testUrl.toString(),
      viewport,
      timestamp: new Date().toISOString(),
      issues: {
        violations: results.violations || [],
        passes: results.passes || [],
        incomplete: results.incomplete || [],
        inapplicable: results.inapplicable || []
      },
      metadata: {
        testRunner: {
          name: 'axe-core',
          version: (await import('axe-core/package.json')).version
        },
        timestamp: new Date().toISOString(),
        url: testUrl.toString(),
        toolOptions: {
          resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
          reporter: 'v2'
        }
      }
    };
    
    // Save test result to file
    await ensureResultsDir();
    const filePath = path.join(RESULTS_DIR, `${testResult.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(testResult, null, 2));
    
    return NextResponse.json(testResult);
    
  } catch (error) {
    console.error('Error running accessibility test:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run accessibility test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper functions
function getViewportSize(viewport: ViewportType) {
  switch (viewport) {
    case 'mobile':
      return { width: 375, height: 812 }; // iPhone X
    case 'tablet':
      return { width: 768, height: 1024 }; // iPad
    case 'desktop':
    default:
      return { width: 1366, height: 768 }; // Desktop
  }
}

function getUserAgent(viewport: ViewportType) {
  switch (viewport) {
    case 'mobile':
      return 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
    case 'tablet':
      return 'Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1';
    case 'desktop':
    default:
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }
}

// List tests functionality is handled by the main GET handler above
