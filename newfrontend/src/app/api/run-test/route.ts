import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { url, testName } = await request.json();
    
    // Validate input
    if (!url || !testName) {
      return NextResponse.json(
        { error: 'URL and testName are required' },
        { status: 400 }
      );
    }

    console.log(`Starting test for ${url} with test: ${testName}`);
    
    // Create test results directory if it doesn't exist
    const testResultsDir = path.join(process.cwd(), 'public', 'test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: path.join(testResultsDir, 'videos'),
        size: { width: 1280, height: 720 }
      }
    });

    const page = await context.newPage();
    
    // Collect console logs
    const logs: Array<{ type: string; text: string }> = [];
    page.on('console', msg => {
      logs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Take a screenshot
    const screenshotPath = path.join(testResultsDir, 'screenshot.png');
    await page.screenshot({ path: screenshotPath });

    // Wait a bit to ensure video is captured
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Close the page and browser
    await page.close();
    await context.close();
    await browser.close();

    // Get the video file
    const videoFiles = fs.readdirSync(path.join(testResultsDir, 'videos'));
    const videoFile = videoFiles.find(file => file.endsWith('.webm'));
    
    const result = {
      success: true,
      testName,
      url,
      screenshot: '/test-results/screenshot.png',
      video: videoFile ? `/test-results/videos/${videoFile}` : null,
      logs,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Test execution failed:', error);
    return NextResponse.json(
      { error: 'Test execution failed', details: error.message },
      { status: 500 }
    );
  }
}
