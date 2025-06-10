import { HeadlessTestRunner } from './headless-test-runner';
import path from 'path';
import fs from 'fs';

export interface KeyboardTestResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  logs: Array<{ type: string; text: string }>;
  testName: string;
  timestamp: string;
}

export async function runKeyboardTest(
  url: string, 
  testName: string,
  testFunction: (page: any) => Promise<void>
): Promise<KeyboardTestResult> {
  const runner = new HeadlessTestRunner();
  
  try {
    await runner.initialize();
    
    // Run the test
    const result = await runner.runTest(url, testFunction);
    
    // Save the video to a permanent location
    let videoUrl: string | undefined;
    if (result.videoPath) {
      const videoDir = path.join(process.cwd(), 'public', 'test-videos');
      const videoName = `test-${Date.now()}.webm`;
      const videoPath = path.join(videoDir, videoName);
      
      await runner.saveVideo(videoPath);
      videoUrl = `/test-videos/${videoName}`;
    }

    return {
      success: result.success,
      videoUrl,
      error: result.error,
      logs: result.consoleLogs || [],
      testName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Test execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs: [],
      testName,
      timestamp: new Date().toISOString()
    };
  } finally {
    await runner.cleanup();
  }
}

// Test function for tab navigation
export async function testTabNavigation(page: any): Promise<void> {
  console.log('Testing tab navigation...');
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Press Tab to navigate through focusable elements
  await page.keyboard.press('Tab');
  
  // Wait a bit to see the focus change
  await page.waitForTimeout(500);
  
  // Get the currently focused element
  const focusedElement = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement;
    return {
      tag: active?.tagName,
      id: active?.id,
      class: active?.className,
      text: active?.textContent?.trim(),
      role: active?.getAttribute('role'),
      name: active?.getAttribute('name') || active?.getAttribute('aria-label')
    };
  });
  
  console.log('Focused element after Tab:', focusedElement);
  
  // Add more tab presses and assertions as needed
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  
  console.log('Tab navigation test completed');
}

// Example test function for keyboard shortcuts
export async function testKeyboardShortcut(page: any, key: string, expectedAction: () => Promise<boolean>): Promise<void> {
  await page.keyboard.press(key);
  const actionPerformed = await expectedAction();
  if (!actionPerformed) {
    throw new Error(`Keyboard shortcut ${key} did not perform the expected action`);
  }
}
