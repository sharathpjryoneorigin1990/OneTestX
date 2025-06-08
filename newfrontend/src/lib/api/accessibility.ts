import { TestResult, TestRunOptions } from '@/types/accessibility';

const API_BASE_URL = '/api/accessibility';

export interface RunTestParams extends Omit<TestRunOptions, 'waitFor' | 'waitForSelector' | 'waitForTimeout'> {
  // Additional parameters if needed
}

export interface TestStatusResponse {
  testId: string;
  message: string;
  statusUrl: string;
}

/**
 * Run an accessibility test on the specified URL
 */
export const runAccessibilityTest = async (params: RunTestParams): Promise<TestStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      screenName: params.screenName,
      url: params.url,
      viewport: params.viewport || 'desktop',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to start accessibility test');
  }

  return response.json();
};

/**
 * Get the result of a specific accessibility test
 */
export const getTestResult = async (testId: string): Promise<TestResult> => {
  const response = await fetch(`${API_BASE_URL}/results/${testId}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch test result');
  }

  return response.json();
};

/**
 * Poll for test results until the test is complete or max attempts reached
 */
export const pollTestResult = async (
  testId: string, 
  interval = 2000, 
  maxAttempts = 30
): Promise<TestResult> => {
  let attempts = 0;
  
  const checkResult = async (): Promise<TestResult> => {
    attempts++;
    
    try {
      const result = await getTestResult(testId);
      return result;
    } catch (error) {
      if (attempts >= maxAttempts) {
        throw new Error('Test timed out. Please check the status later.');
      }
      
      // Wait for the interval before trying again
      await new Promise(resolve => setTimeout(resolve, interval));
      return checkResult();
    }
  };
  
  return checkResult();
};

/**
 * List all accessibility tests that have been run
 */
export const listAccessibilityTests = async (): Promise<Array<{
  id: string;
  screenName: string;
  url: string;
  viewport: string;
  timestamp: string;
}>> => {
  const response = await fetch(`${API_BASE_URL}/list`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch test list');
  }

  return response.json();
};

/**
 * Run a test and automatically poll for results
 */
export const runAndWaitForTest = async (
  params: RunTestParams,
  onUpdate?: (status: string) => void
): Promise<TestResult> => {
  onUpdate?.('Starting accessibility test...');
  
  try {
    // Start the test
    const { testId } = await runAccessibilityTest(params);
    onUpdate?.(`Test started with ID: ${testId}. Waiting for results...`);
    
    // Poll for results
    const result = await pollTestResult(testId, 2000, 30);
    onUpdate?.(`Test completed successfully! Found ${result.results.violations.length} issues.`);
    
    return result;
  } catch (error) {
    onUpdate?.(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};
