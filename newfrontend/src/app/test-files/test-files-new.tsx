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
import { X } from 'lucide-react';

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
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [testLogs, setTestLogs] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const updateCategories = (testData: any) => {
    const uniqueCategories = [...new Set(testData.map((test: any) => test.category as string))];
    setCategories(uniqueCategories as string[]);
  };

  const loadTests = useCallback(async (forceReload: boolean = false) => {
    if (loading && !forceReload) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
      
      console.log('Fetching tests from API...');
      
      const healthResponse = await fetch('/api/health', { signal: controller.signal });
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
        signal: controller.signal,
      });
      
      if (!isMounted) return;
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response received:', data);
      
      if (isMounted) {
        const transformedTests = processTestData(data);
        setTests(transformedTests);
        updateCategories(data);
        setError(null); // Clear any previous errors
      }
      
    } catch (err) {
      if (isMounted) {
        const error = err as Error;
        console.error('Error loading tests:', error);
        setError(`Failed to load tests: ${error.message}`);
        
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            if (isMounted) {
              setRetryCount(prev => prev + 1);
              loadTests(true);
            }
          }, delay);
        } else {
          showToast({
            title: 'Error',
            message: 'Failed to load tests. Please check if the backend server is running.',
            type: 'error'
          });
        }
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
