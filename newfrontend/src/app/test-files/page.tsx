'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastContext';

export interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

export interface Test {
  name: string;
  path: string;
  category: string;
  tags: string[];
  testCases: TestCase[];
}

export interface TestFile {
  id: string;
  name: string;
  path: string;
  tags: string[];
  category?: string;
  testCases?: Array<{
    name: string;
    group: string | null;
    line: number;
  }>;
  lastRun?: {
    status: string;
    duration: string;
    timestamp: string;
    tests: {
      passed: number;
      failed: number;
      skipped: number;
    };
  };
  status?: string;
  duration?: string;
  timestamp?: string;
  tests?: {
    passed: number;
    failed: number;
    skipped: number;
  };
  passed?: number;
  failed?: number;
  skipped?: number;
}

const formatPath = (path: string) => {
  // Convert backslashes to forward slashes and split into parts
  const parts = path.replace(/\\/g, '/').split('/');
  
  // Get the category (e.g., 'api', 'ui', etc.)
  const category = parts[0];
  
  // Get the subcategory (e.g., 'auth', 'forms', etc.)
  const subcategory = parts[1];
  
  // Get the file name
  const fileName = parts[parts.length - 1];
  
  return `${category}/${subcategory}/${fileName}`;
};

const extractTagsFromFile = (filePath: string): string[] => {
  if (!filePath) return [];
  
  const tags = new Set<string>();
  const pathParts = filePath.toLowerCase().split(/[\\/]/);
  const fileName = pathParts[pathParts.length - 1].replace(/\.[^/.]+$/, '');
  const lowerFilePath = filePath.toLowerCase();
  
  // Add main category from path
  if (pathParts.length > 0) {
    const mainCategory = pathParts[0];
    tags.add(mainCategory);
    
    // Add subcategory if exists
    if (pathParts.length > 1) {
      const subcategory = pathParts[1];
      tags.add(subcategory);
      
      // Handle specific test categories
      if (mainCategory === 'e2e') {
        if (subcategory === 'auth') tags.add('authentication');
        else if (subcategory === 'checkout') tags.add('checkout-flow');
        else if (subcategory === 'profile') tags.add('user-profile');
        else if (subcategory === 'search') tags.add('search-functionality');
        else if (subcategory === 'cart') tags.add('shopping-cart');
        else if (subcategory === 'checkout') tags.add('checkout-process');
        else if (subcategory === 'layouts') tags.add('ui-layouts');
        else if (subcategory === 'forms') tags.add('ui-forms');
        
      } else if (mainCategory === 'smoke') {
        // Add smoke test types
        tags.add('smoke');
        tags.add('smoke-test');
        if (subcategory === 'basic') tags.add('basic-smoke');
        else if (subcategory === 'critical') tags.add('critical-path');
        else if (subcategory === 'quick') tags.add('quick-smoke');
        
      } else if (mainCategory === 'regression') {
        // Add regression test types
        tags.add('regression');
        if (subcategory === 'flows') tags.add('regression-flows');
        else if (subcategory === 'bugs') tags.add('bug-fixes');
        else if (subcategory === 'features') tags.add('feature-regression');
        
      } else if (mainCategory === 'performance') {
        // Add performance test types
        tags.add('performance');
        if (subcategory === 'load') {
          tags.add('load-test');
        } else if (subcategory === 'stress') {
          tags.add('stress-test');
        }
      }
    }
  }
  
  // Add tags based on filename patterns
  const testPatterns = [
    { patterns: ['e2e', 'end-to-end'], tag: 'e2e' },
    { patterns: ['smoke'], tag: 'smoke' },
    { patterns: ['regression'], tag: 'regression' },
    { patterns: ['visual'], tag: 'visual' },
    { patterns: ['accessibility', 'a11y'], tag: 'accessibility' },
    { patterns: ['unit', 'test-'], tag: 'unit' },
    { patterns: ['integration'], tag: 'integration' },
    { patterns: ['login', 'auth'], tag: 'auth' },
    { patterns: ['api'], tag: 'api' },
    { patterns: ['performance', 'perf'], tag: 'performance' },
    { patterns: ['security'], tag: 'security' },
    { patterns: ['load'], tag: 'load-test' },
    { patterns: ['stress'], tag: 'stress-test' }
  ];
  
  testPatterns.forEach(({ patterns, tag }) => {
    if (patterns.some(pattern => lowerFilePath.includes(pattern) || fileName.includes(pattern))) {
      tags.add(tag);
    }
  });
  
  return Array.from(tags);
};

// Client component that handles the test files page
export default function TestFilesPage() {
  // Use the useSearchParams hook to access URL parameters
  const searchParams = useSearchParams();
  const urlCategory = searchParams?.get('category') || undefined;
  const urlType = searchParams?.get('type') || undefined;
  const router = useRouter();
  const { showToast } = useToast();
  const [tests, setTests] = useState<TestFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  // Use Array instead of Set for running tests to avoid iteration issues
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [testLogs, setTestLogs] = useState<Record<string, string[]>>({});

  const loadTests = useCallback(async (category?: string, type?: string) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (type) params.append('type', type);
      
      // Use the full backend URL for API requests
      const baseUrl = 'http://localhost:3005';
      const url = `${baseUrl}/api/tests${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching tests from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tests');
      }
      
      // Transform the data to match the TestFile interface
      const transformedTests = data.tests.map((test: any) => {
        // Extract test name from path if not provided
        const testName = test.name || test.path.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || 'Unnamed Test';
        
        // Extract tags from the test path and any existing tags
        const pathTags = extractTagsFromFile(test.path);
        const uniqueTags = Array.from(new Set([
          ...(test.tags || []),
          ...pathTags,
          test.type,
          test.category
        ].filter(Boolean)));
        
        // Create a default test case if none exists
        const testCases = test.testCases?.length 
          ? test.testCases 
          : [{ name: testName, group: null, line: 1 }];
        
        return {
          id: test.id || `${test.category}-${test.type}-${testName}`.toLowerCase().replace(/\s+/g, '-'),
          name: testName,
          path: test.path,
          category: test.category,
          type: test.type,
          tags: uniqueTags,
          testCases: testCases,
          status: test.status || 'not run',
          duration: test.duration || '0s',
          timestamp: test.timestamp || new Date().toISOString(),
          passed: test.passed || 0,
          failed: test.failed || 0,
          skipped: test.skipped || 0
        };
      });
      
      setTests(transformedTests);
      
      // Extract unique categories and tags from all available tests (not just filtered ones)
      // We'll make a separate call to get all categories and tags for the filters
      const allTestsResponse = await fetch('http://localhost:3005/api/tests');
      const allTestsData = await allTestsResponse.json();
      
      if (allTestsResponse.ok) {
        const allCategories = new Set<string>();
        const allTags = new Set<string>();
        
        allTestsData.tests.forEach((test: any) => {
          if (test.category) {
            allCategories.add(test.category);
          }
          (test.tags || []).forEach((tag: string) => allTags.add(tag));
        });
        
        setCategories(Array.from(allCategories));
        setTags(Array.from(allTags));
      }
      
      // Update URL to reflect current filters
      const newParams = new URLSearchParams(window.location.search);
      
      // Only update the URL if the parameters have changed
      const currentCategory = newParams.get('category');
      const currentType = newParams.get('type');
      
      if (category !== currentCategory || type !== currentType) {
        // Update URL parameters
        if (category) {
          newParams.set('category', category);
        } else {
          newParams.delete('category');
        }
        
        if (type) {
          newParams.set('type', type);
        } else {
          newParams.delete('type');
        }
        
        // Only update the URL if we're on the client side
        if (typeof window !== 'undefined') {
          const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
          window.history.replaceState({}, '', newUrl);
        }
      }
      
    } catch (error) {
      console.error('Error loading tests:', error);
      showToast({
        title: 'Error',
        message: 'Failed to load tests. Please try again.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Handle URL search params changes
  useEffect(() => {
    const loadInitialData = async () => {
      // Load tests with URL parameters as filters
      await loadTests(urlCategory || undefined, urlType || undefined);
      
      // Update UI state based on URL parameters
      if (urlCategory) setSelectedCategory(urlCategory);
      if (urlType) {
        setSelectedTags([urlType]);
        setSearchQuery(urlType);
      }
    };

    loadInitialData();
  }, [loadTests, urlCategory, urlType]);

  const runTest = async (testPath: string) => {
    if (runningTests.includes(testPath)) return;
    
    setRunningTests(prev => [...prev, testPath]);
    setTestLogs(prev => ({
      ...prev,
      [testPath]: ['Starting test execution...']
    }));

    try {
      const response = await fetch(`/api/tests/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testPath }),
      });

      if (!response.ok) {
        throw new Error('Failed to run test');
      }

      const data = await response.json();
      
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [...(prev[testPath] || []), 'Test completed successfully']
      }));

      showToast({
        title: 'Success',
        message: 'Test executed successfully',
        type: 'success',
        duration: 3000
      });

      // Refresh test list after execution
      await loadTests();
      
    } catch (error) {
      console.error('Error running test:', error);
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [...(prev[testPath] || []), `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));

      showToast({
        title: 'Error',
        message: 'Failed to run test',
        type: 'error'
      });
    } finally {
      setRunningTests(prev => prev.filter(p => p !== testPath));
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Map of category names to their corresponding directory paths
  const categoryToDirectoryMap: Record<string, string> = {
    'Smoke Tests': 'smoke',
    'E2E Tests': 'e2e',
    'API Tests': 'api',
    'Visual Tests': 'visual',
    'Performance Tests': 'performance',
    'Unit Tests': 'unit',
    'Integration Tests': 'integration'
  };

  const filteredTests = tests.filter((test) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!test.name.toLowerCase().includes(query) && 
          !test.path.toLowerCase().includes(query) &&
          !test.tags.some((tag: string) => tag.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Filter by category if selected
    if (selectedCategory) {
      const categoryDir = categoryToDirectoryMap[selectedCategory];
      if (categoryDir) {
        // For known categories, check if the test path includes the category directory
        if (!test.path.toLowerCase().includes(categoryDir.toLowerCase())) {
          return false;
        }
      } else if (test.category && test.category !== selectedCategory) {
        // Fallback to exact category matching if not in our directory map
        return false;
      }
    }

    // Filter by tags if any selected
    if (selectedTags.length > 0) {
      const hasAllSelectedTags = selectedTags.every(selectedTag =>
        test.tags.some((testTag: string) => 
          testTag.toLowerCase() === selectedTag.toLowerCase()
        )
      );
      if (!hasAllSelectedTags) {
        return false;
      }
    }

    return true;
  });

  const renderTestList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (filteredTests.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No tests found. Create a new test to get started.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredTests.map((test) => (
          <div key={test.path} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-white">{test.name}</h3>
                <p className="text-sm text-gray-400">{formatPath(test.path)}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest(test.path)}
                  disabled={runningTests.includes(test.path)}
                >
                  {runningTests.includes(test.path) ? 'Running...' : 'Run Test'}
                </Button>
              </div>
            </div>
            
            {test.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {test.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {testLogs[test.path] && (
              <div className="mt-3 p-3 bg-gray-900 rounded text-sm font-mono text-gray-300 overflow-auto max-h-40">
                {testLogs[test.path].map((log: string, i: number) => (
                  <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <NewNavbar />
      <div className="max-w-7xl mx-auto pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-white gradient-text">Test Files</h1>
          <p className="text-gray-400 mb-8">Select and run your test files</p>
        </motion.div>

        {/* Search and filters */}
        <div className="mb-8 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search test files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
          </div>

          {/* Category filters */}
          {/* Only show category filters if not coming from test type selection */}
          {!urlType && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(category => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{category}</span>
                  <Badge variant="default" className="ml-2">
                    {category}
                  </Badge>
                </motion.button>
              ))}
            </div>
          )}

          {/* Tags */}
          {!urlType && (
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(tests.flatMap(test => test.tags))).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedTags.includes(tag) ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Test files list */}
        {renderTestList()}
      </div>
    </div>
  );
}


