// This file contains types and utilities for handling test results
// File system operations are handled by API routes to ensure compatibility with both server and client components

export interface TestResult {
  id: string;
  testId: string;
  testName: string;
  url: string;
  timestamp: string;
  status: 'running' | 'completed' | 'error';
  passed: boolean;
  details: string;
  steps: TestStep[];
  videoUrl?: string; // URL to the recorded video
  screenshots: string[];
  warnings?: string[];
  error?: string;
  focusedElement?: any;
}

export interface TestStep {
  action: string;
  timestamp: string;
  status?: string;
  [key: string]: any;
}

export interface ScreenRecorder {
  stop: () => Promise<string>; // Returns a blob URL
  blob: Blob;
  url: string;
}

export async function startScreenRecording(targetUrl: string): Promise<ScreenRecorder | null> {
  try {
    // Open the target URL in a new window
    const targetWindow = window.open(targetUrl, '_blank');
    if (!targetWindow) {
      throw new Error('Failed to open target window. Please allow popups for this site.');
    }

    // Wait for the new window to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Focus the target window
    targetWindow.focus();

    // Start screen recording with specific options
    const stream = await (navigator.mediaDevices as any).getDisplayMedia({
      video: {
        displaySurface: 'window',
        logicalSurface: true,
        cursor: 'always' as const,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 15, max: 30 }
      },
      audio: false,
      selfBrowserSurface: 'exclude',
      surfaceSwitching: 'exclude',
      systemAudio: 'exclude',
      preferCurrentTab: false
    });

    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const stopRecording = () => {
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch (e) {
          console.error('Error stopping recorder:', e);
        }
      }
      // Close the target window when recording stops
      if (targetWindow && !targetWindow.closed) {
        targetWindow.close();
      }
    };

    // Stop recording if the target window is closed
    const checkWindowClosed = setInterval(() => {
      if (targetWindow.closed && recorder.state !== 'inactive') {
        clearInterval(checkWindowClosed);
        stopRecording();
      }
    }, 500);

    return new Promise((resolve) => {
      recorder.onstop = () => {
        clearInterval(checkWindowClosed);
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Clean up stream
        stream.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });

        const screenRecorder: ScreenRecorder = { 
          blob,
          url,
          stop: async () => {
            URL.revokeObjectURL(url);
            if (!targetWindow.closed) {
              targetWindow.close();
            }
            return url; // Return the URL for consistency with the interface
          } 
        };

        resolve(screenRecorder);
      };

      recorder.start(1000); // Request data every second
    });
  } catch (error) {
    console.error('Error starting screen recording:', error);
    return null;
  }
}

export async function saveTestResult(result: Omit<TestResult, 'id'> & { id?: string }): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/${maxRetries}] Saving test result:`, 
        JSON.stringify({
          ...result,
          // Don't log screenshots to avoid cluttering the console
          screenshots: result.screenshots ? `[${result.screenshots.length} screenshots]` : undefined
        }, null, 2)
      );
      
      const response = await fetch('/api/test-results/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      const responseData = await response.json().catch(e => ({
        error: 'Failed to parse response',
        details: e.message
      }));
      
      console.log(`[Attempt ${attempt}/${maxRetries}] Save response:`, {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || 'Failed to save test result';
        throw new Error(errorMessage);
      }

      // If we get here, the save was successful
      return responseData.id || result.id || `${result.testId}-${Date.now()}`;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`[Attempt ${attempt}/${maxRetries}] Error in saveTestResult:`, {
        error: lastError,
        message: lastError.message,
        stack: lastError.stack,
        attempt,
        maxRetries
      });
      
      // If this was the last attempt, rethrow the error
      if (attempt === maxRetries) break;
      
      // Wait before retrying (exponential backoff)
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // If we get here, all retries failed
  const errorMessage = lastError 
    ? `Failed to save test result after ${maxRetries} attempts: ${lastError.message}`
    : `Failed to save test result after ${maxRetries} attempts`;
    
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export async function getTestResult(testId: string): Promise<TestResult | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/${maxRetries}] Fetching test result for ID:`, testId);
      
      // Try the new endpoint first
      const response = await fetch(`/api/test-results?id=${testId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json().catch(e => ({
        error: 'Failed to parse response',
        details: e.message
      }));
      
      console.log(`[Attempt ${attempt}/${maxRetries}] Get test result response:`, {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });

      if (response.ok) {
        // Handle the new response format
        if (responseData.success && responseData.result) {
          return responseData.result;
        }
        // Fall through to error handling if result is missing
      }

      // If we get here, the request failed or the response format was unexpected
      throw new Error(
        responseData.error || 
        responseData.message || 
        (responseData.success === false ? 'Request failed' : 'Invalid response format')
      );
      
    } catch (error) {
      lastError = error as Error;
      console.error(`[Attempt ${attempt}/${maxRetries}] Error in getTestResult:`, {
        error: lastError,
        message: lastError.message,
        stack: lastError.stack,
        attempt,
        maxRetries
      });
      
      // If this was the last attempt, try the legacy endpoint as a fallback
      if (attempt === maxRetries) {
        try {
          console.log('Trying legacy endpoint as fallback...');
          const legacyResponse = await fetch(`/api/test-results?testId=${testId}`);
          if (legacyResponse.ok) {
            const legacyData = await legacyResponse.json();
            console.log('Legacy endpoint response:', legacyData);
            return legacyData;
          }
        } catch (legacyError) {
          console.error('Legacy endpoint also failed:', legacyError);
        }
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // If we get here, all retries failed
  const errorMessage = `Failed to fetch test result after ${maxRetries} attempts`;
  console.error(errorMessage, {
    testId,
    lastError: lastError?.message || 'Unknown error',
    timestamp: new Date().toISOString()
  });
  
  return null;
}
