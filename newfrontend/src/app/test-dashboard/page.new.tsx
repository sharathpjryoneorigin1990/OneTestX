'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, XCircle, BarChart2, RefreshCw } from 'lucide-react';

// Components
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Types
interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

type TestStatus = 'passed' | 'failed' | 'running' | 'pending' | 'skipped' | 'error';

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

type ToastType = 'default' | 'error' | 'success';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: ToastType;
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // State for test files and UI
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [testLogs, setTestLogs] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  
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
  const updateStats = useCallback((files: TestFile[]) => {
    const newStats: TestStats = {
      totalTests: files.length,
      passed: 0,
      failed: 0,
      running: 0,
      pending: 0,
      coverage: 0
    };
    
    files.forEach(file => {
      if (file.lastRun) {
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
    const filesWithCoverage = files.filter(f => f.lastRun?.coverage !== undefined);
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
      const response = await fetch('/api/tests');
      
      if (!response.ok) {
        throw new Error('Failed to load test files');
      }
      
      const data = await response.json();
      setTestFiles(data);
      updateStats(data);
      return data;
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

  // Filter test files based on search and filters
  const filteredTestFiles = useMemo(() => {
    return testFiles.filter(file => {
      // Filter by search query
      const matchesSearch = !searchQuery || 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category
      const matchesCategory = !selectedCategory || file.category === selectedCategory;
      
      // Filter by tags
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => file.tags.includes(tag));
      
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [testFiles, searchQuery, selectedCategory, selectedTags]);

  // Get all unique categories and tags for filtering
  const { categories, allTags } = useMemo(() => {
    const categories = new Set<string>();
    const allTags = new Set<string>();
    
    testFiles.forEach(file => {
      categories.add(file.category);
      file.tags.forEach(tag => allTags.add(tag));
    });
    
    return {
      categories: Array.from(categories).sort(),
      allTags: Array.from(allTags).sort()
    };
  }, [testFiles]);

  // Toggle tag selection
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Dashboard</h1>
          <p className="text-gray-600">Manage and run your test suites</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTests}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
              <BarChart2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.coverage}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Test List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search tests..."
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                >
                  <option value="">All Categories</option>
                  {Array.from(categories).map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                
                <div className="flex flex-wrap gap-1">
                  {Array.from(allTags).slice(0, 3).map(tag => (
                    <button
                      key={tag}
                      className={`px-2 py-1 rounded-full text-xs mr-2 mb-2 transition-colors ${
                        selectedTags.includes(tag) 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200'}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                  {Array.from(allTags).length > 3 && (
                    <span className="text-xs text-gray-500 self-center">+{Array.from(allTags).length - 3} more</span>
                  )}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadTestFiles()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : filteredTestFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No test files found</div>
            ) : (
              <div className="space-y-4">
                {filteredTestFiles.map(testFile => (
                  <div key={testFile.id} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleToggleExpand(testFile.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {testFile.lastRun?.status === 'passed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : testFile.lastRun?.status === 'failed' || testFile.lastRun?.status === 'error' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{testFile.name}</h3>
                          <p className="text-sm text-gray-500">{formatPath(testFile.path)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex space-x-2">
                          {testFile.tags.slice(0, 2).map(tag => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {testFile.tags.length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{testFile.tags.length - 2}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {testFile.lastRun?.status && (
                            <Badge variant={getBadgeVariant(testFile.lastRun.status)}>
                              {testFile.lastRun.status}
                            </Badge>
                          )}
                          <button
                            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunTest(testFile.id);
                            }}
                            disabled={runningTests.includes(testFile.id)}
                          >
                            {runningTests.includes(testFile.id) ? 'Running...' : 'Run'}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedTest === testFile.id && (
                      <div className="p-4 border-t bg-white">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">Test Cases ({testFile.testCases.length})</h4>
                          <div className="space-y-2">
                            {testFile.testCases.map((testCase, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <p className="text-sm font-medium">{testCase.name}</p>
                                  {testCase.group && (
                                    <p className="text-xs text-gray-500">Group: {testCase.group}</p>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">Line {testCase.line}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {testFile.lastRun && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-700">Last Run</h4>
                              <div className="text-sm text-gray-500">
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
        </div>
      </main>
      
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'error' 
                ? 'bg-red-100 border-l-4 border-red-500' 
                : toast.type === 'success'
                ? 'bg-green-100 border-l-4 border-green-500'
                : 'bg-white border-l-4 border-blue-500'
            }`}
          >
            <div className="font-medium">{toast.title}</div>
            <div className="text-sm">{toast.message}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TestDashboardPage;
