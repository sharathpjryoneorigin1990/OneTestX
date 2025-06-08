import { useState, useCallback } from 'react';
import { TestResult } from '@/types/accessibility';
import { runAndWaitForTest, RunTestParams } from '@/lib/api/accessibility';

export const useAccessibilityTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const runTest = useCallback(async (params: RunTestParams) => {
    setIsLoading(true);
    setError(null);
    setStatus('');
    
    try {
      const result = await runAndWaitForTest(params, (message) => {
        setStatus(prev => `${prev ? `${prev}\n` : ''}${message}`);
      });
      
      setTestResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run accessibility test';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetTest = useCallback(() => {
    setTestResult(null);
    setError(null);
    setStatus('');
  }, []);

  return {
    isLoading,
    testResult,
    error,
    status,
    runTest,
    resetTest,
  };
};
