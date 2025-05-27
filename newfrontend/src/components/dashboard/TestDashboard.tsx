"use client";

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Search, Filter, Plus, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { testRunnerApi } from '@/utils/api';

// Simple loading spinner component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 ${sizeMap[size]}`} />
  );
};

type TestStatus = 'passed' | 'failed' | 'running' | 'pending';
type TestType = 'e2e' | 'unit' | 'integration' | 'performance' | 'accessibility' | 'smoke' | 'api' | 'other';

interface TestFile {
  id: string;
  name: string;
  path: string;
  type: TestType;
  category: string;
  lastRun?: {
    status: TestStatus;
    duration?: number;
    timestamp?: string;
  };
  size?: number;
  modified?: string;
}

const typeIcons = {
  e2e: '🔄',
  unit: '🧪',
  integration: '🔗',
  performance: '⚡',
  accessibility: '♿',
  smoke: '🔥',
  api: '🔌',
  other: '📄',
};

const typeLabels = {
  e2e: 'End-to-End',
  unit: 'Unit Tests',
  integration: 'Integration',
  performance: 'Performance',
  accessibility: 'Accessibility',
  smoke: 'Smoke Tests',
  api: 'API Tests',
  other: 'Other Tests',
};

export const TestDashboard: React.FC = () => {
  const [tests, setTests] = React.useState<TestFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isRunning, setIsRunning] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<TestType | 'all'>('all');
  const [selectedTests, setSelectedTests] = React.useState<Set<string>>(new Set());
  const { showToast } = useToast();
  
  // Memoize the showToast function to prevent unnecessary re-renders
  const memoizedShowToast = React.useCallback(showToast, []);

  // Group tests by type
  const testsByType = tests.reduce((acc, test) => {
    const type = test.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(test);
    return acc;
  }, {} as Record<string, TestFile[]>);

  // Get all test types with counts
  const testTypes = Object.entries(testsByType).map(([type, tests]) => ({
    type,
    count: tests.length,
    icon: typeIcons[type as keyof typeof typeIcons] || '📄',
    label: typeLabels[type as keyof typeof typeLabels] || type,
  }));

  // Filter tests based on search query and active tab
  const filteredTests = React.useMemo(() => {
    return tests.filter(test => {
      if (!test) return false;
      
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        test.name?.toLowerCase().includes(query) ||
        test.path?.toLowerCase().includes(query);
      
      const matchesTab = activeTab === 'all' || test.type === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [tests, searchQuery, activeTab]);

  // Memoized fetchTests function
  const fetchTests = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching test files...');
      
      // Make the API call
      const response = await testRunnerApi.getTestFiles();
      console.log('API Response:', response);
      
      // Handle different response formats
      let testData = [];
      
      // Case 1: Response is an array
      if (Array.isArray(response)) {
        testData = response;
      } 
      // Case 2: Response has a data property that's an array
      else if (response?.data && Array.isArray(response.data)) {
        testData = response.data;
      }
      // Case 3: Response has a data property that's an object with a tests array
      else if (response?.data?.tests && Array.isArray(response.data.tests)) {
        testData = response.data.tests;
      }
      // Case 4: Response is an object with a tests array
      else if (response?.tests && Array.isArray(response.tests)) {
        testData = response.tests;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error(`Unexpected response format: ${JSON.stringify(response, null, 2)}`);
      }
      
      console.log('Processing test data:', testData);
      
      // Safely transform the test data
      const formattedTests = testData
        .filter((test: any) => test) // Filter out any null/undefined items
        .map((test: any, index: number) => {
          // Ensure we have a valid test object
          if (!test) return null;
          
          return {
            id: test.id || test.path || `test-${index}`,
            name: test.name || test.testName || `Test ${index + 1}`,
            path: test.path || test.filePath || '',
            type: (test.type || test.testType || 'other').toLowerCase() as TestType,
            category: test.category || 'uncategorized',
            lastRun: test.lastRun ? {
              status: (test.lastRun.status || 'pending') as TestStatus,
              duration: test.lastRun.duration || 0,
              timestamp: test.lastRun.timestamp || new Date().toISOString()
            } : undefined
          };
        })
        .filter(Boolean); // Remove any null entries from the map
        
      setTests(formattedTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      memoizedShowToast({
        title: 'Error',
        message: 'Failed to fetch tests. Please try again later.',
        type: 'error',
      });
      // Set empty array to prevent undefined errors
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedShowToast]);

  // Initial data fetch
  React.useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Run a single test
  const runTest = async (testPath: string, testType: TestType) => {
    try {
      setIsRunning(true);
      // Use runTestFile with the required environment parameter
      const response = await testRunnerApi.runTestFile(testPath, 'default');
      
      // Update the test with the latest run status
      setTests(prevTests =>
        prevTests.map(test =>
          test.path === testPath
            ? { 
                ...test, 
                lastRun: {
                  status: response.success ? 'passed' : 'failed',
                  duration: response.duration || 0,
                  timestamp: new Date().toISOString()
                }
              }
            : test
        )
      );
      
      showToast({
        title: response.success ? 'Test Passed' : 'Test Failed',
        message: response.message || (response.success ? 'Test completed successfully' : 'Test failed'),
        type: response.success ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Error running test:', error);
      showToast({
        title: 'Error',
        message: 'Failed to run test. Please try again.',
        type: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  // Toggle test selection
  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(testId)) {
        newSelection.delete(testId);
      } else {
        newSelection.add(testId);
      }
      return newSelection;
    });
  };

  // Run all tests of a specific type
  const runAllTests = async (type: TestType | 'all') => {
    const testsToRun = type === 'all' 
      ? tests 
      : tests.filter(test => test.type === type);
    
    for (const test of testsToRun) {
      await runTest(test.path, test.type);
      // Small delay between test runs to prevent UI lockup
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (loading && tests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-400">Loading tests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Dashboard</h1>
          <p className="text-gray-400">Manage and run your test suites</p>
        </div>
        <div className="flex gap-2">
          {selectedTests.size > 0 && (
            <Button 
              variant="primary"
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-2 border-transparent hover:border-white/20 transition-all duration-300 shadow-lg transform hover:scale-105"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedTests.size} selected tests?`)) {
                  // Handle actual deletion here
                  showToast({
                    title: 'Success',
                    message: `Deleted ${selectedTests.size} tests`,
                    type: 'success',
                    duration: 3000
                  });
                  setSelectedTests(new Set());
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          )}
          <Button 
            variant="primary"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-2 border-transparent hover:border-white/20 transition-all duration-300 shadow-lg transform hover:scale-105"
            onClick={() => {
              // Navigate to test type selection page
              window.location.href = '/test-type';
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Test Suite
          </Button>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tests..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-2 border-transparent hover:border-white/20 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Test type tabs */}
      <Tabs 
        defaultValue="all"
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as TestType | 'all')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 bg-gray-900/50 p-1 rounded-xl">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-gray-800/50 hover:text-white border border-gray-700 hover:border-indigo-400/50"
          >
            <span className="mr-2">✨</span> All Tests
          </TabsTrigger>
          
          {testTypes.map(({ type, icon, label }) => {
            // Define different gradients for different test types
            const typeGradients: Record<string, string> = {
              e2e: 'from-blue-500 to-cyan-500',
              unit: 'from-green-500 to-emerald-500',
              integration: 'from-purple-500 to-pink-500',
              performance: 'from-yellow-500 to-orange-500',
              accessibility: 'from-red-500 to-pink-500',
              smoke: 'from-gray-500 to-blue-500',
              api: 'from-indigo-500 to-purple-600',
              other: 'from-gray-500 to-gray-600'
            };
            
            const gradientClass = typeGradients[type] || 'from-gray-500 to-gray-600';
            
            return (
              <TabsTrigger
                key={type}
                value={type}
                className={`data-[state=active]:bg-gradient-to-r ${gradientClass} data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-gray-800/50 hover:text-white border border-gray-700 hover:border-white/30 flex items-center justify-center gap-2`}
              >
                <span>{icon}</span>
                <span className="whitespace-nowrap">{label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Test list */}
        <div className="mt-6">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {loading ? 'Loading tests...' : 'No tests found matching your criteria.'}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTests.map((test) => (
                <div 
                  key={test.id || test.path}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-gray-700 text-blue-400">
                      {typeIcons[test.type] || typeIcons.other}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{test.name}</h3>
                      <p className="text-sm text-gray-400">{test.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md">
                      {test.type}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-transparent shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      onClick={() => runTest(test.path, test.type)}
                      disabled={loading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {loading ? 'Running...' : 'Run'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
