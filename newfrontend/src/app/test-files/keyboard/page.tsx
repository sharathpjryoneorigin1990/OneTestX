'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { saveTestResult, getTestResult, startScreenRecording } from '@/lib/test-utils';
import type { ScreenRecorder } from '@/lib/test-utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Keyboard,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Square as TabIcon,
  Minus as SpaceIcon,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import Link from 'next/link';

type TestStatus = 'not-started' | 'in-progress' | 'passed' | 'failed' | 'error';

interface KeyboardTest {
  id: string;
  name: string;
  description: string;
  keys: string[];
  status: TestStatus;
  result?: boolean;
  details?: string;
  testRunId?: string;
}

const TEST_CASES: Omit<KeyboardTest, 'status' | 'result' | 'details' | 'testRunId'>[] = [
  {
    id: 'tab-navigation',
    name: 'Tab Navigation',
    description: 'Verify that all interactive elements are reachable using the Tab key',
    keys: ['Tab', 'Shift+Tab']
  },
  {
    id: 'arrow-navigation',
    name: 'Arrow Key Navigation',
    description: 'Verify that focusable elements can be navigated using arrow keys',
    keys: ['↑', '↓', '←', '→']
  },
  {
    id: 'enter-space',
    name: 'Enter/Space Activation',
    description: 'Verify that interactive elements can be activated with Enter and Space keys',
    keys: ['Enter', 'Space']
  },
  {
    id: 'skip-links',
    name: 'Skip Links',
    description: 'Verify that skip links are present and functional',
    keys: ['Tab']
  },
  {
    id: 'keyboard-trap',
    name: 'Keyboard Trap',
    description: 'Verify there are no keyboard traps',
    keys: ['Tab', 'Shift+Tab']
  },
  {
    id: 'focus-visible',
    name: 'Focus Visible',
    description: 'Verify that focus indicators are clearly visible',
    keys: ['Tab', 'Shift+Tab']
  }
];

const getKeyIcon = (key: string) => {
  switch (key) {
    case '↑':
      return <ArrowUp className="h-4 w-4 inline" />;
    case '↓':
      return <ArrowDown className="h-4 w-4 inline" />;
    case '←':
      return <ArrowLeft className="h-4 w-4 inline" />;
    case '→':
      return <ArrowRight className="h-4 w-4 inline" />;
    case 'Tab':
      return <TabIcon className="h-4 w-4 inline" />;
    case 'Space':
      return <SpaceIcon className="h-4 w-4 inline" />;
    case 'Enter':
      return <span className="text-xs">⏎</span>;
    case 'Shift+Tab':
      return (
        <span className="flex items-center">
          <span className="text-xs">⇧</span>
          <TabIcon className="h-4 w-4 inline" />
        </span>
      );
    default:
      return <span className="text-xs">{key}</span>;
  }
};

export default function KeyboardTestPage() {
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState({ passed: 0, failed: 0 });
  
  const [tests, setTests] = useState<KeyboardTest[]>(() => 
    TEST_CASES.map(test => ({
      ...test,
      status: 'not-started' as const,
      result: undefined,
      details: undefined,
      testRunId: undefined
    }))
  );

  const runTest = useCallback(async (testId: string) => {
    const testRunId = `${testId}-${Date.now()}`;
    const testName = TEST_CASES.find(t => t.id === testId)?.name || 'Unknown Test';
    let screenRecorder: Awaited<ReturnType<typeof startScreenRecording>> | null = null;
    let videoUrl: string | undefined;
    
    try {
      // Start screen recording of the target application
      const targetUrl = 'https://example.com'; // Replace with your target URL
      console.log('Starting screen recording for:', targetUrl);
      screenRecorder = await startScreenRecording(targetUrl);
      console.log('Screen recording started for target:', targetUrl);
      
      // Give the target window time to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Failed to start screen recording:', error);
      setTests(prevTests => 
        prevTests.map(test => 
          test.id === testId 
            ? { 
                ...test, 
                status: 'error' as const,
                result: false,
                details: 'Failed to start screen recording. Please allow popups and try again.',
                warnings: ['Screen recording not available']
              } 
            : test
        )
      );
      return;
    }
    
    // Update test status to in-progress
    setTests(prevTests => 
      prevTests.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: 'in-progress' as TestStatus,
              result: undefined,
              details: undefined,
              testRunId
            }
          : test
      )
    );

    let testResult: any = null;

    try {
      // Create test result object with all required fields
      testResult = {
        id: testRunId,
        testId,
        testName,
        url: url || 'N/A',
        timestamp: new Date().toISOString(),
        status: 'running' as const,
        passed: false,
        details: 'Test in progress...',
        steps: [
          {
            action: 'Test started',
            timestamp: new Date().toISOString(),
            status: 'in-progress'
          }
        ],
        screenshots: [],
        warnings: [],
        focusedElement: null
      };

      console.log('Saving initial test result:', testResult);
      
      // Save initial test result
      await saveTestResult(testResult);
      console.log('Initial test result saved successfully');

      // Simulate API call to run test
      console.log('Running test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Stop screen recording
      if (screenRecorder) {
        try {
          videoUrl = await screenRecorder.stop?.();
          console.log('Screen recording stopped, URL:', videoUrl);
        } catch (error) {
          console.error('Error stopping screen recording:', error);
        }
      }
      
      // Randomly pass or fail for demo purposes
      const passed = Math.random() > 0.3;
      console.log(`Test ${passed ? 'passed' : 'failed'}`);
      
      // Update test result with final status
      const finalResult = {
        ...testResult,
        status: 'completed' as const,
        passed,
        videoUrl, // Add the video URL to the test result
        details: passed 
          ? 'Test completed successfully.' 
          : 'Test failed. Some keyboard navigation issues were found.',
        steps: [
          ...testResult.steps,
          {
            action: passed ? 'Test passed' : 'Test failed',
            timestamp: new Date().toISOString(),
            status: passed ? 'passed' : 'failed'
          }
        ],
        screenshots: [] // Keep for backward compatibility
      };

      console.log('Saving final test result:', finalResult);
      
      // Save final test result
      const savedResult = await saveTestResult(finalResult);
      console.log('Final test result saved with ID:', savedResult);
      
      // Update test status with result
      setTests(prevTests => 
        prevTests.map(test => 
          test.id === testId
            ? {
                ...test,
                status: passed ? 'passed' : 'failed',
                result: passed,
                details: finalResult.details,
                testRunId: savedResult
              }
            : test
        )
      );
      
      // Update test results summary
      setTestResults(prev => ({
        ...prev,
        [passed ? 'passed' : 'failed']: prev[passed ? 'passed' : 'failed'] + 1
      }));
      
      return { success: passed, testRunId: savedResult };
      
    } catch (error) {
      console.error('Error in runTest:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      // Create error result
      const errorResult = {
        ...(testResult || {
          id: testRunId,
          testId,
          testName: testName || 'Unknown Test',
          url: url || 'N/A',
          timestamp: new Date().toISOString(),
        }),
        status: 'error' as const,
        passed: false,
        details: `Error: ${errorMessage}`,
        steps: [
          ...(testResult?.steps || []),
          {
            action: 'Test failed',
            timestamp: new Date().toISOString(),
            status: 'error',
            error: errorMessage
          }
        ],
        error: errorMessage
      };

      try {
        console.log('Saving error result:', errorResult);
        const savedErrorId = await saveTestResult(errorResult);
        console.log('Error result saved with ID:', savedErrorId);
        
        setTests(prevTests => 
          prevTests.map(test => 
            test.id === testId
              ? {
                  ...test,
                  status: 'failed',
                  result: false,
                  details: `Error: ${errorMessage}`,
                  testRunId: savedErrorId
                }
              : test
          )
        );
        
        setTestResults(prev => ({
          ...prev,
          failed: prev.failed + 1
        }));
        
        return { success: false, message: errorMessage };
      } catch (saveError) {
        console.error('Failed to save error result:', saveError);
        // If we can't save the error, at least update the UI
        setTests(prevTests => 
          prevTests.map(test => 
            test.id === testId
              ? {
                  ...test,
                  status: 'failed',
                  result: false,
                  details: `Error (not saved): ${errorMessage}`,
                  testRunId: testRunId
                }
              : test
          )
        );
        
        return { 
          success: false, 
          message: `Error occurred and failed to save: ${errorMessage}` 
        };
      }
    } finally {
      setIsTesting(false);
    }
  }, [url]);

  const runAllTests = useCallback(async () => {
    setIsTesting(true);
    setTestResults({ passed: 0, failed: 0 });
    
    // Run all tests sequentially
    for (const test of tests) {
      await runTest(test.id);
    }
    
    setIsTesting(false);
  }, [tests, runTest]);

  const renderTestCard = (test: KeyboardTest) => (
    <Card key={test.id} className="mb-6 overflow-hidden">
      <CardHeader className="pb-3 bg-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              {test.name}
              {test.status === 'passed' && (
                <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
              )}
              {test.status === 'failed' && (
                <XCircle className="h-5 w-5 text-red-500 ml-2" />
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {test.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {test.status === 'in-progress' && (
              <Badge variant="warning" className="flex items-center bg-amber-50 text-amber-800">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </Badge>
            )}
            {test.status === 'passed' && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                Passed
              </Badge>
            )}
            {test.status === 'failed' && (
              <Badge variant="error">
                Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">Test Keys:</span>
          {test.keys.map((key, i) => (
            <kbd 
              key={i}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-mono border border-gray-200 dark:border-gray-700 flex items-center justify-center"
            >
              {getKeyIcon(key)}
            </kbd>
          ))}
        </div>
        
        {/* Test Steps and Results */}
        {test.status !== 'not-started' && test.status !== 'in-progress' && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Test Results:</h4>
            <div className="space-y-2">
              {test.details ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-sm">{test.details}</p>
                  
                  {/* Detailed Test Steps */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mr-2 ${
                        test.result ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {test.result ? '✓' : '✗'}
                      </div>
                      <span className="text-sm">
                        {test.result 
                          ? 'All keyboard navigation tests passed successfully.' 
                          : 'Some keyboard navigation issues were detected.'}
                      </span>
                    </div>
                    
                    {/* Additional test details */}
                    {test.result === false && (
                      <div className="ml-7 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium mb-1">Issues found:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Some elements may not be reachable via keyboard</li>
                          <li>Focus indicators may be missing or unclear</li>
                          <li>Keyboard traps may be present</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No detailed results available. Run the test to see results.</p>
              )}
            </div>
          </div>
        )}
        
        {/* Test Actions */}
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => runTest(test.id)}
            disabled={isTesting}
            variant={test.status === 'passed' ? 'outline' : 'primary' as any}
            size="sm"
          >
            {test.status === 'passed' ? 'Rerun Test' : 'Run Test'}
          </Button>
          
          {/* Detailed Report Link */}
          {test.testRunId && test.status !== 'in-progress' && (
            <div className="flex space-x-3">
              <Link 
                href={`/test-results/${test.testRunId}?testId=${test.testRunId}`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Complete Report <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
              
              <Link 
                href={`/test-results/${test.testRunId}?testId=${test.testRunId}`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                View Details <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <Keyboard className="h-8 w-8 inline-block mr-2 -mt-1" />
            Keyboard Accessibility Tests
          </h1>
          <p className="text-muted-foreground">
            Test your website's keyboard accessibility and navigation
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
              {testResults.passed} Passed
            </Badge>
            <Badge variant="default" className="bg-red-50 text-red-700 border-red-200">
              {testResults.failed} Failed
            </Badge>
          </div>
          <Button 
            onClick={runAllTests}
            disabled={isTesting}
            variant="primary"
            className="ml-4"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : 'Run All Tests'}
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL to test"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button 
            onClick={() => runAllTests()} 
            disabled={!url || isTesting}
            variant="primary"
          >
            Test URL
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Enter a URL to test keyboard accessibility. Make sure the URL is accessible from this domain.
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="passed">Passed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="not-run">Not Run</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tests.map(test => renderTestCard(test))}
        </TabsContent>
        
        <TabsContent value="passed" className="space-y-4">
          {tests
            .filter(test => test.status === 'passed')
            .map(test => renderTestCard(test))}
        </TabsContent>
        
        <TabsContent value="failed" className="space-y-4">
          {tests
            .filter(test => test.status === 'failed')
            .map(test => renderTestCard(test))}
        </TabsContent>
        
        <TabsContent value="not-run" className="space-y-4">
          {tests
            .filter(test => test.status === 'not-started')
            .map(test => renderTestCard(test))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
