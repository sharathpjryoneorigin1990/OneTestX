"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import path from 'path';

interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

type TestStatus = 'passed' | 'failed' | 'running' | 'pending';

interface TestFile {
  name: string;
  path: string;
  category: string;
  tags: string[];
  testCases: TestCase[];
  lastRun?: {
    status: TestStatus;
    duration?: number;
    timestamp?: string;
  };
  status: TestStatus;
  duration?: number;
  timestamp?: string;
}

interface ToastProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const TestFilesPage = () => {
  // State management
  const [tests, setTests] = useState<TestFile[]>([]);
  const [filteredTests, setFilteredTests] = useState<TestFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [testLogs, setTestLogs] = useState<{ [key: string]: string[] }>({});
  const [categories, setCategories] = useState<string[]>([]);
  
  const isMounted = useRef<boolean>(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Toast notification function
  const showToast = useCallback(({ title, message, type }: ToastProps) => {
    // This is a placeholder. In a real app, you'd use a toast library or component
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }, []);
  
  // Update categories when tests change
  const updateCategories = useCallback((tests: TestFile[]) => {
    const uniqueCategories = Array.from(new Set(tests.map(test => test.category)));
    setCategories(uniqueCategories);
  }, []);
  
  // Process test data from API
  const processTestData = useCallback((data: any): TestFile[] => {
    return (data.tests || []).map((test: any) => ({
      ...test,
      status: test.lastRun?.status || 'pending',
      duration: test.lastRun?.duration,
      timestamp: test.lastRun?.timestamp
    }));
  }, []);
  
  // Load tests from API
  const loadTests = useCallback(async () => {
    if (!isMounted.current) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/tests', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Failed to fetch tests: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const processedTests = processTestData(data);
      
      if (isMounted.current) {
        setTests(processedTests);
        setFilteredTests(processedTests);
        updateCategories(processedTests);
        
        // Extract unique tags
        const allTags = processedTests.flatMap(test => test.tags || []);
        setAvailableTags(Array.from(new Set(allTags)));
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      if (isMounted.current) {
        setError(error instanceof Error ? error.message : 'Failed to load tests');
        showToast({
          title: 'Error',
          message: 'Failed to load tests. Please try again later.',
          type: 'error'
        });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
    
    return () => {
      isMounted.current = false;
      controller.abort();
    };
  }, [processTestData, showToast, updateCategories]);
  
  // Run a test
  const runTest = useCallback(async (testPath: string) => {
    try {
      setRunningTests(prev => [...prev, testPath]);
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [...(prev[testPath] || []), `Starting test: ${testPath}`]
      }));
      
      const response = await fetch(`/api/run-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testPath }),
      });
      
      if (!response.ok) {
        throw new Error(`Test failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update test status
      setTests(prev => 
        prev.map(test => 
          test.path === testPath 
            ? { 
                ...test, 
                status: result.success ? 'passed' : 'failed',
                duration: result.duration,
                timestamp: new Date().toISOString()
              } 
            : test
        )
      );
      
      // Update logs
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [
          ...(prev[testPath] || []),
          `Test ${result.success ? 'passed' : 'failed'} in ${result.duration}ms`,
          ...(result.logs || [])
        ]
      }));
      
      showToast({
        title: result.success ? 'Test Passed' : 'Test Failed',
        message: `${testPath.split('/').pop()} ${result.success ? 'passed' : 'failed'}`,
        type: result.success ? 'success' : 'error'
      });
      
    } catch (error) {
      console.error('Error running test:', error);
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [
          ...(prev[testPath] || []),
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        ]
      }));
      
      showToast({
        title: 'Error',
        message: 'Failed to run test. Please check the console for details.',
        type: 'error'
      });
    } finally {
      setRunningTests(prev => prev.filter(path => path !== testPath));
    }
  }, [showToast]);
  
  // Toggle test details
  const toggleTestDetails = useCallback((testPath: string) => {
    setExpandedTest(prev => prev === testPath ? null : testPath);
  }, []);
  
  // Handle tag click
  const handleTagClick = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  }, []);
  
  // Filter tests based on selected category, tags, and search query
  useEffect(() => {
    const filtered = tests.filter(test => {
      // Filter by category
      if (selectedCategory !== 'all' && test.category !== selectedCategory) {
        return false;
      }
      
      // Filter by tags
      if (selectedTags.length > 0 && !selectedTags.every(tag => test.tags.includes(tag))) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !test.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    setFilteredTests(filtered);
  }, [tests, selectedCategory, selectedTags, searchQuery]);
  
  // Load tests on component mount
  useEffect(() => {
    loadTests();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadTests]);
  
  // Handle URL parameters
  useEffect(() => {
    const category = searchParams.get('category');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    
    if (category) setSelectedCategory(category);
    if (tags) setSelectedTags(tags.split(','));
    if (search) setSearchQuery(search);
  }, [searchParams]);
  
  // Loading state
  if (loading && !tests.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button 
            onClick={() => {
              setError(null);
              loadTests();
            }}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Retry</span>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    );
  }
  
  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Files</h1>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Tests
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="w-full md:w-1/3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 5).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {availableTags.length > 5 && (
                  <Badge variant="outline" className="text-gray-500">
                    +{availableTags.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Test Files */}
          <div className="space-y-4">
            {filteredTests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No tests found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedTags([]);
                    setSearchQuery('');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredTests.map((test) => (
                <Card key={test.path} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-medium">{test.name}</CardTitle>
                        <div className="flex items-center mt-1 space-x-2 text-sm text-gray-500">
                          <span>{test.category}</span>
                          <span>•</span>
                          <span>{test.testCases.length} test cases</span>
                          {test.lastRun?.timestamp && (
                            <>
                              <span>•</span>
                              <span>Last run: {new Date(test.lastRun.timestamp).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            test.status === 'passed'
                              ? 'success'
                              : test.status === 'failed'
                              ? 'destructive'
                              : test.status === 'running'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {test.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTestDetails(test.path)}
                        >
                          {expandedTest === test.path ? 'Hide Details' : 'Show Details'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runTest(test.path)}
                          disabled={runningTests.includes(test.path)}
                        >
                          {runningTests.includes(test.path) ? (
                            <>
                              <LoadingSpinner className="mr-2 h-4 w-4" />
                              Running...
                            </>
                          ) : (
                            'Run Test'
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {test.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {test.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-gray-100"
                            onClick={() => handleTagClick(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  
                  {/* Expanded Test Details */}
                  {expandedTest === test.path && (
                    <CardContent className="p-0">
                      <div className="border-t border-gray-200">
                        <div className="bg-gray-50 px-6 py-3 border-b">
                          <h3 className="font-medium">Test Cases</h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {test.testCases.map((testCase, index) => (
                            <div key={`${testCase.name}-${index}`} className="px-6 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{testCase.name}</p>
                                  {testCase.group && (
                                    <p className="text-sm text-gray-500">Group: {testCase.group}</p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Line {testCase.line}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Test Logs */}
                      {testLogs[test.path] && testLogs[test.path].length > 0 && (
                        <div className="border-t border-gray-200">
                          <div className="bg-gray-50 px-6 py-3 border-b">
                            <h3 className="font-medium">Test Logs</h3>
                          </div>
                          <div className="bg-black text-green-400 p-4 font-mono text-sm overflow-x-auto">
                            <pre className="whitespace-pre-wrap">
                              {testLogs[test.path].join('\n')}
                            </pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
  // State management
  const [tests, setTests] = useState<TestFile[]>([]);
  const [filteredTests, setFilteredTests] = useState<TestFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [testLogs, setTestLogs] = useState<{ [key: string]: string[] }>({});
  const [categories, setCategories] = useState<string[]>([]);
  
  const isMounted = useRef<boolean>(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Toast notification function
  const showToast = useCallback(({ title, message, type }: ToastProps) => {
    // This is a placeholder. In a real app, you'd use a toast library or component
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }, []);
  
  // Update categories when tests change
  const updateCategories = useCallback((tests: TestFile[]) => {
    const uniqueCategories = Array.from(new Set(tests.map(test => test.category)));
    setCategories(uniqueCategories);
  }, []);
  
  // Process test data from API
  const processTestData = useCallback((data: any): TestFile[] => {
    return (data.tests || []).map((test: any) => ({
      ...test,
      status: test.lastRun?.status || 'pending',
      duration: test.lastRun?.duration,
      timestamp: test.lastRun?.timestamp
    }));
  }, []);
  
  // Load tests from API
  const loadTests = useCallback(async () => {
    if (!isMounted.current) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/tests', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Failed to fetch tests: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const processedTests = processTestData(data);
      
      if (isMounted.current) {
        setTests(processedTests);
        setFilteredTests(processedTests);
        updateCategories(processedTests);
        
        // Extract unique tags
        const allTags = processedTests.flatMap(test => test.tags || []);
        setAvailableTags(Array.from(new Set(allTags)));
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      if (isMounted.current) {
        setError(error instanceof Error ? error.message : 'Failed to load tests');
        showToast({
          title: 'Error',
          message: 'Failed to load tests. Please try again later.',
          type: 'error'
        });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
    
    return () => {
      isMounted.current = false;
      controller.abort();
    };
  }, [processTestData, showToast, updateCategories]);
  
  // Run a test
  const runTest = useCallback(async (testPath: string) => {
    try {
      setRunningTests(prev => [...prev, testPath]);
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [...(prev[testPath] || []), `Starting test: ${testPath}`]
      }));
      
      const response = await fetch(`/api/run-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testPath }),
      });
      
      if (!response.ok) {
        throw new Error(`Test failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update test status
      setTests(prev => 
        prev.map(test => 
          test.path === testPath 
            ? { 
                ...test, 
                status: result.success ? 'passed' : 'failed',
                duration: result.duration,
                timestamp: new Date().toISOString()
              } 
            : test
        )
      );
      
      // Update logs
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [
          ...(prev[testPath] || []),
          `Test ${result.success ? 'passed' : 'failed'} in ${result.duration}ms`,
          ...(result.logs || [])
        ]
      }));
      
      showToast({
        title: result.success ? 'Test Passed' : 'Test Failed',
        message: `${path.basename(testPath)} ${result.success ? 'passed' : 'failed'}`,
        type: result.success ? 'success' : 'error'
      });
    } catch (error) {
      console.error('Error running test:', error);
      showToast({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to run test',
        type: 'error'
      });
    } finally {
      setRunningTests(prev => prev.filter(path => path !== testPath));
    }
  }, [showToast]);
  
  // Toggle test details
  const toggleTestDetails = useCallback((testPath: string) => {
    setExpandedTest(prev => prev === testPath ? null : testPath);
  }, []);
  
  // Handle tag click
  const handleTagClick = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  }, []);
  
  // Filter tests based on search, category, and tags
  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.path.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category
      const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory;
      
      // Filter by tags
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => test.tags?.includes(tag));
      
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [tests, searchQuery, selectedCategory, selectedTags]);
  
  // Load initial data
  useEffect(() => {
    loadTests();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadTests]);
  
  // Handle URL parameters for filtering
  useEffect(() => {
    if (!searchParams) return;
    
    const category = searchParams.get('category');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    
    if (category) setSelectedCategory(category);
    if (tags) setSelectedTags(tags.split(','));
    if (search) setSearchQuery(search);
  }, [searchParams]);
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (searchQuery) params.set('search', searchQuery);
    
    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : window.location.pathname;
    
    // Update URL without causing a page reload
    window.history.pushState({}, '', url);
  }, [selectedCategory, selectedTags, searchQuery]);
  
  // Render loading state
  if (loading && tests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 text-lg font-medium mb-4">Error loading tests</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <Button onClick={loadTests} variant="outline">
          Retry
        </Button>
      </div>
    );
  }
// Remove duplicate interfaces

// Interface for test case
  name: string;
  group: string | null;
  line: number;
}

interface TestFile {
  name: string;
  path: string;
  category: string;
  tags: string[];
  testCases: TestCase[];
  lastRun?: {
    status: TestStatus;
    duration?: number;
    timestamp?: string;
  };
}

type TestStatus = 'passed' | 'failed' | 'running' | 'pending';

const extractTagsFromFile = (filePath: string): string[] => {
  const tags: string[] = [];
  const fileName = filePath.split('/').pop() || '';
  
  // Extract tags from filename (e.g., test.auth.spec.ts -> ['auth'])
  const matches = fileName.match(/\.([a-z0-9-]+)\./g);
  if (matches) {
    matches.forEach(match => {
      tags.push(match.replace(/\./g, ''));
    });
  }
  
  return tags;
};

export default function TestFilesPage() {
  const [tests, setTests] = useState<TestFile[]>([]);
  const [filteredTests, setFilteredTests] = useState<TestFile[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});
  const [testLogs, setTestLogs] = useState<Record<string, string[]>>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const processTestData = useCallback((data: any): TestFile[] => {
    const allTests = data.tests || [];
    return allTests.map((test: any) => {
      const testPath = test.path || '';
      const testName = test.name || path.basename(testPath, path.extname(testPath));
      const testCategory = test.category || 'other';
      const testType = test.type || 'other';
      
      const tags = [
        ...extractTagsFromFile(testPath), 
        testCategory.toLowerCase(),
        testType.toLowerCase()
      ];
      
      if (testCategory === 'performance' || testType === 'load' || testType === 'stress') {
        tags.push('performance');
        if (testType === 'load') tags.push('load-test');
        else if (testType === 'stress') tags.push('stress-test');
      }
      
      return {
        name: testName,
        path: testPath,
        category: testCategory,
        tags: Array.from(new Set(tags)),
        testCases: [{ name: testName, group: null, line: 1 }]
      };
    });
  }, []);

  const updateCategories = (testData: any) => {
    const uniqueCategories = [...new Set(testData.map((test: any) => test.category as string))];
    setCategories(uniqueCategories as string[]);
  };

  const loadTests = useCallback(async (forceReload: boolean = false) => {
    console.log('loadTests called. forceReload:', forceReload, 'loading:', loading);
    
    // If we're already loading and not forcing a reload, just return
    if (loading && !forceReload) {
      console.log('Skipping loadTests: already loading and not forced');
      return;
    }
    
    console.log('Starting to load tests...');
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timed out');
      controller.abort();
    }, 15000); // 15s timeout
    
    try {
      console.log('Fetching tests from API...');
      
      // Try health check but don't fail if it doesn't respond
      try {
        const healthResponse = await fetch('/api/health', { 
          signal: controller.signal,
        }).catch(() => null);
        
        if (healthResponse && !healthResponse.ok) {
          console.warn('Health check failed, but continuing with test load...');
        }
      } catch (healthError) {
        console.warn('Health check error, but continuing with test load:', healthError);
      }
      
      const response = await fetch('/api/tests', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Failed to fetch tests: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Tests loaded successfully:', data);
      
      setTests(data.tests || []);
      setFilteredTests(data.tests || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading tests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tests';
      setError(errorMessage);
      showToast({
        title: 'Error',
        message: 'Failed to load tests. Please check if the backend server is running.',
        type: 'error'
      });
      setLoading(false);
    }
    } finally {
      if (isMounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [loading, tests.length, retryCount, processTestData, showToast, updateCategories]);

  useEffect(() => {
    const allTags = tests.flatMap((test: Test) => test.tags || []);
    const uniqueTags = [...new Set(allTags)];
    setAvailableTags(uniqueTags);
  }, [tests]);

  const loadInitialData = useCallback(async () => {
    console.log('loadInitialData called. Tests length:', tests.length);
    if (tests.length === 0) {
      console.log('No tests found, calling loadTests...');
      try {
        await loadTests();
      } catch (error) {
        console.error('Error in loadInitialData:', error);
        setError('Failed to load tests. Please try again.');
        setLoading(false);
      }
    } else {
      console.log('Tests already loaded, skipping loadTests');
    }

    const category = searchParams?.get('category');
    const type = searchParams?.get('type');

    if (category && type) {
      let normalizedType = type.toLowerCase();
      
      if (normalizedType.includes('load')) {
        normalizedType = 'load';
      } else if (normalizedType.includes('stress')) {
        normalizedType = 'stress';
      } else {
        normalizedType = normalizedType.split(/\s+/)[0];
      }
      
      setSelectedCategory(category);
      const normalizedTypeForTags = normalizedType.toLowerCase().replace(/[ -]/g, '-');
      setSelectedTags([normalizedTypeForTags]);
      setSearchQuery(normalizedType);
    }
  }, [loadTests, searchParams, tests.length]);

  useEffect(() => {
    console.log('Component mounted or tests changed. Current tests length:', tests.length);
    
    loadInitialData();
    
    // Clean up function to prevent memory leaks
    return () => {
      // Any cleanup code if needed
    };
  }, [loadInitialData]);

  const filteredTests = tests.filter((test: Test) => {
    if (selectedCategory !== 'all' && test.category !== selectedCategory) {
      return false;
    }
    
    if (selectedTags.length > 0 && !selectedTags.some(tag => test.tags.includes(tag))) {
      return false;
    }
    
    if (searchQuery && !test.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const runTest = async (testPath: string) => {
    if (runningTests.includes(testPath)) return;
    
    setRunningTests((prev: string[]) => [...prev, testPath]);
    setTestLogs((prev: Record<string, string[]>) => ({
      ...prev,
      [testPath]: ['Starting test execution...']
    }));
      
    try {
      const response = await fetch('/api/tests/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testPath }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to run test: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      const resultLines: string[] = [
        `Test completed with status: ${result.status}`,
        `Tests: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`,
        '',
        result.reportUrl ? `View detailed report: ${result.reportUrl}` : 'No report URL available',
        '',
        ...(result.output || [])
      ];
      
      if (result.results?.length > 0) {
        resultLines.push('', 'Test Results:');
        result.results.forEach((test: any) => {
          resultLines.push(`- ${test.title}: ${test.status.toUpperCase()}${test.error ? ` (${test.error})` : ''}`);
        });
      }
      
      setTestLogs((prev: Record<string, string[]>) => ({
        ...prev,
        [testPath]: [
          ...(prev[testPath] || []),
          ...resultLines
        ]
      }));
      
      showToast({
        title: result.success ? 'Test Completed' : 'Test Failed',
        message: result.success ? `All ${result.passed} tests passed!` : `${result.failed} test(s) failed`,
        type: result.failed === 0 ? 'success' : 'error',
        duration: 5000
      });
      
      await loadTests();
      
    } catch (error) {
      const err = error as Error;
      console.error('Error running test:', err);
      
      setTestLogs((prev: Record<string, string[]>) => ({
        ...prev,
        [testPath]: [
          ...(prev[testPath] || []),
          `Error: ${err.message}`
        ]
      }));
      
      showToast({
        title: 'Error',
        message: 'Failed to run test',
        type: 'error'
      });
    } finally {
      setRunningTests((prev: string[]) => prev.filter(path => path !== testPath));
    }
  };

  const toggleTestDetails = (testPath: string) => {
    setExpandedTest((prev: string | null) => prev === testPath ? null : testPath);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  console.log('Rendering component. Loading:', loading, 'Tests count:', tests.length, 'Error:', error);
  
  if (loading && tests.length === 0) {
    console.log('Showing loading spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <div className="ml-4">Loading test files...</div>
      </div>
    );
  }

  if (error && tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error loading tests: </strong>
          <span className="block sm:inline">{error}</span>
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                loadTests(true);
              }}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Files</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tests..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedTags.map(tag => (
                <div 
                  key={tag}
                  className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                  <X className="ml-1 h-3 w-3" />
                </div>
              ))}
              <button 
                onClick={() => setSelectedTags([])}
                className="text-sm text-blue-500 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tests found matching your criteria</p>
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTags([]);
                  setSearchQuery('');
                }}
                className="mt-2 text-blue-500 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredTests.map(test => (
              <Card key={test.path} className="overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {test.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {test.tags.slice(0, 3).map(tag => (
                        <div 
                          key={tag}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200'
                              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => handleTagClick(tag)}
                        >
                          {tag}
                        </div>
                      ))}
                      {test.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{test.tags.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {test.lastRun && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        test.lastRun.status === 'passed' 
                          ? 'bg-green-100 text-green-800' 
                          : test.lastRun.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {test.lastRun.status}
                      </span>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTestDetails(test.path)}
                      className="text-gray-500"
                    >
                      {expandedTest === test.path ? 'Hide' : 'Show'} Details
                    </Button>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => runTest(test.path)}
                      disabled={runningTests.includes(test.path)}
                    >
                      {runningTests.includes(test.path) ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Running...
                        </>
                      ) : 'Run Test'}
                    </Button>
                  </div>
                </div>
                
                {expandedTest === test.path && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Test Cases:</h4>
                    <ul className="space-y-1">
                      {test.testCases.map((testCase, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {testCase.name}
                        </li>
                      ))}
                    </ul>
                    
                    {testLogs[test.path] && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Logs:</h4>
                        <div className="bg-black text-green-400 font-mono text-xs p-3 rounded-md overflow-auto max-h-40">
                          <pre className="whitespace-pre-wrap">
                            {testLogs[test.path].join('\n')}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default TestFilesPage;
