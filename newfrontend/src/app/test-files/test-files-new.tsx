"use client";

import React, { useState, useEffect, useCallback } from 'react';
import path from 'path';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/ToastContext';

interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

interface Test {
  name: string;
  path: string;
  category: string;
  tags: string[];
  testCases: TestCase[];
  lastRun?: {
    status: 'passed' | 'failed' | 'running' | 'pending';
    duration?: number;
    timestamp?: string;
  };
}

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
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [testLogs, setTestLogs] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const categories = [
    { id: 'all', name: 'All Tests', icon: '📋', count: 0 },
    { id: 'smoke', name: 'Smoke Tests', icon: '🔥', count: 0 },
    { id: 'e2e', name: 'E2E Tests', icon: '🔄', count: 0 },
    { id: 'visual', name: 'Visual Tests', icon: '👁️', count: 0 },
    { id: 'accessibility', name: 'Accessibility Tests', icon: '♿', count: 0 },
    { id: 'api', name: 'API Tests', icon: '🔌', count: 0 },
    { id: 'unit', name: 'Unit Tests', icon: '🧪', count: 0 },
    { id: 'integration', name: 'Integration Tests', icon: '🔗', count: 0 },
  ];

  // Process test data from API response
  const processTestData = useCallback((data: any): Test[] => {
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

  // Update categories with counts
  const updateCategories = useCallback((data: any) => {
    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        count: data.testsByCategory?.[category.id]?.length || 0
      }))
    );
  }, []);

  // Load tests with retry logic
  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching tests from API...');
      
      // First check if the backend is healthy
      const healthResponse = await fetch('/api/health');
      if (!healthResponse.ok) {
        throw new Error('Backend service is not available');
      }
      
      const response = await fetch('/api/tests', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response received:', data);
      
      const transformedTests = processTestData(data);
      setTests(transformedTests);
      updateCategories(data);
      setError(null); // Clear any previous errors
      
    } catch (err) {
      const error = err as Error;
      console.error('Error loading tests:', error);
      setError(`Failed to load tests: ${error.message}`);
      
      // Auto-retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadTests();
        }, delay);
      } else {
        showToast({
          title: 'Error',
          message: 'Failed to load tests. Please check if the backend server is running.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [processTestData, retryCount, showToast, updateCategories]);

  // Initial load and URL parameter handling
  useEffect(() => {
    const loadInitialData = async () => {
      if (tests.length === 0) {
        await loadTests();
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
    };

    loadInitialData();
  }, [loadTests, searchParams, tests.length]);

  // Filter tests based on selected category, tags, and search query
  const filteredTests = tests.filter(test => {
    // Filter by category
    if (selectedCategory !== 'all' && test.category !== selectedCategory) {
      return false;
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0 && !selectedTags.some(tag => test.tags.includes(tag))) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !test.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Run a specific test
  const runTest = async (testPath: string) => {
    try {
      setRunningTests(prev => [...prev, testPath]);
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [`Starting test: ${testPath}...`]
      }));
      
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testPath }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run test: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [
          ...(prev[testPath] || []),
          `Test completed with status: ${result.status}`,
          ...(result.output || [])
        ]
      }));
      
      showToast({
        title: 'Test Completed',
        message: `Test ${result.status === 'passed' ? 'passed' : 'failed'}`,
        type: result.status === 'passed' ? 'success' : 'error'
      });
      
      // Refresh the test list to show updated status
      await loadTests();
      
    } catch (error) {
      const err = error as Error;
      console.error('Error running test:', err);
      
      setTestLogs(prev => ({
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
      setRunningTests(prev => prev.filter(path => path !== testPath));
    }
  };

  // Toggle test details
  const toggleTestDetails = (testPath: string) => {
    setExpandedTest(prev => prev === testPath ? null : testPath);
  };

  // Handle tag selection
  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  if (loading && tests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
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
              onClick={loadTests}
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
          
          {/* Search and filter */}
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
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-md whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                  {category.count > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {category.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag} ×
                </Badge>
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
        
        {/* Test list */}
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
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className={`text-xs ${
                            selectedTags.includes(tag) 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                          onClick={() => handleTagClick(tag)}
                        >
                          {tag}
                        </Badge>
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
