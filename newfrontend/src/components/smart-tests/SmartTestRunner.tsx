'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveTestRun, loadTestHistory, clearTestHistory } from '@/lib/testStorage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { 
  FiPlay, 
  FiRefreshCw, 
  FiChevronDown, 
  FiChevronUp, 
  FiCheck, 
  FiX, 
  FiInfo, 
  FiPlus, 
  FiExternalLink,
  FiAlertTriangle,
  FiChevronRight,
  FiClock
} from 'react-icons/fi';

type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

export interface TestStep {
  action: string;
  target?: string;
  value?: string;
  status: TestStatus;
  duration?: number;
  error?: string;
}

export interface Test {
  id: string;
  name: string;
  description: string;
  type: string;
  url: string;
  status: TestStatus;
  duration?: number;
  error?: string;
  lastRun?: Date;
  browser?: string;
  viewport?: string;
  steps?: TestStep[];
}

// This interface is kept for backward compatibility
export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'visual' | 'functional' | 'api' | 'e2e';
  url: string;
  status: TestStatus;
  duration?: number;
  error?: string;
  steps?: TestStep[];
  lastRun?: Date;
  browser?: string;
  viewport?: string;
}

// Helper components
const StatusBadge = ({ status }: { status: TestStatus }) => {
  const statusMap = {
    passed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Passed' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    running: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Running' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[status].bg} ${statusMap[status].text}`}>
      {status === 'running' && <FiRefreshCw className="animate-spin mr-1 h-3 w-3" />}
      {statusMap[status].label}
    </span>
  );
};

const TestTypeBadge = ({ type }: { type: string }) => {
  const typeMap: Record<string, { bg: string; text: string }> = {
    visual: { bg: 'bg-purple-100', text: 'text-purple-800' },
    functional: { bg: 'bg-blue-100', text: 'text-blue-800' },
    api: { bg: 'bg-green-100', text: 'text-green-800' },
    e2e: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeMap[type]?.bg || 'bg-gray-100'} ${typeMap[type]?.text || 'text-gray-800'}`}>
      {type.toUpperCase()}
    </span>
  );
};

interface TestHistory {
  [key: string]: Test[];
}

export default function SmartTestRunner() {
  const [tests, setTests] = useState<Test[]>([]);
  const [testHistory, setTestHistory] = useState<TestHistory>({});
  const [showHistory, setShowHistory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load test history and latest test run on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Loading initial test history...');
        const history = await loadTestHistory();
        console.log('Initial test history loaded:', Object.keys(history).length, 'entries');
        
        setTestHistory(history);
        
        // Load the most recent test run if available
        const timestamps = Object.keys(history).sort().reverse();
        if (timestamps.length > 0) {
          const latestTimestamp = timestamps[0];
          const latestTests = history[latestTimestamp];
          console.log('Loading latest test run from:', latestTimestamp, 'with', latestTests?.length, 'tests');
          
          if (Array.isArray(latestTests) && latestTests.length > 0) {
            setTests(latestTests);
          }
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading test history:', error);
        setTestHistory({});
        setTests([]);
        setIsInitialized(true);
      }
    };
    loadInitialData();
  }, []);
  

  
  // Ensure tests is always an array and has the correct structure
  const safeTests = (() => {
    if (!Array.isArray(tests)) return [];
    return tests.map(test => ({
      ...test,
      steps: Array.isArray(test.steps) ? test.steps : [],
      status: test.status || 'pending',
      type: test.type || 'functional',
      url: test.url || ''
    }));
  })();
  
  const passedTests = safeTests.filter(t => t.status === 'passed').length;
  const failedTests = safeTests.filter(t => t.status === 'failed').length;
  const totalDuration = safeTests.reduce((sum, test) => sum + (test.duration || 0), 0);
  const avgDuration = safeTests.length > 0 ? Math.round(totalDuration / safeTests.length) : 0;

  const loadTestRun = useCallback((timestamp: string) => {
    const historyEntry = testHistory[timestamp];
    if (Array.isArray(historyEntry)) {
      setTests(historyEntry);
      setShowHistory(false);
    } else {
      console.error('Invalid test history entry:', historyEntry);
    }
  }, [testHistory]);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [detailedTest, setDetailedTest] = useState<Test | null>(null);
  
  const viewDetailedResults = (test: Test) => {
    setDetailedTest(test);
  };

  const closeDetailedResults = () => {
    setDetailedTest(null);
  };
  const [url, setUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Initialize with empty tests
  useEffect(() => {
    setTests([]);
  }, []);

  const toggleTestDetails = (testId: string) => {
    setSelectedTest(selectedTest === testId ? null : testId);
  };

  // Save test run to history and update local state
  const saveTests = useCallback(async (updatedTests: Test[]) => {
    // Update local state immediately
    setTests(updatedTests);
    
    try {
      console.log('Saving test run with', updatedTests.length, 'tests');
      const success = await saveTestRun(updatedTests);
      
      if (success) {
        // Refresh the history after saving
        const updatedHistory = await loadTestHistory();
        setTestHistory(updatedHistory);
      }
      
      return success;
    } catch (error) {
      console.error('Error saving test run:', error);
      return false;
    }
  }, []);

  const runTest = async (testId: string) => {
    // Update test status to running
    setTests(prevTests => {
      const updatedTests = prevTests.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: 'running' as const,
              steps: test.steps?.map(step => ({ ...step, status: 'running' as const }))
            }
          : test
      ) as Test[];
      // Save the running state
      saveTests(updatedTests);
      return updatedTests;
    });

    // Simulate test execution with random duration
    const duration = Math.floor(Math.random() * 2000) + 500; // 0.5s - 2.5s
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // 80% chance of passing, 20% chance of failing
    const passed = Math.random() > 0.2;
    
    setTests(prevTests => {
      const updatedTests = prevTests.map(test => 
        test.id === testId
          ? {
              ...test,
              status: passed ? 'passed' as const : 'failed' as const,
              duration,
              error: passed ? undefined : 'Test assertion failed',
              lastRun: new Date(),
              steps: test.steps?.map(step => ({
                ...step,
                status: passed ? 'passed' as const : (Math.random() > 0.5 ? 'failed' as const : 'passed' as const),
                duration: Math.floor(Math.random() * 300) + 100
              }))
            }
          : test
      ) as Test[];
      // Save the completed test
      saveTests(updatedTests);
      return updatedTests;
    });
  };

  const runAllTests = async () => {
    if (tests.length === 0) return;
    
    setIsRunning(true);
    
    // Reset all tests to pending
    setTests(prevTests => {
      const resetTests = prevTests.map(test => ({
        ...test,
        status: 'pending' as const,
        duration: undefined,
        error: undefined,
        steps: test.steps?.map(step => ({
          ...step,
          status: 'pending' as const,
          duration: undefined
        }))
      })) as Test[];
      // Save the reset state
      saveTests(resetTests);
      return resetTests;
    });

    // Run each test with a small delay between them
    for (const test of safeTests) {
      await runTest(test.id);
      await new Promise(resolve => setTimeout(resolve, 500)); // Add delay between tests
    }
    
    setIsRunning(false);
  };

  // Focus URL input when shown
  useEffect(() => {
    if (showUrlInput && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [showUrlInput]);

  const validateUrl = (url: string) => {
    if (!url) {
      setError('Please enter a URL');
      return false;
    }
    
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      setError('');
      return true;
    } catch (e) {
      setError('Please enter a valid URL (e.g., example.com or https://example.com)');
      return false;
    }
  };

  // Analyze URL and generate tests
  const analyzeUrl = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    if (!validateUrl(url)) return;
    
    try {
      setIsAnalyzing(true);
      
      // Normalize URL
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const hostname = new URL(normalizedUrl).hostname;
      
      // Simulate API call to analyze page
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate test cases based on common page elements
      const newTest: TestCase = {
        id: `test-${Date.now()}`,
        name: `Test for ${hostname}`,
        description: `Automated test for ${hostname}`,
        type: 'visual',
        url: normalizedUrl,
        status: 'pending',
        browser: 'Chrome',
        viewport: '1920x1080',
        lastRun: new Date(),
        steps: [
          { 
            action: `Navigate to ${hostname}`, 
            target: normalizedUrl, 
            status: 'pending',
            duration: undefined
          },
          { 
            action: 'Verify page title exists and is not empty', 
            target: 'title',
            status: 'pending',
            duration: undefined
          },
          { 
            action: 'Check main content visibility', 
            target: 'main, .main, #main, [role="main"]',
            status: 'pending',
            duration: undefined
          },
          { 
            action: 'Verify navigation elements are present', 
            target: 'nav, .nav, #nav, [role="navigation"]',
            status: 'pending',
            duration: undefined
          },
          { 
            action: 'Check for broken images', 
            target: 'img[src]',
            status: 'pending',
            duration: undefined
          },
          { 
            action: 'Verify all links are valid', 
            target: 'a[href]',
            status: 'pending',
            duration: undefined
          },
          { 
            action: 'Verify footer exists', 
            target: 'footer, .footer, #footer',
            status: 'pending',
            duration: undefined
          },
          { 
            action: 'Check for interactive elements', 
            target: 'a, button, [role="button"], [onclick]',
            status: 'pending',
            duration: undefined
          },
          { 
            action: 'Verify images have alt text', 
            target: 'img:not([alt])',
            status: 'pending',
            duration: undefined
          }
        ]
      };
      
      setTests(prev => [...prev, newTest]);
      setShowUrlInput(false);
      setUrl('');
    } catch (error) {
      console.error('Error analyzing URL:', error);
      setError('Failed to analyze URL. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return <FiCheck className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <FiX className="h-4 w-4 text-red-500" />;
      case 'running':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 border border-gray-300 rounded" />;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'passed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Passed</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
      case 'running':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Running</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Pending</span>;
    }
  };

  const getTestTypeBadge = (type: string) => {
    const baseClasses = 'px-2 py-0.5 rounded text-xs font-medium';
    switch(type) {
      case 'visual':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Visual</span>;
      case 'functional':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Functional</span>;
      case 'api':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>API</span>;
      case 'e2e':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>End-to-End</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{type}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Test Runner</h1>
              <p className="text-gray-500 mt-1">Run and analyze automated tests for your application</p>
            </div>
            <div className="flex gap-3">
              <div className="flex gap-2">
                {!showUrlInput && (
                  <Button
                    variant="outline"
                    onClick={() => setShowUrlInput(true)}
                    className="flex items-center gap-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Test from URL
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2"
                  disabled={Object.keys(testHistory).length === 0}
                >
                  <FiClock className="h-4 w-4" />
                  View History
                </Button>
                <Button 
                  onClick={runAllTests} 
                  disabled={isRunning || safeTests.length === 0}
                  className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  {isRunning ? (
                    <>
                      <FiRefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <FiPlay className="h-4 w-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {showUrlInput && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="test-url" className="sr-only">Website URL</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiExternalLink className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="test-url"
                      ref={urlInputRef}
                      type="url"
                      placeholder="https://example.com"
                      className="pl-10"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && analyzeUrl()}
                    />
                  </div>
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={analyzeUrl} 
                    disabled={!url || isAnalyzing}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrl('');
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Summary */}
      {tests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Tests</div>
            <div className="text-2xl font-bold text-gray-900">{safeTests.length}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Passed</div>
            <div className="text-2xl font-bold text-green-600">
              {passedTests}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-600">
              {failedTests}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Average Duration</div>
            <div className="text-2xl font-bold text-gray-900">
              {avgDuration}ms
            </div>
          </div>
        </div>
      )}

      {/* Detailed Test Results Modal */}
      {detailedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Test Results: {detailedTest.name}</h2>
                  <p className="text-gray-600">{detailedTest.description}</p>
                </div>
                <button 
                  onClick={closeDetailedResults}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  {getStatusBadge(detailedTest.status)}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-lg font-semibold">{detailedTest.duration || 0}ms</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  {getTestTypeBadge(detailedTest.type)}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Test Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">URL</p>
                    <a 
                      href={detailedTest.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                    >
                      {detailedTest.url}
                      <FiExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Run</p>
                    <p className="text-sm text-gray-900">
                      {detailedTest.lastRun?.toLocaleString() || 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {detailedTest.steps && detailedTest.steps.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Test Steps</h3>
                  <div className="space-y-3">
                    {detailedTest.steps.map((step, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border ${
                          step.status === 'passed' ? 'border-green-100 bg-green-50' :
                          step.status === 'failed' ? 'border-red-100 bg-red-50' :
                          'border-gray-100 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {step.status ? getStatusIcon(step.status) : getStatusIcon('pending')}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{step.action}</p>
                            {step.target && (
                              <div className="mt-1">
                                <p className="text-xs text-gray-500">Target:</p>
                                <code className="text-xs bg-gray-100 p-1 rounded">
                                  {step.target}
                                </code>
                              </div>
                            )}
                            {step.duration && (
                              <div className="mt-2 text-xs text-gray-500">
                                Duration: {step.duration}ms
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailedTest.error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error Details</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{detailedTest.error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={closeDetailedResults}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => detailedTest && runTest(detailedTest.id)}
                  disabled={isRunning}
                >
                  <FiRefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                  Rerun Test
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-4">
        {safeTests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiInfo className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tests yet</h3>
            <p className="text-gray-500 mb-4">Add a test by entering a URL above or create a test manually.</p>
            <Button
              variant="outline"
              onClick={() => setShowUrlInput(true)}
              className="inline-flex items-center gap-2"
            >
              <FiPlus className="h-4 w-4" />
              Add Test from URL
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {safeTests.map((test: Test, index: number) => (
              <div key={test.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleTestDetails(test.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {getStatusIcon(test.status)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">{test.name}</h3>
                      <p className="text-sm text-gray-500">{test.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(test.status)}
                    {test.duration && (
                      <span className="text-sm text-gray-500">
                        {test.duration}ms
                      </span>
                    )}
                    {test.error && (
                      <span className="text-sm text-red-600">
                        {test.error}
                      </span>
                    )}
                    {selectedTest === test.id ? (
                      <FiChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {selectedTest === test.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Type</p>
                        <p>{getTestTypeBadge(test.type)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">URL</p>
                        <a 
                          href={test.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                        >
                          {test.url}
                          <FiExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Run</p>
                        <p className="text-sm text-gray-900">
                          {test.lastRun?.toLocaleString() || 'Never'}
                        </p>
                      </div>
                    </div>
                    
                    {test.steps && test.steps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Test Steps</h4>
                        <div className="space-y-2">
                          {test.steps?.map((step: TestStep, index: number) => (
                            <div 
                              key={index} 
                              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100"
                            >
                              <div className="mt-0.5">
                                {step.status ? getStatusIcon(step.status) : getStatusIcon('pending')}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{step.action}</p>
                                {step.target && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                      {step.target}
                                    </span>
                                  </p>
                                )}
                              </div>
                              {step.duration && (
                                <span className="text-xs text-gray-500">
                                  {step.duration}ms
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runTest(test.id)}
                        disabled={safeTests.length === 0 || test.status === 'running'}
                      >
                        {test.status === 'running' ? (
                          <>
                            <FiRefreshCw className="h-3 w-3 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <FiPlay className="h-3 w-3" />
                            Run Test
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewDetailedResults(test);
                        }}
                        className="text-indigo-600 hover:bg-indigo-50"
                      >
                        View Details
                      </Button>
                    </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Test History</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              {Object.keys(testHistory).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No test history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(testHistory)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([timestamp, tests]) => (
                      <div 
                        key={timestamp} 
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => loadTestRun(timestamp)}
                      >
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {new Date(timestamp).toLocaleString()}
                              </p>
                              {(() => {
                                const historyEntry = testHistory[timestamp];
                                const historyTests = Array.isArray(historyEntry) ? historyEntry : [];
                                const passed = historyTests.filter(t => t?.status === 'passed').length;
                                const failed = historyTests.filter(t => t?.status === 'failed').length;
                                const total = historyTests.length;
                                
                                // Get unique URLs from tests
                                const uniqueUrls = [...new Set(historyTests.map(test => test.url))];
                                
                                return (
                                  <>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${passed === total ? 'bg-green-100 text-green-800' : failed > 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {passed === total ? 'All Passed' : failed > 0 ? `${failed} Failed` : 'Running...'}
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        {total} test{total !== 1 ? 's' : ''} • {passed} passed • {failed} failed
                                      </span>
                                    </div>
                                    {uniqueUrls.length > 0 && (
                                      <div className="mt-1">
                                        <p className="text-xs text-gray-500 truncate">
                                          <span className="font-medium">URLs:</span> {uniqueUrls.slice(0, 2).join(', ')}
                                          {uniqueUrls.length > 2 && ` +${uniqueUrls.length - 2} more`}
                                        </p>
                                      </div>
                                    )}
                                    {historyTests.length > 0 && (
                                      <div className="mt-1">
                                        <p className="text-xs text-gray-500">
                                          <span className="font-medium">Tests:</span> {historyTests.slice(0, 3).map(t => t.name).join(', ')}
                                          {historyTests.length > 3 && ` +${historyTests.length - 3} more`}
                                        </p>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            <div className="flex items-center">
                              <FiChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
