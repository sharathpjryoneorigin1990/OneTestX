'use client';

import React, { useState, useCallback } from 'react';
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
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

type TestStatus = 'not-started' | 'in-progress' | 'passed' | 'failed';

interface KeyboardTest {
  id: string;
  name: string;
  description: string;
  keys: string[];
  status: TestStatus;
  result?: boolean;
  details?: string;
}

export default function KeyboardTestPage() {
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState({ passed: 0, failed: 0 });
  
  // Dummy keyboard tests
  const [tests, setTests] = useState<KeyboardTest[]>([
    {
      id: 'tab-navigation',
      name: 'Tab Navigation',
      description: 'Verify that all interactive elements are reachable using the Tab key',
      keys: ['Tab', 'Shift+Tab'],
      status: 'not-started'
    },
    {
      id: 'arrow-navigation',
      name: 'Arrow Key Navigation',
      description: 'Verify that focusable elements can be navigated using arrow keys',
      keys: ['↑', '↓', '←', '→'],
      status: 'not-started'
    },
    {
      id: 'enter-space-activation',
      name: 'Enter/Space Activation',
      description: 'Verify that buttons and links can be activated with Enter/Space',
      keys: ['Enter', 'Space'],
      status: 'not-started'
    },
    {
      id: 'skip-links',
      name: 'Skip Links',
      description: 'Verify that skip links are present and functional',
      keys: ['Tab (from start)'],
      status: 'not-started'
    },
    {
      id: 'keyboard-traps',
      name: 'No Keyboard Traps',
      description: 'Verify that keyboard focus is never trapped',
      keys: ['Tab', 'Shift+Tab'],
      status: 'not-started'
    },
    {
      id: 'focus-visible',
      name: 'Focus Visible',
      description: 'Verify that focus indicators are clearly visible',
      keys: ['Tab', 'Arrow keys'],
      status: 'not-started'
    }
  ]);

  const runTest = useCallback(async (testId: string) => {
    // Update test status to in-progress
    setTests(prevTests => 
      prevTests.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: 'in-progress',
              result: undefined,
              details: undefined
            }
          : test
      )
    );

    try {
      // Ensure we have a valid URL
      if (!url || !url.startsWith('http')) {
        throw new Error('Please enter a valid URL starting with http:// or https://');
      }

      // Use the backend URL from environment variables or fallback to default
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
      const apiUrl = `${backendUrl}/api/keyboard-tests/run`;
      console.log('Calling API:', apiUrl);
      console.log('Request payload:', { testId, url });
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const urlWithTimestamp = `${apiUrl}?t=${timestamp}`;
      
      let response;
      try {
        response = await fetch(urlWithTimestamp, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            testId, 
            url,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        const fetchError = error as Error;
        console.error('Network error:', fetchError);
        throw new Error(`Cannot connect to the backend server at ${apiUrl}. Please ensure the server is running and accessible. Error: ${fetchError.message}`);
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('API Error Response:', errorData);
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
        console.log('API Response:', result);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server. The response could not be parsed as JSON.');
      }
      
      if (typeof result !== 'object' || result === null) {
        throw new Error('Invalid response format from server. Expected an object.');
      }
      
      const passed = Boolean(result.passed);
      const details = typeof result.details === 'string' ? result.details : 'Test completed without details';
      
      setTests(prevTests => 
        prevTests.map(test => {
          if (test.id === testId) {
            return {
              ...test,
              status: passed ? 'passed' : 'failed',
              result: passed,
              details
            };
          }
          return test;
        })
      );

      // Update test results summary
      setTestResults(prev => ({
        passed: prev.passed + (passed ? 1 : 0),
        failed: prev.failed + (passed ? 0 : 1)
      }));
      
      return passed;
    } catch (error: unknown) {
      console.error('Error running test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setTests(prevTests => 
        prevTests.map(test => 
          test.id === testId 
            ? { 
                ...test, 
                status: 'failed',
                result: false,
                details: `Error: ${errorMessage}`
              }
            : test
        )
      );
      
      throw error;
    }
  }, [url]);

  const runAllTests = useCallback(() => {
    setIsTesting(true);
    setTestResults({ passed: 0, failed: 0 });
    
    // Run tests one by one
    const runNextTest = async (index: number) => {
      if (index >= tests.length) {
        setIsTesting(false);
        return;
      }
      
      const test = tests[index];
      await runTest(test.id);
      
      // Add delay between tests
      setTimeout(() => runNextTest(index + 1), 2000);
    };
    
    runNextTest(0);
  }, [runTest, tests]);

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return <Badge variant="success">Passed</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'in-progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Testing...
        </span>;
      default:
        return <Badge variant="default">Not Started</Badge>;
    }
  };

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
        return <span className="flex items-center">
          <span className="text-xs">⇧</span><TabIcon className="h-4 w-4 inline" />
        </span>;
      default:
        return <span className="text-xs">{key}</span>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Keyboard className="h-8 w-8 mr-2" />
          Keyboard Accessibility Testing
        </h1>
        <p className="text-muted-foreground">
          Test your website&apos;s keyboard accessibility and navigation
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Enter a URL to test keyboard accessibility
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setUrl(window.location.href);
                }}
              >
                Use Current Page
              </Button>
              <Button 
                onClick={runAllTests}
                disabled={isTesting}
                className="bg-blue-600 hover:bg-blue-700"
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
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); runAllTests(); }}>
            <div className="grid gap-4">
              <div>
                <label htmlFor="test-url" className="block text-sm font-medium mb-1">
                  Test URL
                </label>
                <div className="flex space-x-2">
                  <input
                    id="test-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Test Cases</TabsTrigger>
          <TabsTrigger value="guide">Keyboard Navigation Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                {testResults.passed + testResults.failed > 0 ? (
                  <span>
                    {testResults.passed} passed, {testResults.failed} failed
                  </span>
                ) : 'Run tests to see results'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tests.map((test) => (
                  <Card key={test.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{test.name}</h3>
                          <p className="text-sm text-muted-foreground">{test.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {test.keys.map((key, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-800 mr-1">
                                {getKeyIcon(key)}
                              </span>
                            ))}
                          </div>
                          {test.details && (
                            <div className={`mt-2 text-sm ${test.result === false ? 'text-red-600' : 'text-green-600'}`}>
                              {test.details}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(test.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runTest(test.id)}
                            disabled={isTesting}
                          >
                            {test.status === 'in-progress' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : test.status === 'not-started' ? (
                              'Run'
                            ) : (
                              'Run Again'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyboard Navigation Guide</CardTitle>
              <CardDescription>
                Learn how to test keyboard accessibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h3>Testing Keyboard Navigation</h3>
                <p>
                  Keyboard accessibility is crucial for users who cannot use a mouse or have motor impairments.
                  Follow these steps to test keyboard navigation:
                </p>
                <ol>
                  <li>Use <kbd>Tab</kbd> to move forward through interactive elements</li>
                  <li>Use <kbd>Shift</kbd> + <kbd>Tab</kbd> to move backward</li>
                  <li>Use <kbd>Enter</kbd> or <kbd>Space</kbd> to activate buttons and links</li>
                  <li>Use arrow keys for components like menus, sliders, and radio groups</li>
                </ol>

                <h3>Common Issues</h3>
                <ul>
                  <li>Focus indicators not visible</li>
                  <li>Keyboard traps where focus gets stuck</li>
                  <li>Missing keyboard support for custom components</li>
                  <li>Incorrect tab order</li>
                  <li>Missing skip links</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
