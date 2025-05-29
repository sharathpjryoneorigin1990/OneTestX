'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/use-toast';
import { FiPlay, FiRefreshCw, FiCheck, FiX, FiAlertTriangle, FiImage, FiCopy } from 'react-icons/fi';
import Image from 'next/image';

interface VisualTestResult {
  success: boolean;
  isNewBaseline?: boolean;
  match?: boolean;
  diffPercentage?: number;
  diffPath?: string | null;
  baselinePath?: string;
  actualPath?: string;
  message?: string;
}

interface VisualTest {
  name: string;
  runs: Array<{
    name: string;
    timestamp: Date;
    path: string;
  }>;
  lastRun: Date;
  baselineCount: number;
}

const VisualTestRunner: React.FC = () => {
  const { toast } = useToast();
  const [testUrl, setTestUrl] = useState('http://localhost:3000');
  const [testName, setTestName] = useState('homepage');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<VisualTestResult | null>(null);
  const [tests, setTests] = useState<VisualTest[]>([]);
  const [activeTab, setActiveTab] = useState('run');
  const [selectedTest, setSelectedTest] = useState<VisualTest | null>(null);
  const [threshold, setThreshold] = useState(0.1);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [viewportHeight, setViewportHeight] = useState(800);

  // Load saved tests on component mount
  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      console.log('Fetching visual tests...');
      const response = await fetch('/api/visual-tests');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch tests:', response.status, errorText);
        throw new Error(`Failed to fetch tests: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received test data:', data);
      setTests(data.tests || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load visual tests'
      });
    }
  };

  const runVisualTest = async () => {
    if (!testUrl || !testName) {
      toast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide both URL and test name'
      });
      return;
    }

    setIsRunning(true);
    setTestResult(null);

    try {
      // Step 1: Capture screenshot
      const captureResponse = await fetch('/api/visual-tests/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl, testName }),
      });

      if (!captureResponse.ok) {
        throw new Error('Failed to capture screenshot');
      }

      const captureData = await captureResponse.json();

      // Step 2: Compare with baseline
      const compareResponse = await fetch('/api/visual-tests/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName,
          actualPath: captureData.path,
          threshold,
          viewport: { width: viewportWidth, height: viewportHeight },
        }),
      });

      // Check if response is JSON
      const contentType = compareResponse.headers.get('content-type');
      let compareData;
      
      try {
        compareData = contentType?.includes('application/json')
          ? await compareResponse.json()
          : { error: 'Invalid response format' };
      } catch (e) {
        const text = await compareResponse.text();
        throw new Error(`Failed to parse response: ${text}`);
      }
      
      if (!compareResponse.ok) {
        const errorMessage = compareData?.error || 
                           compareData?.details || 
                           `Failed to compare images (${compareResponse.status} ${compareResponse.statusText})`;
        throw new Error(errorMessage);
      }

      setTestResult(compareData);
      
      // Refresh test list and switch to history tab if this is a new baseline
      await fetchTests();
      if (compareData.isNewBaseline) {
        setActiveTab('history');
      }

      // Show appropriate toast
      if (compareData.isNewBaseline) {
        toast({
          type: 'success',
          title: 'New Baseline Created',
          message: 'This is the first run for this test. A baseline has been created.'
        });
      } else if (compareData.match) {
        toast({
          type: 'success',
          title: 'Test Passed',
          message: 'No visual differences detected'
        });
      } else {
        toast({
          type: 'error',
          title: 'Test Failed',
          message: `Visual differences detected (${compareData.diffPercentage?.toFixed(2)}%)`
        });
      }
    } catch (error) {
      console.error('Visual test failed:', error);
      toast({
        type: 'error',
        title: 'Test Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestSelect = async (test: VisualTest) => {
    try {
      setSelectedTest(test);
      setTestName(test.name);
      
      // If there are runs, load the most recent one
      if (test.runs?.length > 0) {
        const latestRun = test.runs[0];
        const response = await fetch('/api/visual-tests/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testName: test.name,
            actualPath: latestRun.path,
            threshold
          })
        });

        if (response.ok) {
          const data = await response.json();
          setTestResult({
            ...data,
            // Ensure we have the actual path from the run
            actualPath: latestRun.path
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load test results');
        }
      }
    } catch (error) {
      console.error('Error loading test results:', error);
      toast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load test results'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      type: 'success',
      title: 'Copied to clipboard',
      message: 'The path has been copied to your clipboard'
    });
  };

  const updateBaseline = async () => {
    if (!testName || !testResult?.actualPath) {
      toast({
        type: 'error',
        title: 'Error',
        message: 'Test name or actual image path is missing'
      });
      return;
    }

    try {
      setIsRunning(true);
      const response = await fetch('/api/visual-tests/update-baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName,
          actualPath: testResult.actualPath
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      try {
        data = contentType?.includes('application/json')
          ? await response.json()
          : { error: 'Invalid response format' };
      } catch (e) {
        const text = await response.text();
        throw new Error(`Failed to parse response: ${text}`);
      }

      if (!response.ok) {
        const errorMessage = data?.error || 
                           data?.details || 
                           `Failed to update baseline (${response.status} ${response.statusText})`;
        throw new Error(errorMessage);
      }

      toast({
        type: 'success',
        title: 'Success',
        message: data.message || 'Baseline updated successfully'
      });

      // Refresh the test list and results
      await fetchTests();
      if (testUrl && testName) {
        await runVisualTest();
      }
    } catch (error: unknown) {
      console.error('Error updating baseline:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while updating the baseline';
      toast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visual Testing</h2>
          <p className="text-muted-foreground">Capture and compare visual regressions in your UI</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchTests}
          disabled={isRunning}
        >
          <FiRefreshCw className={`mr-2 h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          Refresh Tests
        </Button>
      </div>

      <Tabs
        defaultValue="run"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="run">Run Test</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run Visual Test</CardTitle>
              <CardDescription>
                Capture a screenshot of a URL and compare it with the baseline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testUrl">URL to Test</Label>
                  <Input
                    id="testUrl"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="homepage-test"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold (0-1)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Viewport Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={viewportWidth}
                    onChange={(e) => setViewportWidth(parseInt(e.target.value, 10))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Viewport Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={viewportHeight}
                    onChange={(e) => setViewportHeight(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={runVisualTest} 
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Running...
                    </>
                  ) : (
                    <>
                      <FiPlay className="mr-2 h-4 w-4" />
                      Run Test
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {testResult && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Test Result: {testResult.success ? '✅ Passed' : '❌ Failed'}
                  </CardTitle>
                  {testResult.actualPath && (
                    <Button 
                      variant="outline" 
                      onClick={updateBaseline}
                      className="ml-4"
                      disabled={isRunning}
                    >
                      {isRunning ? 'Updating...' : 'Update Baseline'}
                    </Button>
                  )}
                </div>
                <CardTitle>Test Results</CardTitle>
                <div className="flex items-center">
                  {testResult.isNewBaseline ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FiImage className="mr-1 h-3 w-3" />
                      New Baseline
                    </span>
                  ) : testResult.match ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FiCheck className="mr-1 h-3 w-3" />
                      Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <FiX className="mr-1 h-3 w-3" />
                      Failed
                    </span>
                  )}
                </div>
                {testResult.message && (
                  <CardDescription>{testResult.message}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Baseline</h4>
                  {testResult.baselinePath ? (
                    <div className="relative border rounded-md overflow-hidden">
                      <Image
                        src={`/api/image?path=${encodeURIComponent(testResult.baselinePath)}`}
                        alt="Baseline"
                        width={600}
                        height={400}
                        className="w-full h-auto"
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(testResult.baselinePath || '')}
                        >
                          <FiCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                      <span className="text-muted-foreground">No baseline available</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Current</h4>
                    {testResult.diffPercentage !== undefined && !testResult.isNewBaseline && (
                      <span className="text-sm font-medium">
                        Difference: {testResult.diffPercentage.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  {testResult.actualPath ? (
                    <div className="relative border rounded-md overflow-hidden">
                      <Image
                        src={`/api/image?path=${encodeURIComponent(testResult.actualPath)}`}
                        alt="Current"
                        width={600}
                        height={400}
                        className="w-full h-auto"
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(testResult.actualPath || '')}
                        >
                          <FiCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                      <span className="text-muted-foreground">No current image available</span>
                    </div>
                  )}
                </div>
                {testResult.diffPath && !testResult.match && (
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-2">Difference</h4>
                    <div className="relative border rounded-md overflow-hidden">
                      <Image
                        src={`/api/image?path=${encodeURIComponent(testResult.diffPath)}`}
                        alt="Difference"
                        width={1200}
                        height={800}
                        className="w-full h-auto"
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(testResult.diffPath || '')}
                        >
                          <FiCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>
                View and manage your visual test baselines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <div className="text-center py-8">
                  <FiAlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No tests found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Run a visual test to create your first baseline
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Test Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Last Run
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Baselines
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tests.map((test) => (
                        <tr 
                          key={test.name}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedTest?.name === test.name ? 'bg-blue-50' : ''}`}
                          onClick={() => handleTestSelect(test)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {test.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(test.lastRun).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {test.baselineCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              className="whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTestName(test.name);
                                setActiveTab('run');
                              }}
                            >
                              <FiPlay className="mr-1 h-3.5 w-3.5" />
                              Run Again
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisualTestRunner;
