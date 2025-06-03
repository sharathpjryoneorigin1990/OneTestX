"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { 
  FiZap, FiFilter, FiChevronDown, FiChevronUp, 
  FiPlay, FiRefreshCw, FiCheckCircle, FiXCircle, 
  FiLoader, FiAlertTriangle, FiArrowUp, FiClock, 
  FiTag, FiSearch, FiCode
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Types and interfaces
interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

type TestStatus = 'passed' | 'failed' | 'running' | 'pending' | 'success' | 'error' | 'skipped';

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
  originalPath?: string;
}

interface ToastProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

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



const TestFilesPage = () => {
  // State management
  const [tests, setTests] = useState<TestFile[]>([]);
  const [filteredTests, setFilteredTests] = useState<TestFile[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Refs
  const isMounted = useRef(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Log component mount and search params
  useEffect(() => {
    console.log('TestFilesList component mounted');
    console.log('Current search params:', searchParams.toString());
    return () => {
      isMounted.current = false;
    };
  }, [searchParams]);

  // Toast notification function
  const showToast = useCallback(({ title, message, type }: ToastProps) => {
    // This is a placeholder. In a real app, you'd use a toast library or component
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }, []);

  // Process test data
  const processTestData = useCallback((data: any): TestFile[] => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((test: any) => {
      const id = test.id || Math.random().toString(36).substr(2, 9);
      const name = test.name || 'Unnamed Test';
      const path = test.path || '';
      const category = test.category || 'uncategorized';
      const type = test.type || 'unknown';
      const tags = Array.isArray(test.tags) ? test.tags : [];
      const testCases = Array.isArray(test.testCases) ? test.testCases : [];
      const status = (test.status || 'pending') as TestStatus;

      return {
        id,
        name,
        path,
        category,
        type,
        tags,
        testCases,
        status,
        duration: test.duration,
        timestamp: test.timestamp,
        originalPath: path
      };
    });
  }, []);

  // Load tests
  const loadTests = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      setLoading(true);
      const response = await fetch('/api/tests');
      if (!response.ok) throw new Error('Failed to fetch tests');

      const data = await response.json();
      const processedTests = processTestData(data);

      setTests(processedTests);
      setFilteredTests(processedTests);

      // Update categories and tags
      const categories = Array.from(new Set(processedTests.map(t => t.category)));
      setCategories(categories);

      const allTags = new Set<string>();
      processedTests.forEach(test => {
        test.tags?.forEach((tag: string) => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [isMounted, processTestData]);

  // Get status badge color
  const getStatusBadgeColor = useCallback((status: TestStatus) => {
    switch (status) {
      case 'passed':
      case 'success':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
      case 'error':
        return 'bg-red-500/20 text-red-400';
      case 'running':
        return 'bg-blue-500/20 text-blue-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'skipped':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-700/50 text-gray-400';
    }
  }, []);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Filter tests based on search query and filters
  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = test.name.toLowerCase().includes(query) ||
                         test.path.toLowerCase().includes(query);

      const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory;

      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.every(tag => test.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [tests, searchQuery, selectedCategory, selectedTags]);

  // Toggle test expansion
  const toggleTestExpansion = useCallback((testId: string) => {
    setExpandedTest(prev => prev === testId ? null : testId);
  }, []);

  // Handle test run
  const handleRunTest = useCallback(async (testId: string) => {
    try {
      setRunningTests(prev => [...prev, testId]);

      // Simulate API call to run test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update test status
      setTests(prev => 
        prev.map(test => 
          test.id === testId 
            ? { ...test, status: Math.random() > 0.5 ? 'passed' : 'failed' } 
            : test
        )
      );

    } catch (err) {
      console.error('Error running test:', err);
    } finally {
      setRunningTests(prev => prev.filter(id => id !== testId));
    }
  }, []);

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load tests on mount
  useEffect(() => {
    loadTests();

    return () => {
      isMounted.current = false;
    };
  }, [loadTests]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <NewNavbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-400">Loading test files...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-dark-900">
        <NewNavbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error loading test files</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <Button 
              onClick={() => loadTests()}
              variant="primary"
              className="w-full"
            >
              <FiRefreshCw className="mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
            <FiRefreshCw className="mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      <NewNavbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">Test Files</h1>
          <p className="text-gray-400">Manage and run your test files</p>
        </div>
        
        {/* Search and filter section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        
        {/* Test files list */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-200">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertTriangle className="w-5 h-5" />
                <h3 className="font-medium">Error loading tests</h3>
              </div>
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={loadTests}
                className="mt-3 text-sm font-medium text-red-200 hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No tests found. Try adjusting your search or filters.
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {filteredTests.map((test) => (
                <motion.div key={test.id} variants={item}>
                  <Card className="bg-dark-800 border-dark-700 hover:border-primary-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{test.name}</h3>
                          <p className="text-sm text-gray-400">{test.path}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadgeColor(test.status)}>
                            {test.status}
                          </Badge>
                          {test.duration && (
                            <div className="flex items-center text-sm text-gray-400">
                              <FiClock className="w-4 h-4 mr-1" />
                              {test.duration}ms
                            </div>
                          )}
                        </div>
                      </div>
                      {test.tags && test.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {test.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs text-gray-300 border-gray-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2">
                        <button
                          onClick={() => toggleTestExpansion(test.id)}
                          className="text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center"
                        >
                          {expandedTest === test.id ? (
                            <>
                              <FiChevronUp className="mr-1 w-4 h-4" />
                              Hide details
                            </>
                          ) : (
                            <>
                              <FiChevronDown className="mr-1 w-4 h-4" />
                              Show details
                            </>
                          )}
                        </button>
                        
                        <AnimatePresence>
                          {expandedTest === test.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 pt-2 border-t border-dark-700"
                            >
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm text-gray-400">Category:</span>{' '}
                                  <span className="text-sm">{test.category}</span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-400">Type:</span>{' '}
                                  <span className="text-sm">{test.type}</span>
                                </div>
                                {test.testCases.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-1">Test Cases:</h4>
                                    <ul className="space-y-1">
                                      {test.testCases.map((testCase, i) => (
                                        <li key={i} className="text-sm text-gray-400">
                                          • {testCase.name}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-dark-700 bg-dark-800/50">
                      <div className="flex justify-end w-full space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Handle run test
                          }}
                          disabled={runningTests.includes(test.id)}
                        >
                          {runningTests.includes(test.id) ? (
                            <>
                              <FiLoader className="animate-spin mr-2 w-4 h-4" />
                              Running...
                            </>
                          ) : (
                            <>
                              <FiPlay className="mr-2 w-4 h-4" />
                              Run Test
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Handle view details
                          }}
                        >
                          <FiCode className="mr-2 w-4 h-4" />
                          View Code
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
        
        {/* Scroll to top button */}
        <AnimatePresence>
          {showScrollToTop && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 p-3 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-lg"
              aria-label="Scroll to top"
            >
              <FiArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
        {/* Search */}
        <div className="mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search tests..."
                className="mt-4 w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>
        </div>
        {/* Category Filter */}
        <div className="mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              className={`flex items-center w-full px-4 py-2 bg-dark-700 border ${
                analysisStatus.status === 'success' ? 'border-green-500' : 'border-gray-600'
              } rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                analysisStatus.status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              value={selectedCategory}
              disabled={analysisStatus.status === 'loading'}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {['category1', 'category2', 'category3'].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Tags Filter */}
        {['tag1', 'tag2', 'tag3'].length > 0 && (
          <div className="mb-6">
            <Card className="bg-dark-800 border-dark-700 hover:border-primary-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-white">Tags</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {['tag1', 'tag2', 'tag3'].map((tag) => (
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
              </CardContent>
            </Card>
          </div>
        )}
        {/* Test Files */}
        <div className="grid grid-cols-1 gap-4">
          {filteredTests.map((test: TestFile) => (
            <Card key={test.path} className="bg-dark-800 border-dark-700 hover:border-primary-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-white">{test.name}</CardTitle>
                  <div className={`text-sm p-3 rounded-lg border ${
                    test.status === 'passed' || test.status === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : test.status === 'failed' || test.status === 'error'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : test.status === 'running'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  }`}>
                    <div className="flex items-center">
                      {test.status === 'passed' || test.status === 'success' ? (
                        <FiCheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      ) : test.status === 'failed' || test.status === 'error' ? (
                        <FiAlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                      ) : test.status === 'running' ? (
                        <FiRefreshCw className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                      ) : (
                        <FiInfo className="h-4 w-4 mr-2 flex-shrink-0" />
                      )}
                      <span>{test.status}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {test.tags.map((tag) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-4">
          {/* Scroll to Top Button */}
          <AnimatePresence>
            {true && (
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

// Export the component
export default TestFilesPage;
