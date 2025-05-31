"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFilter, FiX, FiPlay, FiPause, FiRefreshCw, 
  FiChevronDown, FiChevronUp, FiPlus, FiBarChart2, 
  FiClock, FiCheckCircle, FiXCircle, FiLoader, 
  FiInfo, FiAlertTriangle, FiZap, FiLayers, FiCode, 
  FiDownload, FiSearch, FiTag, FiGrid, FiList, FiSliders,
  FiArrowUp, FiArrowDown, FiPlusCircle
} from 'react-icons/fi';
import path from 'path';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

type TestStatus = 'passed' | 'failed' | 'running' | 'pending';

interface TestFile {
  id: string;
  name: string;
  path: string;
  category: string;
  type: string;
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
  console.log('TestFilesList component mounted');
  console.log('Current search params:', new URLSearchParams(window.location.search).toString());
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
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
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
  const processTestData = useCallback((response: any): TestFile[] => {
    // Handle the API response structure
    if (!response) {
      console.error('No response received');
      return [];
    }

    // Check if we have tests in the response
    if (!Array.isArray(response.tests)) {
      console.error('Invalid tests data in response:', response);
      return [];
    }

    console.log('Processing tests from API:', response.tests);
    
    return response.tests.map((test: any) => {
      // Extract category and type from path if available
      let category = test.category || 'other';
      let type = test.type || 'other';
      
      // Try to extract category and type from path
      if (test.path) {
        const pathParts = test.path.split(/[\\/]+/);
        
        // Look for 'ui' in the path to determine category
        const uiIndex = pathParts.indexOf('ui');
        if (uiIndex !== -1) {
          category = 'ui';
          
          // The next part after 'ui' might be the type (e2e, visual, etc.)
          if (pathParts.length > uiIndex + 1) {
            type = pathParts[uiIndex + 1];
          }
        }
      }
      
      // Generate a unique ID if not provided
      const id = test.id || `${category}-${type}-${test.name || 'test'}`.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      
      const processedTest: TestFile = {
        ...test,
        id,
        name: test.name || 'Unnamed Test',
        path: test.path || '',
        category,
        type,
        tags: Array.isArray(test.tags) ? test.tags : [],
        testCases: Array.isArray(test.testCases) ? test.testCases : [],
        status: test.lastRun?.status || 'pending',
        duration: test.lastRun?.duration,
        timestamp: test.lastRun?.timestamp,
        lastRun: test.lastRun || { status: 'pending' }
      };

      console.log('Processed test:', {
        id: processedTest.id,
        name: processedTest.name,
        originalPath: test.path,
        category: processedTest.category,
        type: processedTest.type,
        tags: processedTest.tags
      });
      
      return processedTest;
    });
  }, []);
  
  // Load tests from API
  const loadTests = useCallback(async () => {
    console.log('loadTests function called');
    console.log('isMounted:', isMounted.current);
    
    if (!isMounted.current) {
      console.log('loadTests: Component is not mounted, skipping');
      return;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('API request timed out after 10 seconds');
      controller.abort();
    }, 10000);
    
    try {
      setLoading(true);
      setError(null);
      
      // Get category and type from URL params
      const category = searchParams.get('category') || 'all';
      const type = searchParams.get('type') || '';
      
      console.log('Loading tests with params:', { category, type });
      
      // Build the API URL with query parameters
      const apiUrl = new URL('/api/tests', window.location.origin);
      if (category && category !== 'all') {
        apiUrl.searchParams.set('category', category);
      }
      if (type) {
        apiUrl.searchParams.set('type', type);
      }
      
      console.log('Constructed API URL:', apiUrl.toString());
      console.log('Using search params:', { category, type });
      
      console.log('Initiating fetch request...');
      const fetchStartTime = Date.now();
      
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
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
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      const processedTests = processTestData(responseData);
      console.log('Processed Tests:', processedTests);
      
      if (isMounted.current) {
        setTests(processedTests);
        setFilteredTests(processedTests);
        
        // Extract unique categories and tags
        const categories = Array.from(new Set(processedTests.map(t => t.category)));
        setCategories(categories);
        
        const allTags = Array.from(new Set(processedTests.flatMap(t => t.tags || [])));
        setAvailableTags(allTags);
        
        console.log('Available categories:', categories);
        console.log('Available tags:', allTags);
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
  }, [processTestData, showToast, updateCategories, searchParams]);
  
  // Load tests when component mounts or search params change
  useEffect(() => {
    console.log('useEffect triggered');
    console.log('Current search params:', new URLSearchParams(window.location.search).toString());
    
    const loadData = async () => {
      console.log('Calling loadTests...');
      try {
        await loadTests();
        console.log('loadTests completed successfully');
      } catch (error) {
        console.error('Error in loadTests:', error);
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      console.log('TestFilesList cleanup');
      isMounted.current = false;
    };
  }, [loadTests]);
  
  // Log when loadTests changes
  useEffect(() => {
    console.log('loadTests function changed');
  }, [loadTests]);
  
  // Run a test
  const runTest = useCallback(async (testPath: string) => {
    try {
      setRunningTests(prev => [...prev, testPath]);
      setTestLogs(prev => ({
        ...prev,
        [testPath]: [...(prev[testPath] || []), `Starting test: ${testPath}`]
      }));
      
      // Use the backend API endpoint for running tests
      const response = await fetch(`http://localhost:3005/api/tests/run`, {
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
  
  // Toggle test details with smooth scrolling
  const toggleTestDetails = (path: string) => {
    const wasExpanded = expandedTest === path;
    setExpandedTest(wasExpanded ? null : path);
    
    // Smooth scroll to the test card when expanding
    if (!wasExpanded) {
      setTimeout(() => {
        const element = document.getElementById(`test-${path}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Show scroll-to-top button when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    let filtered = [...tests];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(test => test.category === selectedCategory);
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(test => 
        selectedTags.every(tag => test.tags.includes(tag))
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(test => 
        test.name.toLowerCase().includes(query) ||
        test.path.toLowerCase().includes(query) ||
        test.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredTests(filtered);
  }, [tests, selectedCategory, selectedTags, searchQuery]);

  // Handle URL parameters and load tests when they change
  useEffect(() => {
    isMounted.current = true;
    
    const category = searchParams.get('category') || 'all';
    const type = searchParams.get('type') || '';
    
    console.log('URL Params changed:', { category, type });
    
    // Update local state
    setSelectedCategory(category);
    setSearchQuery(type);
    
    // Load tests with the latest params
    loadTests();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadTests, searchParams]);
  
  // Apply filters when tests or filter criteria change
  useEffect(() => {
    if (tests.length === 0) {
      console.log('No tests available to filter');
      return;
    }
    
    console.log('Applying filters with:', {
      testCount: tests.length,
      selectedCategory,
      selectedTags,
      searchQuery
    });
    
    let filtered = [...tests];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(test => {
        const matches = test.category === selectedCategory;
        if (!matches) {
          console.log(`Excluding test '${test.name}' - category '${test.category}' doesn't match '${selectedCategory}'`);
        }
        return matches;
      });
      console.log(`Category filter: ${beforeCount} -> ${filtered.length} tests`);
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(test => {
        const hasAllTags = selectedTags.every(tag => test.tags && test.tags.includes(tag));
        if (!hasAllTags) {
          console.log(`Excluding test '${test.name}' - missing required tags:`, selectedTags);
        }
        return hasAllTags;
      });
      console.log(`Tag filter: ${beforeCount} -> ${filtered.length} tests`);
    }
    
    // Filter by search query
    if (searchQuery) {
      const beforeCount = filtered.length;
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(test => {
        const matches = (
          test.name.toLowerCase().includes(query) ||
          test.path.toLowerCase().includes(query) ||
          (test.tags && test.tags.some(tag => tag && tag.toLowerCase().includes(query)))
        );
        if (!matches) {
          console.log(`Excluding test '${test.name}' - doesn't match search query '${query}'`);
        }
        return matches;
      });
      console.log(`Search filter: ${beforeCount} -> ${filtered.length} tests`);
    }
    
    console.log('Final filtered tests count:', filtered.length);
    setFilteredTests(filtered);
  }, [tests, selectedCategory, selectedTags, searchQuery]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    loadTests();
  }, [loadTests]);

  // Calculate test statistics
  const stats = useMemo(() => ({
    total: filteredTests.length,
    passed: filteredTests.filter(t => t.status === 'passed').length,
    failed: filteredTests.filter(t => t.status === 'failed').length,
    pending: filteredTests.filter(t => t.status === 'pending' || t.status === 'running').length,
    successRate: filteredTests.length > 0 
      ? Math.round((filteredTests.filter(t => t.status === 'passed').length / filteredTests.length) * 100) 
      : 0,
    avgDuration: filteredTests.length > 0 
      ? Math.round(filteredTests.reduce((acc, test) => acc + (test.duration || 0), 0) / filteredTests.length) 
      : 0
  }), [filteredTests]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Get status badge color
  const getStatusBadgeColor = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'info';
      case 'pending':
      default:
        return 'default';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-500" />
          <p className="text-gray-300">Loading test files...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900">
        <div className="max-w-md w-full p-6 bg-gray-800 rounded-xl border border-red-500/30">
          <div className="flex items-center mb-4">
            <FiAlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-xl font-bold text-red-400">Error Loading Tests</h2>
          </div>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            onClick={handleRetry}
            className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
          >
            <FiRefreshCw className="mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <NewNavbar />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed top-0 left-0 h-full w-72 bg-gray-800 z-40 shadow-2xl p-4 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              {/* Search */}
              <div className="mb-6">
                <label htmlFor="mobile-search" className="block text-sm font-medium text-gray-300 mb-2">
                  Search Tests
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="mobile-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, path, or tags..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="mb-6">
                <label htmlFor="mobile-category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="mobile-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiChevronDown className="text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <FiTag className="text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTags([]);
                  setSearchQuery('');
                }}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white"
              >
                Clear Filters
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Test Management
              </h1>
              <p className="text-gray-400 mt-2">
                Streamline your testing workflow with our comprehensive test management dashboard
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
              >
                <FiFilter className="mr-2" />
                Filters
              </Button>
              <Button 
                onClick={() => loadTests()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Tests</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                  <FiLayers className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Passed</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{stats.passed}</p>
                  {stats.total > 0 && (
                    <p className="text-sm text-green-400 mt-1">
                      {Math.round((stats.passed / stats.total) * 100)}% success rate
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
                  <FiCheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{stats.failed}</p>
                  {stats.total > 0 && (
                    <p className="text-sm text-red-400 mt-1">
                      {Math.round((stats.failed / stats.total) * 100)}% failure rate
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
                  <FiXCircle className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Avg. Duration</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.avgDuration}ms</p>
                  <p className="text-sm text-gray-400 mt-1">per test</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400">
                  <FiClock className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
        

        
        {/* Search and Filters */}
        <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Tests
                </div>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, path, or tags..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-48 px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                >
                  <option value="all" className="bg-gray-800 text-white">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category} className="bg-gray-800 text-white">
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          
          {availableTags.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-sm font-medium text-gray-700">Filter by Tags:</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Test Files List */}
        <div className="space-y-4 mb-16">
          {filteredTests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700/50"
            >
              <FiSearch className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-300">No test files found</h3>
              <p className="mt-1 text-gray-500 max-w-md mx-auto">
                Try adjusting your search or filter criteria to find what you're looking for.
              </p>
              <Button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTags([]);
                  setSearchQuery('');
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredTests.map((test) => (
                <motion.div
                  key={test.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                    <CardHeader className="px-6 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={getStatusBadgeColor(test.status) as any} 
                              className="flex-shrink-0"
                            >
                              {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                            </Badge>
                            <CardTitle className="text-lg font-medium text-white truncate">
                              {test.name}
                            </CardTitle>
                          </div>
                          <p className="text-sm text-gray-400 mt-1 truncate">{test.path}</p>
                          
                          {test.tags && test.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {test.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="info"
                                  size="sm"
                                  className="text-xs mr-1 mb-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                          {test.duration && (
                            <div className="flex items-center text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-md">
                              <FiClock className="mr-1.5 h-4 w-4" />
                              {test.duration}ms
                            </div>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTestDetails(test.path)}
                            className="text-gray-300 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500 hover:text-white"
                          >
                            {expandedTest === test.path ? (
                              <>
                                <FiChevronUp className="mr-1.5 h-4 w-4" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <FiChevronDown className="mr-1.5 h-4 w-4" />
                                Show Details
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant={runningTests.includes(test.path) ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => runTest(test.path)}
                            disabled={runningTests.includes(test.path)}
                            className={`${runningTests.includes(test.path) 
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' 
                              : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                          >
                            {runningTests.includes(test.path) ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Running...
                              </>
                            ) : (
                              <>
                                <FiPlay className="mr-1.5 h-4 w-4" />
                                Run Test
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {expandedTest === test.path && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CardContent className="p-0">
                            <div className="border-t border-gray-700/50">
                              <div className="px-6 py-4">
                                <h4 className="font-medium text-gray-300 mb-3 flex items-center">
                                  <FiList className="mr-2 h-4 w-4" />
                                  Test Cases
                                </h4>
                                <ul className="space-y-2">
                                  {test.testCases.length > 0 ? (
                                    test.testCases.map((testCase, index) => (
                                      <li key={index} className="text-sm text-gray-300 flex items-start">
                                        <span className="text-blue-400 mr-2">•</span>
                                        <div>
                                          <span className="text-white">{testCase.name}</span>
                                          {testCase.group && (
                                            <span className="text-gray-500 ml-2 text-xs bg-gray-700/50 px-2 py-0.5 rounded">
                                              {testCase.group}
                                            </span>
                                          )}
                                        </div>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-sm text-gray-500 italic">No test cases found</li>
                                  )}
                                </ul>
                              </div>
                              
                              {testLogs[test.path] && testLogs[test.path].length > 0 && (
                                <div className="border-t border-gray-700/50">
                                  <div className="px-6 py-3 bg-gray-800/50 flex items-center">
                                    <FiCode className="mr-2 h-4 w-4 text-gray-400" />
                                    <h4 className="text-sm font-medium text-gray-300">Test Logs</h4>
                                  </div>
                                  <div className="bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-x-auto max-h-60 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap">
                                      {testLogs[test.path].join('\n')}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-4">
          {/* Scroll to Top Button */}
          <AnimatePresence>
            {showScrollToTop && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Button 
                  onClick={scrollToTop}
                  className="rounded-full h-14 w-14 p-0 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white shadow-lg shadow-black/20 backdrop-blur-sm"
                  aria-label="Scroll to top"
                >
                  <FiArrowUp className="h-6 w-6" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Button 
              onClick={() => {
                // Scroll to top and clear filters
                scrollToTop();
                setSelectedCategory('all');
                setSelectedTags([]);
                setSearchQuery('');
              }}
              className="rounded-full h-14 w-14 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 backdrop-blur-sm"
              aria-label="Reset filters"
            >
              <FiZap className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default TestFilesPage;
