"use client";

import { useEffect, useState } from 'react';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Clock, Activity, GitBranch, RefreshCw, BarChart2, Code, Zap, PieChart, BarChart3, LineChart } from 'lucide-react';
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
                Last updated: {new Date(metrics.lastRun).toLocaleString()}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
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
              <Card className="bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl">
                <CardHeader>
                  <CardTitle>Test Type Distribution</CardTitle>
                  <CardDescription>Breakdown of tests by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <PieChart className="h-16 w-16 opacity-30" />
                    <span className="ml-2">Test distribution chart coming soon</span>
                  </div>
                </CardContent>
              </Card>
            </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl h-full">
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

            {/* Quick Actions */}
            <Card className="bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex-col h-24 gap-2 bg-dark-800/50 hover:bg-blue-900/20 border-blue-900/30">
                  <Zap className="h-5 w-5 text-blue-400" />
                  <span>Run All Tests</span>
                </Button>
                <Button variant="outline" className="flex-col h-24 gap-2 bg-dark-800/50 hover:bg-purple-900/20 border-purple-900/30">
                  <GitBranch className="h-5 w-5 text-purple-400" />
                  <span>New Branch</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
