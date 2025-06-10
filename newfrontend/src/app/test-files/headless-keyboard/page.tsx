'use client';

import { useState } from 'react';
import { TestRunner, TestResult } from '@/components/TestRunner';

// Define test cases
const TEST_CASES = [
  {
    id: 'tab-navigation',
    name: 'Tab Navigation',
    description: 'Tests keyboard navigation using Tab and Shift+Tab',
    run: async () => {
      // This will be replaced with actual test logic
      return {
        success: true,
        testName: 'Tab Navigation',
        url: window.location.href,
        screenshot: '',
        video: null,
        logs: [{ type: 'info', text: 'Test completed successfully' }],
        timestamp: new Date().toISOString()
      };
    }
  },
  {
    id: 'keyboard-shortcuts',
    name: 'Keyboard Shortcuts',
    description: 'Tests common keyboard shortcuts',
    run: async () => {
      // This will be replaced with actual test logic
      return {
        success: true,
        testName: 'Keyboard Shortcuts',
        url: window.location.href,
        screenshot: '',
        video: null,
        logs: [{ type: 'info', text: 'Test completed successfully' }],
        timestamp: new Date().toISOString()
      };
    }
  }
] as const;

interface TestCase {
  id: string;
  name: string;
  description: string;
  run: () => Promise<TestResult>;
}

export default function HeadlessKeyboardTestPage() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});
  const [targetUrl, setTargetUrl] = useState('https://example.com');

  const runTest = async (testCase: TestCase) => {
    setRunningTests(prev => ({ ...prev, [testCase.id]: true }));
    
    try {
      const result = await testCase.run();
      setTestResults(prev => ({
        ...prev,
        [testCase.id]: result
      }));
      return result;
    } catch (error) {
      console.error(`Test ${testCase.name} failed:`, error);
      const errorResult: TestResult = {
        success: false,
        testName: testCase.name,
        url: window.location.href,
        screenshot: '',
        video: null,
        logs: [{
          type: 'error',
          text: error instanceof Error ? error.message : 'Unknown error'
        }],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResults(prev => ({
        ...prev,
        [testCase.id]: errorResult
      }));
      return errorResult;
    } finally {
      setRunningTests(prev => ({
        ...prev,
        [testCase.id]: false
      }));
    }
  };

  const runAllTests = async () => {
    const results: Record<string, TestResult> = {};
    
    for (const testCase of TEST_CASES) {
      results[testCase.id] = await runTest(testCase);
    }
    
    return results;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Headless Keyboard Testing</h1>
      
      <div className="mb-6 space-y-4">
        <div>
          <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Target URL
          </label>
          <input
            type="text"
            id="targetUrl"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={runAllTests}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={Object.values(runningTests).some(Boolean)}
          >
            Run All Tests
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {TEST_CASES.map((testCase) => (
          <TestRunner
            key={testCase.id}
            testId={testCase.id}
            testName={testCase.name}
            description={testCase.description}
            onRunTest={() => runTest(testCase)}
            isLoading={!!runningTests[testCase.id]}
            result={testResults[testCase.id]}
          />
        ))}
      </div>
    </div>
  );
}
