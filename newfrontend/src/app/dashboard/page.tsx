"use client";

import { useEffect, useState } from 'react';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Clock, Activity, GitBranch, GitPullRequest, RefreshCw, BarChart2, Code, Zap, PieChart, BarChart3, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  duration: number;
  totalDuration: number;
  averageDuration: number;
  codeCoverage: number;
  lastRun: string;
  flakyTests: number;
  successRate: number;
  stability: number;
  avgResponseTime: number;
  testTypes: {
    unit: number;
    integration: number;
    e2e: number;
    performance: number;
  };
  topFailingTests: Array<{
    name: string;
    path: string;
    failureRate: number;
    lastRun: string;
  }>;
  trends: Array<{
    date: string;
    passed: number;
    failed: number;
    total: number;
  }>;
}

interface TestTrendData {
  date: string;
  passed: number;
  failed: number;
  total: number;
}

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10
    }
  },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Format date consistently for server and client
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Mock metrics data
  const [metrics, setMetrics] = useState<TestMetrics>({
    total: 124,
    passed: 108,
    failed: 9,
    skipped: 7,
    pending: 0,
    duration: 0,
    totalDuration: 0,
    averageDuration: 1.2,
    codeCoverage: 87.4,
    lastRun: new Date().toISOString(),
    flakyTests: 3,
    successRate: 92.3,
    stability: 94.5,
    avgResponseTime: 1.8,
    testTypes: {
      unit: 65,
      integration: 42,
      e2e: 12,
      performance: 5
    },
    topFailingTests: [
      {
        name: 'User authentication flow',
        path: 'src/tests/auth.test.ts',
        failureRate: 45.2,
        lastRun: '2023-06-15T14:32:10Z'
      },
      {
        name: 'Payment processing',
        path: 'src/tests/payment.test.ts',
        failureRate: 32.1,
        lastRun: '2023-06-14T09:15:22Z'
      },
      {
        name: 'Data export',
        path: 'src/tests/export.test.ts',
        failureRate: 18.7,
        lastRun: '2023-06-13T16:45:33Z'
      }
    ],
    trends: []
  });

  const [trends, setTrends] = useState<TestTrendData[]>([]);

  // Load debug script in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const script = document.createElement('script');
      script.src = 'http://localhost:8097';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Simulate API call with proper TestMetrics type
        const mockMetrics: TestMetrics = {
          total: 187,
          passed: 172,
          failed: 8,
          skipped: 7,
          pending: 0,
          duration: 234,
          totalDuration: 1200,
          averageDuration: 4.2,
          codeCoverage: 87.4,
          lastRun: new Date().toISOString(),
          flakyTests: 3,
          successRate: 92.0,
          stability: 95.0,
          avgResponseTime: 1.2,
          testTypes: {
            unit: 92,
            integration: 67,
            e2e: 28,
            performance: 0
          },
          topFailingTests: [
            { 
              name: 'Login Form Validation', 
              path: 'src/tests/login.spec.ts',
              failureRate: 0.75,
              lastRun: '2023-06-15T10:30:00Z'
            }
          ],
          trends: [
            { date: '2023-06-15', passed: 172, failed: 8, total: 180 }
          ]
        };
        const mockTrends = [
          { date: '2023-05-22', passed: 98, failed: 5, total: 103 },
          { date: '2023-05-23', passed: 102, failed: 7, total: 109 },
          { date: '2023-05-24', passed: 105, failed: 6, total: 111 },
          { date: '2023-05-25', passed: 108, failed: 8, total: 116 },
          { date: '2023-05-26', passed: 112, failed: 4, total: 116 },
          { date: '2023-05-27', passed: 110, failed: 7, total: 117 },
          { date: '2023-05-28', passed: 108, failed: 9, total: 117 },
        ];

        setMetrics(mockMetrics);
        setTrends(mockTrends);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setMetrics(prev => ({
        ...prev,
        lastRun: new Date().toISOString(),
        passed: Math.min(prev.passed + 1, prev.total),
        failed: Math.max(0, prev.failed - 1)
      }));
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-950 text-white">
      <NewNavbar />
      <AnimatePresence>
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8 space-y-6"
        >
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold">
                <motion.span 
                  initial={{ backgroundPosition: '0% 50%' }}
                  animate={{ backgroundPosition: '100% 50%' }}
                  transition={{ 
                    duration: 8, 
                    repeat: Infinity, 
                    repeatType: 'reverse',
                    ease: 'linear'
                  }}
                  className="bg-clip-text text-transparent bg-[length:200%] inline-block"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 25%, #8b5cf6 50%, #ec4899 75%, #f43f5e 100%)'
                  }}
                >
                  Test Dashboard
                </motion.span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Last updated: {formatDate(metrics.lastRun)}
              </p>
            </motion.div>
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                variant="outline" 
                size="sm" 
                className={`bg-blue-900/20 border-blue-800/50 hover:bg-blue-800/30 transition-all duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'opacity-100' : 'opacity-70'}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-purple-900/20 border-purple-800/50 hover:bg-purple-800/30 transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
              >
                <BarChart2 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Generate Report
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-green-900/20 border-green-800/50 hover:bg-green-800/30 transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => window.location.href = '/test-dashboard'}
              >
                <Activity className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Go to Test Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-indigo-900/20 border-indigo-800/50 hover:bg-indigo-800/30 transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => window.location.href = '/project-management'}
              >
                <PieChart className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Go to Project Management
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={<CheckCircle />}
              title="Passed Tests"
              value={metrics.passed}
              change="+12%"
              trend="up"
              color="green"
              loading={loading}
            />
            <StatCard 
              icon={<XCircle />}
              title="Failed Tests"
              value={metrics.failed}
              change="-3%"
              trend="down"
              color="red"
              loading={loading}
            />
            <StatCard 
              icon={<Clock />}
              title="Avg. Duration"
              value={`${metrics.averageDuration.toFixed(1)}s`}
              change="-0.8s"
              trend="down"
              color="yellow"
              loading={loading}
            />
            <StatCard 
              icon={<Code />}
              title="Code Coverage"
              value={`${metrics.codeCoverage}%`}
              change="+2.4%"
              trend="up"
              color="blue"
              loading={loading}
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Test Execution Overview */}
              <Card className="bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Test Execution Overview</CardTitle>
                      <CardDescription>Performance metrics and trends</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Last 7 days
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnalyticsDashboard 
                    metrics={metrics} 
                    trends={trends} 
                    loading={loading} 
                  />
                </CardContent>
              </Card>

              
              {/* Test Type Distribution */}
              <Card className="bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Test Type Distribution</CardTitle>
                  <CardDescription>Breakdown of tests by type</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(metrics.testTypes).map(([type, count]) => (
                      <div key={type} className="flex flex-col items-center p-4 rounded-lg bg-dark-700/50 hover:bg-dark-700/70 transition-colors">
                        <div className="text-2xl font-bold text-blue-400 mb-1">
                          {count}
                        </div>
                        <div className="text-xs font-medium text-gray-400 capitalize">
                          {type} Tests
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {Math.round((count / metrics.total) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-dark-600">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Total Tests</span>
                      <span className="font-medium text-white">{metrics.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Actions - Mobile View */}
              <div className="lg:hidden">
                <QuickActions />
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Actions - Desktop View */}
              <div className="hidden lg:block">
                <QuickActions />
              </div>
              
              {/* Recent Activity */}
              <Card className="bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest test executions and events</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <RecentActivity loading={loading} />
                </CardContent>
              </Card>

              {/* Team Activity */}
              <Card className="bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Team Activity</CardTitle>
                      <CardDescription>Active team members and their current tasks</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Team Member 1 */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-300 font-medium">
                        AJ
                      </div>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-dark-800"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">Alex Johnson</h4>
                        <span className="text-xs text-gray-400">5 min ago</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">Working on login flow tests</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-300">
                          <GitBranch className="h-3 w-3 mr-1" /> feature/login
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Team Member 2 */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300 font-medium">
                        TS
                      </div>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-dark-800"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">Taylor Smith</h4>
                        <span className="text-xs text-gray-400">15 min ago</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">Fixing payment gateway tests</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/30 text-purple-300">
                          <GitBranch className="h-3 w-3 mr-1" /> fix/payment-tests
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Team Member 3 */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-300 font-medium">
                        CK
                      </div>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-yellow-500 rounded-full border-2 border-dark-800"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">Casey Kim</h4>
                        <span className="text-xs text-gray-400">1 hour ago</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">Reviewing PR #42: Test coverage improvements</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900/30 text-amber-300">
                          <GitPullRequest className="h-3 w-3 mr-1" /> PR #42
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Team Member 4 */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-green-900/50 flex items-center justify-center text-green-300 font-medium">
                        JR
                      </div>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-gray-500 rounded-full border-2 border-dark-800"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">Jamie Rivera</h4>
                        <span className="text-xs text-gray-400">2 hours ago</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">Setting up new E2E test environment</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-300">
                          <GitBranch className="h-3 w-3 mr-1" /> feature/e2e-env
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
