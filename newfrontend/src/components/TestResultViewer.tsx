'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TestStep {
  action: string;
  timestamp: string;
  status?: 'success' | 'passed' | 'failed' | 'error' | 'warning' | 'info';
  details?: string;
  [key: string]: any;
}

interface TestResult {
  id: string;
  testId: string;
  testName: string;
  url: string;
  timestamp: string;
  status: 'running' | 'completed' | 'error';
  passed: boolean;
  details: string;
  steps: TestStep[];
  screenshots: string[];
  videoUrl?: string; // Added for video recording support
  duration?: number; // Duration in seconds
  warnings?: string[];
  error?: string;
  focusedElement?: any;
}

interface TestResultViewerProps {
  testId: string;
}

export default function TestResultViewer({ testId }: TestResultViewerProps) {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // No need for screenshot index anymore since we're using video
  const [rawData, setRawData] = useState<any>(null);

  // Debug: Log the raw data and test result
  useEffect(() => {
    console.log('Raw data:', rawData);
    console.log('Test result:', testResult);
  }, [rawData, testResult]);

  useEffect(() => {
    if (!testId) {
      setError('No test ID provided');
      setLoading(false);
      return;
    }

    const fetchTestResult = async () => {
      try {
        console.log(`Fetching test result for ID: ${testId}`);
        const response = await fetch(`/api/test-results?testId=${testId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch test result');
        }
        const data = await response.json();
        console.log('API Response:', data);
        
        setRawData(data);
        // Handle both direct and nested result structure
        const result = data.result || data;
        console.log('Processed result:', result);
        setTestResult(result);
      } catch (err) {
        console.error('Error fetching test result:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResult();
  }, [testId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !testResult) {
    return (
      <Card className="max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error || 'Test result not found'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/test-files/keyboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tests
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = () => {
    switch (testResult.status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-4 w-4 mr-1" /> Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Clock className="h-4 w-4 mr-1" /> Running
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-4 w-4 mr-1" /> Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/test-files/keyboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tests
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {testResult.testName || 'Test Result'}
            </h1>
            <p className="text-muted-foreground">
              Test ID: {testResult.id} • {formatTimestamp(testResult.timestamp)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              <span className="mr-2 text-sm text-muted-foreground">Status:</span>
              {getStatusBadge()}
            </div>
            {testResult.passed !== undefined && (
              <Badge 
                variant={testResult.passed ? 'success' : 'error'} 
                className="text-sm py-1 px-3"
              >
                {testResult.passed ? 'Test Passed' : 'Test Failed'}
              </Badge>
            )}
          </div>
        </div>
        
        {testResult.details && (
          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <h3 className="font-medium mb-2">Test Summary</h3>
            <p className="text-sm">{testResult.details}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-muted/50 pb-3">
              <CardTitle className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-2 h-5 w-5"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                  <line x1="10" x2="8" y1="9" y2="9" />
                </svg>
                Test Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Test Name</p>
                <p className="font-medium">{testResult.testName || 'N/A'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tested URL</p>
                <p className="break-all">
                  <a 
                    href={testResult.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {testResult.url}
                  </a>
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Test Started</p>
                <p className="text-sm">
                  {new Date(testResult.timestamp).toLocaleString()}
                </p>
              </div>
              
              {testResult.duration && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-sm">
                    {Math.floor(testResult.duration / 60)}:{(testResult.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Test ID</p>
                <div className="flex items-center">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                    {testResult.id}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 ml-1"
                    onClick={() => {
                      navigator.clipboard.writeText(testResult.id);
                      // Optionally show a toast notification
                    }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <span className="sr-only">Copy Test ID</span>
                  </Button>
                </div>
              </div>
              
              <div className="pt-2 mt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Test Result</p>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    testResult.passed ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm">
                    {testResult.passed ? 'All tests passed' : 'Some tests failed'}
                  </span>
                </div>
                {testResult.steps && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Steps: </span>
                    <span className="font-medium">
                      {testResult.steps.filter(s => s.status === 'passed' || s.status === 'success').length} / {testResult.steps.length}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-2 h-5 w-5"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                  <line x1="10" x2="8" y1="9" y2="9" />
                </svg>
                Test Steps
              </CardTitle>
              <CardDescription>
                {testResult.steps?.length || 0} steps completed • {formatTimestamp(testResult.timestamp)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {testResult.steps?.length ? testResult.steps.map((step, index) => {
                  const isError = step.status === 'error' || step.status === 'failed';
                  const isSuccess = step.status === 'success' || step.status === 'passed';
                  const isWarning = step.status === 'warning';
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-4 transition-colors ${
                        isError ? 'bg-red-50 dark:bg-red-900/20' : 
                        isWarning ? 'bg-amber-50 dark:bg-amber-900/20' :
                        isSuccess ? 'bg-green-50 dark:bg-green-900/10' : 
                        'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-6 flex items-center">
                          <div className={`h-2 w-2 rounded-full ${
                            isError ? 'bg-red-500' :
                            isWarning ? 'bg-amber-500' :
                            isSuccess ? 'bg-green-500' : 'bg-primary'
                          }`}></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              isError ? 'text-red-800 dark:text-red-200' :
                              isWarning ? 'text-amber-800 dark:text-amber-200' :
                              isSuccess ? 'text-green-800 dark:text-green-200' : ''
                            }`}>
                              {step.action.replace(/_/g, ' ')}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(step.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {step.details && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.details}
                            </p>
                          )}
                          
                          {Object.entries(step)
                            .filter(([key]) => !['action', 'timestamp', 'status', 'details'].includes(key))
                            .map(([key, value]) => (
                              <div key={key} className="mt-2 text-xs bg-muted/30 p-2 rounded">
                                <span className="font-mono font-medium">{key}:</span>{' '}
                                <span className="font-mono break-all">{String(value)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="48" 
                      height="48" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="mx-auto h-12 w-12 mb-3 text-muted-foreground/30"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" x2="12" y1="18" y2="12" />
                      <line x1="9" x2="15" y1="15" y2="15" />
                    </svg>
                    <p className="text-sm">No test steps recorded</p>
                    <p className="text-xs mt-1">Run the test to see detailed steps</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warnings & Errors */}
          {(testResult.warnings?.length || testResult.error) && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-destructive">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {testResult.error ? 'Error' : 'Warnings'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResult.error && (
                  <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                    {testResult.error}
                  </div>
                )}
                {testResult.warnings?.map((warning, i) => (
                  <div key={i} className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md text-sm text-amber-700 dark:text-amber-300">
                    {warning}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Test Recording */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-2 h-5 w-5"
                >
                  <rect width="18" height="12" x="3" y="6" rx="2" ry="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M15 12a3 3 0 1 0-6 0" />
                </svg>
                Test Recording
              </CardTitle>
              <CardDescription>
                {testResult.videoUrl 
                  ? 'Video recording of the test execution' 
                  : 'No video recording is available for this test'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {testResult.videoUrl ? (
                <div className="relative aspect-video bg-black">
                  <video 
                    src={testResult.videoUrl} 
                    controls 
                    className="w-full h-full"
                    aria-label="Test execution recording"
                    playsInline
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {testResult.duration ? 
                      `Duration: ${Math.floor(testResult.duration / 60)}:${(testResult.duration % 60).toString().padStart(2, '0')}` : 
                      'Recording'}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted/30 flex flex-col items-center justify-center p-8 text-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="64" 
                    height="48" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                    <line x1="23" y1="13" x2="23" y2="11"></line>
                    <path d="M16 5l-5 5l-5-5"></path>
                  </svg>
                  <p className="text-muted-foreground">No video recording available for this test</p>
                  <p className="text-sm text-muted-foreground">Enable screen recording in your browser to record test executions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Data (for debugging) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Raw Test Data</CardTitle>
              <CardDescription>For debugging purposes</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs p-4 bg-muted rounded-md overflow-auto max-h-64">
                {JSON.stringify(rawData || testResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
