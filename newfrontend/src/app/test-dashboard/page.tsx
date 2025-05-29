'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, XCircle, BarChart2, RefreshCw, Play, X, Plus, Search } from 'lucide-react';

// Components
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/Input';

// Types
type ToastType = 'default' | 'error' | 'success' | 'info' | 'warning';

type TestStatus = 'passed' | 'failed' | 'running' | 'pending' | 'skipped' | 'error';

interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

interface TestRun {
  status: TestStatus;
  duration: string;
  timestamp: string;
  output?: string[];
  error?: string;
  coverage?: number;
}

export interface TestFile {
  id: string;
  name: string;
  path: string;
  category: string;
  tags: string[];
  testCases: TestCase[];
  lastRun?: TestRun;
}

interface TestStats {
  totalTests: number;
  passed: number;
  failed: number;
  running: number;
  pending: number;
  coverage: number;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: 'default' | 'error' | 'success' | 'info' | 'warning';
  duration?: number;
}

// Helper functions
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const formatPath = (path: string): string => {
  return path.replace(/^\//, '').replace(/\//g, ' › ');
};

const extractTagsFromPath = (filePath: string): string[] => {
  if (!filePath) return [];
  
  const tags = new Set<string>();
  const pathParts = filePath.split('/');
  
  // Extract potential tags from path parts
  pathParts.forEach(part => {
    if (part.startsWith('@')) {
      tags.add(part);
    }
    
    // Extract words that might be tags
    const words = part.split(/[\s\-\._]+/);
    words.forEach(word => {
      if (word.startsWith('@')) {
        tags.add(word);
      }
    });
  });
  
  return Array.from(tags);
};

// Button and badge variant helpers
const getButtonVariant = (isActive: boolean): 'outline' | 'primary' | 'secondary' | 'ghost' | 'neon' => {
  return isActive ? 'primary' : 'outline';
};

const getBadgeVariant = (status: TestStatus | undefined): 'default' | 'error' | 'success' | 'warning' | 'info' => {
  switch (status) {
    case 'passed':
      return 'success';
    case 'failed':
    case 'error':
      return 'error';
    case 'running':
      return 'info';
    case 'pending':
    case 'skipped':
      return 'warning';
    default:
      return 'default';
  }
};

const TestDashboardPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for test files and UI
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [testLogs, setTestLogs] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Stats for the dashboard
  const [stats, setStats] = useState<TestStats>({
    totalTests: 0,
    passed: 0,
    failed: 0,
    running: 0,
    pending: 0,
    coverage: 0,
  });

  // Show toast notification
  const showToast = useCallback(({ title, message, type = 'default', duration = 5000 }: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  // Update test statistics
  const updateStats = useCallback((files: TestFile[] | undefined) => {
    // Ensure files is an array
    const filesArray = Array.isArray(files) ? files : [];
    
    const newStats: TestStats = {
      totalTests: filesArray.length,
      passed: 0,
      failed: 0,
      running: 0,
      pending: 0,
      coverage: 0
    };
    
    filesArray.forEach(file => {
      if (file?.lastRun) {
        switch (file.lastRun.status) {
          case 'passed':
            newStats.passed++;
            break;
          case 'failed':
          case 'error':
          case 'skipped':
            newStats.failed++;
            break;
          case 'running':
            newStats.running++;
            break;
          case 'pending':
            newStats.pending++;
            break;
        }
      } else {
        newStats.pending++;
      }
    });
    
    // Calculate coverage if available
    const filesWithCoverage = filesArray.filter(f => f?.lastRun?.coverage !== undefined);
    if (filesWithCoverage.length > 0) {
      const totalCoverage = filesWithCoverage.reduce((sum, file) => {
        return sum + (file.lastRun?.coverage || 0);
      }, 0);
      newStats.coverage = Math.round((totalCoverage / filesWithCoverage.length) * 100);
    }
    
    setStats(newStats);
  }, []);

  // Load test files from the API
  const loadTestFiles = useCallback(async (): Promise<TestFile[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tests');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to load test files';
        const errorDetails = errorData.details || '';
        
        // If no test files are found, return empty array instead of showing error
        if (response.status === 404) {
          console.warn('No test files found:', errorDetails);
          setTestFiles([]);
          updateStats([]);
          return [];
        }
        
        throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
      }
      
      const data = await response.json();
      // Handle both direct array response and object with tests property
      const testFiles = Array.isArray(data) ? data : (data.tests || []);
      setTestFiles(testFiles);
      updateStats(testFiles);
      return testFiles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      showToast({
        title: 'Error',
        message: `Failed to load test files: ${errorMessage}`,
        type: 'error'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToast, updateStats]);

  // Handle running a test
  const handleRunTest = useCallback(async (testId: string) => {
    try {
      setRunningTests(prev => [...prev, testId]);
      
      // Simulate test run
      await delay(2000);
      
      // Update test status
      setTestFiles(prev => 
        prev.map(test => {
          if (test.id === testId) {
            return {
              ...test,
              lastRun: {
                status: Math.random() > 0.5 ? 'passed' : 'failed',
                duration: `${(Math.random() * 2 + 1).toFixed(2)}s`,
                timestamp: new Date().toISOString(),
                coverage: Math.floor(Math.random() * 100)
              }
            };
          }
          return test;
        })
      );
      
      showToast({
        title: 'Test Complete',
        message: `Test ${testId} has completed`,
        type: 'success'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      showToast({
        title: 'Error',
        message: `Failed to run test: ${errorMessage}`,
        type: 'error'
      });
    } finally {
      setRunningTests(prev => prev.filter(id => id !== testId));
    }
  }, [showToast]);

  // Handle toggling test expansion
  const handleToggleExpand = useCallback((testId: string) => {
    setExpandedTest(prev => prev === testId ? null : testId);
  }, []);

  // Get all unique categories and tags for filtering
  const { categories, allTags } = useMemo(() => {
    const categoriesSet = new Set<string>();
    const allTagsSet = new Set<string>();
    
    // Ensure testFiles is an array before iterating
    const files = Array.isArray(testFiles) ? testFiles : [];
    
    files.forEach(file => {
      if (file?.category) {
        categoriesSet.add(file.category);
      }
      if (Array.isArray(file?.tags)) {
        file.tags.forEach(tag => tag && allTagsSet.add(tag));
      }
    });
    
    return {
      categories: Array.from(categoriesSet).sort(),
      allTags: Array.from(allTagsSet).sort()
    };
  }, [testFiles]);

  // Filter test files based on search and filters
  const filteredTestFiles = useMemo(() => {
    // Ensure testFiles is always treated as an array
    const files = Array.isArray(testFiles) ? testFiles : [];
    return files.filter(file => {
      if (!file) return false;
      
      // Filter by search query
      const matchesSearch = !searchQuery || 
        file.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category
      const matchesCategory = !selectedCategory || file.category === selectedCategory;
      
      // Filter by tag (single tag selection)
      const matchesTag = !selectedTag || 
        (Array.isArray(file.tags) && file.tags.includes(selectedTag));
      
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [testFiles, searchQuery, selectedCategory, selectedTag]);

  // Toggle tag selection
  const toggleTag = useCallback((tag: string) => {
    setSelectedTag(prevTag => prevTag === tag ? null : tag);
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedStatus(null);
  }, [setSearchQuery, setSelectedCategory, setSelectedTag, setSelectedStatus]);

  // Load test files on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await loadTestFiles();
    };
    
    loadInitialData();
  }, [loadTestFiles]);

  // Update stats when test files change
  useEffect(() => {
    updateStats(testFiles);
  }, [testFiles, updateStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-900 to-dark-950 text-white">
      <NewNavbar />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_300px,#2d2dff10,transparent)]"></div>
      </div>
      
      <main className="container mx-auto px-4 py-8 max-w-7xl relative">
        {/* Header with glass effect */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-sm bg-dark-800/70 border border-white/5 rounded-2xl p-6 mb-8 shadow-2xl shadow-blue-900/10"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Test Dashboard
              </h1>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-700 text-gray-200 hover:bg-gray-800/50 hover:border-gray-600 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]"
                onClick={() => loadTestFiles()}
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="neon" 
                size="sm"
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                onClick={() => window.location.href = 'http://localhost:3000/test-type'}
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add New Test
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
              </Button>
            </div>
          </div>
        </motion.div>
        {/* Stats Cards with staggered animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Tests', value: stats.totalTests, icon: <FileText className="h-5 w-5 text-blue-400" />, color: 'blue' },
            { title: 'Passed', value: stats.passed, icon: <CheckCircle2 className="h-5 w-5 text-green-400" />, color: 'green' },
            { title: 'Failed', value: stats.failed, icon: <XCircle className="h-5 w-5 text-red-400" />, color: 'red' },
            { title: 'Coverage', value: `${stats.coverage}%`, icon: <BarChart2 className="h-5 w-5 text-purple-400" />, color: 'purple' },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/30 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className={`text-3xl font-bold bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600`}
                      style={{ width: stat.title === 'Coverage' ? `${stats.coverage}%` : '100%' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Test List Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="backdrop-blur-sm bg-dark-800/50 border border-white/5 rounded-2xl shadow-xl overflow-hidden mb-8"
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="w-full">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Test Files
                </h2>
                <p className="text-sm text-gray-400 mt-1">Manage and monitor your test files</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-blue-900/30">
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-sm text-gray-400">
                  {loading ? (
                    <span>Loading...</span>
                  ) : filteredTestFiles.length === testFiles.length ? (
                    <span>Showing all {testFiles.length} tests</span>
                  ) : (
                    <span>Showing {filteredTestFiles.length} of {testFiles.length} tests</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Search and filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
              <div className="relative flex-1 max-w-md">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-dark-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    className="appearance-none bg-dark-700 text-sm border border-gray-700 text-white rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                
                <div className="relative">
                  <select
                    className="appearance-none bg-dark-700 text-sm border border-gray-700 text-white rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    value={selectedTag || ''}
                    onChange={(e) => setSelectedTag(e.target.value || null)}
                  >
                    <option value="">All Tags</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Test list */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search tests..."
                    className="pl-10 bg-dark-800 border-dark-700 text-white placeholder-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <div className="relative">
                  <select
                    className="appearance-none bg-dark-700 text-sm border border-dark-600 text-white rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    value={selectedStatus || ''}
                    onChange={(e) => setSelectedStatus(e.target.value || null)}
                  >
                    <option value="">All Status</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" className="text-blue-400" />
                <p className="mt-3 text-sm text-gray-400">Loading test files...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-900/20">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="mt-3 text-sm font-medium text-white">Error loading tests</h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadTestFiles()}
                    className="border-red-800 text-red-300 hover:bg-red-900/30 hover:border-red-700 hover:text-white"
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredTestFiles.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-dark-600 bg-dark-800/50 p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-blue-400/70" />
                <h3 className="mt-3 text-lg font-medium text-white">No test files found</h3>
                <p className="mt-2 max-w-md mx-auto text-sm text-gray-400">
                  {searchQuery || selectedCategory || selectedTag || selectedStatus
                    ? 'No matching test files found. Try adjusting your search or filters.'
                    : 'No test files available in the expected directory.'}
                </p>
                <div className="mt-6 space-y-4 text-left max-w-md mx-auto bg-dark-700/50 p-4 rounded-lg border border-dark-600">
                  <p className="text-sm text-gray-300">To get started:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
                    <li>Ensure your test files are in the <code className="px-1.5 py-0.5 bg-dark-800 text-blue-300 rounded text-xs">backend/tests</code> directory</li>
                    <li>Test files should have a <code className="px-1.5 py-0.5 bg-dark-800 text-blue-300 rounded text-xs">.test.js</code> or <code className="px-1.5 py-0.5 bg-dark-800 text-blue-300 rounded text-xs">.spec.js</code> extension</li>
                    <li>Refresh the page after adding test files</li>
                  </ol>
                </div>
                <div className="mt-6">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => loadTestFiles()}
                    className="border-blue-700/50 text-blue-300 hover:bg-blue-900/30 hover:border-blue-500/50 hover:text-white"
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-dark-700/50 px-4 py-2.5 text-sm text-gray-400 border border-dark-600">
                  Showing {filteredTestFiles.length} of {testFiles.length} test files
                </div>
                {filteredTestFiles.map(testFile => (
                  <div 
                    key={testFile.id} 
                    className="group overflow-hidden rounded-lg border border-dark-600 transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg"
                  >
                    <div 
                      className="flex cursor-pointer items-center justify-between p-4 transition-colors duration-200 hover:bg-dark-700/50"
                      onClick={() => handleToggleExpand(testFile.id)}
                    >
                      <div className="flex min-w-0 flex-1 items-center space-x-4">
                        <div className="flex-shrink-0">
                          {testFile.lastRun?.status === 'passed' ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-900/20">
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                            </div>
                          ) : testFile.lastRun?.status === 'failed' || testFile.lastRun?.status === 'error' ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-900/20">
                              <XCircle className="h-5 w-5 text-red-400" />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-600">
                              <FileText className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-medium text-white group-hover:text-blue-400">
                            {testFile.name}
                          </h3>
                          <div className="mt-1 flex items-center text-sm text-gray-400">
                            <span className="truncate">{formatPath(testFile.path)}</span>
                            {testFile.lastRun?.duration && (
                              <span className="mx-2 text-gray-500">•</span>
                            )}
                            {testFile.lastRun?.duration && (
                              <span className="whitespace-nowrap">{testFile.lastRun.duration}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-4">
                        <div className="flex -space-x-1">
                          {testFile.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-900/30 text-xs font-medium text-blue-300 ring-2 ring-dark-700"
                              title={tag}
                            >
                              {tag.charAt(0).toUpperCase()}
                            </span>
                          ))}
                          {testFile.tags.length > 3 && (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark-600 text-xs font-medium text-gray-400 ring-2 ring-dark-700">
                              +{testFile.tags.length - 3}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {testFile.lastRun?.status && (
                            <Badge 
                              variant={getBadgeVariant(testFile.lastRun.status)}
                              className="px-2.5 py-1 text-xs font-medium"
                            >
                              {testFile.lastRun.status}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap rounded-lg border border-dark-600 bg-dark-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-900/30 hover:border-blue-500/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunTest(testFile.id);
                            }}
                            disabled={runningTests.includes(testFile.id)}
                          >
                            {runningTests.includes(testFile.id) ? (
                              <>
                                <svg className="-ml-1 mr-2 h-3 w-3 animate-spin text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-blue-300">Running...</span>
                              </>
                            ) : (
                              <>
                                <Play className="-ml-1 mr-1.5 h-3.5 w-3.5" />
                                Run Test
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedTest === testFile.id && (
                      <div className="p-4 border-t border-dark-600 bg-dark-700/50">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-300 mb-2">Test Cases ({testFile.testCases.length})</h4>
                          <div className="space-y-2">
                            {testFile.testCases.map((testCase, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-dark-600/30 rounded border border-dark-500/30">
                                <div>
                                  <p className="text-sm font-medium text-gray-200">{testCase.name}</p>
                                  {testCase.group && (
                                    <p className="text-xs text-gray-400">Group: {testCase.group}</p>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">Line {testCase.line}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {testFile.lastRun && (
                          <div className="mt-4 pt-4 border-t border-dark-600">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-300">Last Run</h4>
                              <div className="text-sm text-gray-400">
                                {new Date(testFile.lastRun.timestamp).toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className="font-medium">
                                  <span className={`inline-flex items-center ${testFile.lastRun.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                                    {testFile.lastRun.status === 'passed' ? (
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-1" />
                                    )}
                                    {testFile.lastRun.status}
                                  </span>
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500">Duration</p>
                                <p className="font-medium">{testFile.lastRun.duration}</p>
                              </div>
                              
                              {testFile.lastRun.coverage !== undefined && (
                                <div>
                                  <p className="text-sm text-gray-500">Coverage</p>
                                  <p className="font-medium">{testFile.lastRun.coverage}%</p>
                                </div>
                              )}
                            </div>
                            
                            {testFile.lastRun.error && (
                              <div className="mt-4 p-3 bg-red-50 rounded">
                                <p className="text-sm font-medium text-red-700">Error:</p>
                                <pre className="mt-1 text-xs text-red-600 whitespace-pre-wrap">
                                  {testFile.lastRun.error}
                                </pre>
                              </div>
                            )}
                            
                            {testFile.lastRun.output && testFile.lastRun.output.length > 0 && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-1">Output</h5>
                                <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                    {testFile.lastRun.output.join('\n')}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      
      {/* Toast Notifications */}
      <AnimatePresence>
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`px-4 py-3 rounded-lg shadow-lg ${
                toast.type === 'error' 
                  ? 'bg-red-900/80 border border-red-500/30 text-red-100' 
                  : toast.type === 'success'
                  ? 'bg-green-900/80 border border-green-500/30 text-green-100'
                  : toast.type === 'warning'
                  ? 'bg-amber-900/80 border border-amber-500/30 text-amber-100'
                  : toast.type === 'info'
                  ? 'bg-blue-900/80 border border-blue-500/30 text-blue-100'
                  : 'bg-gray-800/80 border border-gray-500/30 text-gray-100'
              }`}
            >
              <div className="font-medium">{toast.title}</div>
              {toast.message && (
                <div className="text-sm opacity-90 mt-1">{toast.message}</div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </main>
  </div>
  );
};

export default TestDashboardPage;
