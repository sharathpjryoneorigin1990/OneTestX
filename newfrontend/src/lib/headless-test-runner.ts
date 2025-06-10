import { chromium, type Browser, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface TestResult {
  success: boolean;
  videoPath?: string;
  error?: string;
  logs?: string[];
  consoleLogs: Array<{ type: string; text: string }>;
}

export class HeadlessTestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private videoPath: string | null = null;
  private consoleLogs: Array<{ type: string; text: string }> = [];

  async initialize() {
    try {
      // Launch browser in headless mode with necessary permissions
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });

      // Create a new context with video recording enabled
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: {
          dir: 'test-results/videos/',
          size: { width: 1280, height: 720 }
        },
        permissions: ['clipboard-read', 'clipboard-write', 'camera', 'microphone']
      });

      // Set up console logging
      this.context.on('console', msg => {
        this.consoleLogs.push({
          type: msg.type(),
          text: msg.text()
        });
      });

      this.page = await this.context.newPage();
      return true;
    } catch (error) {
      console.error('Failed to initialize headless browser:', error);
      throw error;
    }
  }

  async runTest(url: string, testFunction: (page: Page) => Promise<void>): Promise<TestResult> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    try {
      console.log(`Navigating to URL: ${url}`);
      
      // Navigate to the target URL with networkidle to ensure page is fully loaded
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 60000 // 60 seconds timeout for page load
      });
      
      console.log('Page loaded, running test function...');
      
      // Execute the test function
      await testFunction(this.page);
      
      console.log('Test function completed');

      // Get the video path
      let videoPath: string | undefined;
      const video = this.page.video();
      if (video) {
        // Save the video
        const videoDir = path.join(process.cwd(), 'public', 'test-videos');
        if (!fs.existsSync(videoDir)) {
          fs.mkdirSync(videoDir, { recursive: true });
        }
        
        const videoName = `test-${Date.now()}.webm`;
        videoPath = path.join('test-videos', videoName);
        const fullVideoPath = path.join(process.cwd(), 'public', videoPath);
        
        // Close the page to finalize the video
        await this.page.close();
        this.page = null;
        
        // Wait for the video to be saved
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // The video is automatically saved by Playwright, we just need to move it
        const tempVideoPath = await video.path();
        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
          fs.renameSync(tempVideoPath, fullVideoPath);
          console.log(`Video saved to: ${fullVideoPath}`);
        } else {
          console.warn('Could not find video file at:', tempVideoPath);
        }
      }

      return {
        success: true,
        videoPath: videoPath ? `/${videoPath.replace(/\\/g, '/')}` : undefined,
        consoleLogs: this.consoleLogs
      };
    } catch (error) {
      console.error('Test failed:', error);
      
      // Try to save the video even if the test fails
      let videoPath: string | undefined;
      const video = this.page?.video();
      if (video) {
        try {
          const videoDir = path.join(process.cwd(), 'public', 'test-videos');
          if (!fs.existsSync(videoDir)) {
            fs.mkdirSync(videoDir, { recursive: true });
          }
          
          const videoName = `test-error-${Date.now()}.webm`;
          videoPath = path.join('test-videos', videoName);
          const fullVideoPath = path.join(process.cwd(), 'public', videoPath);
          
          // Close the page to finalize the video
          if (this.page) {
            await this.page.close();
            this.page = null;
          }
          
          // Wait for the video to be saved
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // The video is automatically saved by Playwright, we just need to move it
          const tempVideoPath = await video.path();
          if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            fs.renameSync(tempVideoPath, fullVideoPath);
            videoPath = `/${videoPath.replace(/\\/g, '/')}`;
            console.log(`Error video saved to: ${fullVideoPath}`);
          }
        } catch (videoError) {
          console.error('Failed to save error video:', videoError);
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        videoPath,
        consoleLogs: this.consoleLogs
      };
    }
  }

  async cleanup() {
    console.log('Cleaning up test resources...');
    
    try {
      // Close the current page if it exists
      if (this.page) {
        await this.page.close().catch(e => console.error('Error closing page:', e));
        this.page = null;
      }
      
      // Close the browser context
      if (this.context) {
        await this.context.close().catch(e => console.error('Error closing context:', e));
        this.context = null;
      }
      
      // Close the browser
      if (this.browser) {
        await this.browser.close().catch(e => console.error('Error closing browser:', e));
        this.browser = null;
      }
      
      console.log('Cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    } finally {
      // Ensure all references are cleared
      this.page = null;
      this.context = null;
      this.browser = null;
    }
  }

  // Helper method to save the video to a specific location
  async saveVideo(destinationPath: string): Promise<boolean> {
    if (!this.videoPath) return false;

    try {
      // Ensure the destination directory exists
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Copy the video file
      fs.copyFileSync(this.videoPath, destinationPath);
      return true;
    } catch (error) {
      console.error('Failed to save video:', error);
      return false;
    }
  }
}
