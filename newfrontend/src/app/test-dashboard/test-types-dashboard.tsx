'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  Search as SearchIcon, 
  X, 
  Play, 
  RefreshCw,
  Settings,
  History as HistoryIcon,
  ExternalLink,
  AlertTriangle,
  Zap,
  Cpu,
  Shield,
  ChevronDown,
  ChevronUp,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
// Import Card components with proper casing
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';

type TestStatus = 'passed' | 'failed' | 'running' | 'pending' | 'error';

interface TestType {
  id: string;
  name: string;
  description: string;
  category: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  lastRunTime: string;
  duration: string;
  status: TestStatus;
  tags: string[];
  testFiles: string[];
  lastRun?: {
    status: TestStatus;
    timestamp: string;
    duration: string;
    coverage: number;
  };
}

interface TestStats {
  totalTestTypes: number;
  totalTests: number;
  passed: number;
  failed: number;
  running: number;
  pending: number;
  coverage: number;
  lastUpdated: string;
}

const mockTestTypes: TestType[] = [
  {
    id: 'ui-tests',
    name: 'UI Tests',
    description: 'End-to-end and component tests for the user interface',
    category: 'UI',
    totalTests: 124,
    passed: 118,
    failed: 6,
    skipped: 0,
    coverage: 87,
    lastRunTime: new Date(Date.now() - 3600000).toISOString(),
    duration: '2m 34s',
    status: 'passed',
    tags: ['e2e', 'components', 'critical'],
    testFiles: ['homepage.spec.ts', 'login.spec.ts', 'dashboard.spec.ts'],
    lastRun: {
      status: 'passed',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      duration: '2m 34s',
      coverage: 87
    }
  },
  {
    id: 'api-tests',
    name: 'API Tests',
    description: 'Integration tests for the API endpoints',
    category: 'API',
    totalTests: 87,
    passed: 85,
    failed: 2,
    skipped: 0,
    coverage: 92,
    lastRunTime: new Date(Date.now() - 7200000).toISOString(),
    duration: '1m 45s',
    status: 'failed',
    tags: ['integration', 'critical'],
    testFiles: ['auth.test.js', 'users.test.js', 'products.test.js'],
    lastRun: {
      status: 'failed',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      duration: '1m 45s',
      coverage: 92
    }
  },
  {
    id: 'performance-tests',
    name: 'Performance Tests',
    description: 'Load and stress testing',
    category: 'Performance',
    totalTests: 12,
    passed: 10,
    failed: 2,
    skipped: 0,
    coverage: 65,
    lastRunTime: new Date(Date.now() - 86400000).toISOString(),
    duration: '5m 12s',
    status: 'passed',
    tags: ['load', 'stress'],
    testFiles: ['load-test.js', 'stress-test.js'],
    lastRun: {
      status: 'passed',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      duration: '5m 12s',
      coverage: 65
    }
  },
  {
    id: 'unit-tests',
    name: 'Unit Tests',
    description: 'Isolated unit tests for individual components and functions',
    category: 'Unit',
    totalTests: 342,
    passed: 340,
    failed: 2,
    skipped: 0,
    coverage: 94,
    lastRunTime: new Date(Date.now() - 1800000).toISOString(),
    duration: '45s',
    status: 'running',
    tags: ['components', 'utils'],
    testFiles: ['utils.test.js', 'components.test.jsx'],
    lastRun: {
      status: 'running',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      duration: '45s',
      coverage: 94
    }
  },
  {
    id: 'security-tests',
    name: 'Security Tests',
    description: 'Security vulnerability scanning and penetration tests',
    category: 'Security',
    totalTests: 28,
    passed: 27,
    failed: 1,
    skipped: 0,
    coverage: 82,
    lastRunTime: new Date(Date.now() - 172800000).toISOString(),
    duration: '3m 18s',
    status: 'pending',
    tags: ['security', 'owasp'],
    testFiles: ['xss.test.js', 'injection.test.js'],
    lastRun: {
      status: 'pending',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      duration: '3m 18s',
      coverage: 82
    }
  }
];

const TestTypesDashboard = () => {
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  
  // Stats for the dashboard
  const [stats, setStats] = useState<TestStats>({
    totalTestTypes: 0,
    totalTests: 0,
    passed: 0,
    failed: 0,
    running: 0,
    pending: 0,
    coverage: 0,
    lastUpdated: new Date().toISOString()
  });

  // Load test types
  useEffect(() => {
    const loadTestTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setTestTypes(mockTestTypes);
        updateStats(mockTestTypes);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load test types';
        setError(errorMessage);
        console.error('Error loading test types:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTestTypes();
  }, []);

  // Update statistics
  const updateStats = (types: TestType[]) => {
    const newStats: TestStats = {
      totalTestTypes: types.length,
      totalTests: 0,
      passed: 0,
      failed: 0,
      running: 0,
      pending: 0,
      coverage: 0,
      lastUpdated: new Date().toISOString()
    };

    let totalCoverage = 0;
    let coverageCount = 0;

    types.forEach(type => {
      newStats.totalTests += type.totalTests || 0;
      newStats.passed += type.passed || 0;
      newStats.failed += type.failed || 0;
      
      if (type.status === 'running') {
        newStats.running++;
      } else if (type.status === 'pending') {
        newStats.pending++;
      }
      
      if (type.coverage) {
        totalCoverage += type.coverage;
        coverageCount++;
      }
    });

    // Calculate average coverage
    if (coverageCount > 0) {
      newStats.coverage = Math.round(totalCoverage / coverageCount);
    }

    setStats(newStats);
  };

  // Handle running a test type
  const handleRunTest = async (testTypeId: string) => {
    try {
      setRunningTests(prev => [...prev, testTypeId]);
      
      // Simulate test run
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update test status
      setTestTypes(prev => 
        prev.map(test => {
          if (test.id === testTypeId) {
            const newStatus: TestStatus = Math.random() > 0.2 ? 'passed' : 'failed';
            return {
              ...test,
              status: newStatus,
              lastRun: {
                status: newStatus,
                timestamp: new Date().toISOString(),
                duration: `${(Math.random() * 2 + 1).toFixed(0)}m ${Math.floor(Math.random() * 60)}s`,
                coverage: Math.floor(70 + Math.random() * 30)
              },
              passed: newStatus === 'passed' ? test.totalTests - test.failed : test.passed,
              failed: newStatus === 'failed' ? test.failed + 1 : test.failed
            };
          }
          return test;
        })
      );
      
      // Reload stats after update
      setTestTypes(currentTypes => {
        updateStats(currentTypes);
        return currentTypes;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run test';
      console.error('Error running test:', err);
    } finally {
      setRunningTests(prev => prev.filter(id => id !== testTypeId));
    }
  };

  // Filter test types based on search and category
  const filteredTestTypes = mockTestTypes.filter(type => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by category
    const matchesCategory = !selectedCategory || type.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get all unique categories
  const categories = Array.from(new Set(mockTestTypes.map(type => type.category)));

  // Get status badge component
  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Passed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="error" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="default" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="default" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="error" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get icon for test type category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ui':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'api':
        return <Cpu className="h-4 w-4 text-green-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'performance':
        return <BarChart2 className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="test-types-dashboard w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-8">
        {/* Header with stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Types</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTestTypes}</div>
              <p className="text-xs text-muted-foreground">Total test categories</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTests}</div>
              <p className="text-xs text-muted-foreground">
                {stats.passed} passed, {stats.failed} failed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coverage}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${stats.coverage}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(stats.lastUpdated).toLocaleTimeString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(stats.lastUpdated).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            variant={!selectedCategory ? "primary" : "outline"} 
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryIcon(category)}
              <span className="ml-1">{category}</span>
            </Button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search test types..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <X 
              className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
      </div>
      
      {/* Test Types List */}
      <div className="space-y-6 pt-2">
        {filteredTestTypes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No test types found matching your criteria.
          </div>
        ) : (
          filteredTestTypes.map((testType) => (
            <Card key={testType.id} className="hover:shadow-md transition-shadow duration-200">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {getCategoryIcon(testType.category)}
                    </div>
                    <div>
                      <h3 className="font-medium">{testType.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{testType.totalTests} tests</span>
                        <span>•</span>
                        <span>{testType.coverage}% coverage</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(testType.status)}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleRunTest(testType.id)}
                      disabled={testType.status === 'running'}
                    >
                      {testType.status === 'running' ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TestTypesDashboard;
