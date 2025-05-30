import type { Test } from '@/components/smart-tests/SmartTestRunner';

const API_BASE_URL = '/api/test-history';

export const saveTestRun = async (tests: Test[]) => {
  try {
    console.log('Saving test run with tests:', tests);
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tests, null, 2),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('Failed to save test run:', response.status, errorText);
      throw new Error(`Failed to save test run: ${response.status} ${response.statusText}`);
    }
    
    console.log('Successfully saved test run');
    return true;
  } catch (error) {
    console.error('Error in saveTestRun:', error);
    return false;
  }
};

export const loadTestHistory = async (): Promise<Record<string, Test[]>> => {
  try {
    console.log('Loading test history from:', API_BASE_URL);
    const response = await fetch(API_BASE_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('Error response:', errorText);
      throw new Error(`Failed to load test history: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Loaded test history data:', JSON.stringify(data, null, 2));
    
    // Ensure the data is in the correct format
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Convert timestamps to proper format if needed
      const formattedData: Record<string, Test[]> = {};
      
      for (const [timestamp, tests] of Object.entries(data)) {
        if (Array.isArray(tests)) {
          formattedData[timestamp] = tests;
        }
      }
      
      console.log('Formatted test history:', formattedData);
      return formattedData;
    }
    
    console.error('Unexpected test history format:', data);
    return {};
  } catch (error) {
    console.error('Error in loadTestHistory:', error);
    // Return empty object instead of throwing to prevent UI crash
    return {};
  }
};

export const clearTestHistory = async () => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear test history');
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing test history:', error);
    return false;
  }
};
