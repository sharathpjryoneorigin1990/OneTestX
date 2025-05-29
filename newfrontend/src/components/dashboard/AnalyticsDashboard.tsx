"use client";

import * as React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  BarChart2, 
  PieChart, 
  Activity, 
  Zap, 
  Clock as ClockIcon, 
  AlertCircle, 
  AlertTriangle,
  TrendingUp, 
  RefreshCw,
  Code,
  GitBranch,
  TrendingDown,
  CircleDashed,
  AlertCircle as AlertCircleIcon,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  LineElement,
  PointElement,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { motion } from 'framer-motion';

// Theme configuration
const theme = {
  colors: {
    primary: '#8B5CF6',
    secondary: '#EC4899',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    dark: '#1F2937',
    light: '#F9FAFB',
    gradient: {
      primary: 'bg-gradient-to-r from-purple-500 to-pink-500',
      success: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      danger: 'bg-gradient-to-r from-rose-500 to-pink-500',
      warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
      info: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  }
};

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
);

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
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    } 
  }
};

interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  averageDuration: number;
  totalDuration: number;
  stability: number;
  flakyTests: number;
  codeCoverage: number;
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
}

interface TestTrendData {
  date: string;
  passed: number;
  failed: number;
  total: number;
}

interface AnalyticsDashboardProps {
  metrics: TestMetrics;
  trends: TestTrendData[];
  loading?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  metrics, 
  trends, 
  loading = false 
}) => {
  const [metricsState, setMetrics] = React.useState<TestMetrics>({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    averageDuration: 0,
    totalDuration: 0,
    stability: 0,
    flakyTests: 0,
    codeCoverage: 0,
    testTypes: {
      unit: 0,
      integration: 0,
      e2e: 0,
      performance: 0
    },
    topFailingTests: []
  });

  const [trendsState, setTrends] = React.useState<TestTrendData[]>([]);

  React.useEffect(() => {
    setMetrics({
      total: 124,
      passed: 108,
      failed: 9,
      pending: 7,
      averageDuration: 1.42,
      totalDuration: 176.1,
      stability: 92.5,
      flakyTests: 3,
      codeCoverage: 87.4,
      testTypes: {
        unit: 64,
        integration: 32,
        e2e: 22,
        performance: 6
      },
      topFailingTests: [
        { name: 'User Login Flow', path: 'tests/e2e/auth/login.spec.ts', failureRate: 15.2, lastRun: '2h ago' },
        { name: 'Checkout Process', path: 'tests/integration/checkout.test.js', failureRate: 8.7, lastRun: '4h ago' },
        { name: 'API Rate Limiting', path: 'tests/unit/api/rateLimit.test.ts', failureRate: 5.1, lastRun: '1h ago' },
      ]
    });

    setTrends([
      { date: '2023-05-22', passed: 98, failed: 5, total: 103 },
      { date: '2023-05-23', passed: 102, failed: 7, total: 109 },
      { date: '2023-05-24', passed: 105, failed: 6, total: 111 },
      { date: '2023-05-25', passed: 108, failed: 8, total: 116 },
      { date: '2023-05-26', passed: 112, failed: 4, total: 116 },
      { date: '2023-05-27', passed: 110, failed: 7, total: 117 },
      { date: '2023-05-28', passed: 108, failed: 9, total: 117 },
    ]);
  }, []);

  // Generate test type distribution data for pie chart
  const testTypeData = {
    labels: ['Passed', 'Failed', 'Pending'],
    datasets: [{
      data: [metricsState.passed, metricsState.failed, metricsState.pending],
      backgroundColor: [
        `${theme.colors.success}80`,
        `${theme.colors.danger}80`,
        `${theme.colors.warning}80`
      ],
      borderColor: [
        theme.colors.success,
        theme.colors.danger,
        theme.colors.warning
      ],
      borderWidth: 2,
      hoverOffset: 10,
      borderRadius: 8,
      spacing: 2,
      hoverBorderWidth: 3,
    }]
  };

  // Generate trend data for bar chart
  const trendData = {
    labels: trendsState.map(t => t.date),
    datasets: [
      {
        label: 'Passed',
        data: trendsState.map(t => t.passed),
        backgroundColor: `${theme.colors.success}40`,
        borderColor: theme.colors.success,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Failed',
        data: trendsState.map(t => t.failed),
        backgroundColor: `${theme.colors.danger}40`,
        borderColor: theme.colors.danger,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  // Generate performance trend data
  const performanceData = {
    labels: trendsState.map(t => t.date),
    datasets: [{
      label: 'Response Time (ms)',
      data: trendsState.map(() => Math.random() * 500 + 100), // Mock data
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}20`,
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: theme.colors.primary,
      pointBorderColor: '#fff',
      pointHoverRadius: 6,
      pointHoverBorderWidth: 2,
    }]
  };

  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E7EB',
          font: {
            family: 'Inter',
            size: 12,
          },
          padding: 16,
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#E5E7EB',
        borderColor: 'rgba(55, 65, 81, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        usePointStyle: true,
        cornerRadius: 8,
        boxPadding: 6,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(55, 65, 81, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: 'Inter',
          },
          padding: 8,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: 'Inter',
          },
        },
      },
    },
  };


  const chartOptions: ChartOptions<'bar'> = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Test Execution Trend',
        color: '#F9FAFB',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: 'Inter'
        },
        padding: { bottom: 16 }
      },
    },
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    ...commonOptions,
    cutout: '70%',
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Test Results',
        color: '#F9FAFB',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: 'Inter'
        },
        padding: { bottom: 16 }
      },
    },
  };

  const lineChartOptions: ChartOptions<'line'> = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Response Time Trend',
        color: '#F9FAFB',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: 'Inter'
        },
        padding: { bottom: 16 }
      },
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-20 animate-pulse"></div>
          <div className="relative flex items-center justify-center h-24 w-24">
            <div className="absolute h-20 w-20 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            <Activity className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <p className="text-indigo-200 font-medium">Loading analytics...</p>
      </div>
    );
  }

  // Calculate additional metrics
  const passRate = metrics.total > 0 ? Math.round((metrics.passed / metrics.total) * 100) : 0;
  const failRate = metrics.total > 0 ? Math.round((metrics.failed / metrics.total) * 100) : 0;
  const pendingRate = metrics.total > 0 ? Math.round((metrics.pending / metrics.total) * 100) : 0;
  const testStability = metrics.stability;
  const codeCoverage = metrics.codeCoverage;

  return (
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-200">Test Execution Dashboard</h2>
          <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            defaultValue="7"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={container} className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tests */}
        <motion.div variants={item}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 hover:border-indigo-500/50 transition-all h-full">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/10"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Tests</CardTitle>
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <BarChart2 className="h-4 w-4 text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white">{metrics.total}</div>
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex -space-x-1">
                  <div className="h-6 w-6 rounded-full bg-blue-500 border-2 border-gray-800 flex items-center justify-center">
                    <span className="text-xs font-bold">U</span>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-purple-500 border-2 border-gray-800 flex items-center justify-center -ml-1">
                    <span className="text-xs font-bold">I</span>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-pink-500 border-2 border-gray-800 flex items-center justify-center -ml-1">
                    <span className="text-xs font-bold">E</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {metrics.testTypes.unit}U • {metrics.testTypes.integration}I • {metrics.testTypes.e2e}E
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Test Health */}
        <motion.div variants={item}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 hover:border-emerald-500/50 transition-all h-full">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Test Health</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-emerald-400">{passRate}%</div>
                <div className="ml-2 text-sm text-emerald-300">
                  {metrics.passed} / {metrics.total}
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Success Rate</span>
                  <span>{testStability}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full" 
                    style={{ width: `${testStability}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Code Coverage */}
        <motion.div variants={item}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 hover:border-blue-500/50 transition-all h-full">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Code Coverage</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Code className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-400">{codeCoverage}%</div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Target: 80%</span>
                  <span>{codeCoverage >= 80 ? '✅ Achieved' : '⚠️ Needs work'}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${codeCoverage >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                    style={{ width: `${codeCoverage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Test Performance */}
        <motion.div variants={item}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 hover:border-amber-500/50 transition-all h-full">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Avg. Duration</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/20">
                <ClockIcon className="h-4 w-4 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-amber-400">{metrics.averageDuration.toFixed(2)}s</div>
              <div className="flex items-center text-sm text-gray-400 mt-1">
                {metrics.averageDuration < 2 ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1 text-emerald-400" />
                    <span>Optimal performance</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-400" />
                    <span>Consider optimization</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Total duration: {(metrics.totalDuration / 60).toFixed(1)} min
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div variants={container} className="grid gap-6 lg:grid-cols-3">
        {/* Test Execution Trend */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-200">Test Execution Trend</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div>
                  <span>Passed</span>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mr-1"></div>
                  <span>Failed</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              {trends.length > 0 ? (
                <Bar 
                  data={trendData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales?.y,
                        grid: {
                          ...chartOptions.scales?.y?.grid,
                          color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                          ...chartOptions.scales?.y?.ticks,
                          color: 'rgba(156, 163, 175, 0.8)'
                        }
                      },
                      x: {
                        ...chartOptions.scales?.x,
                        grid: {
                          ...chartOptions.scales?.x?.grid,
                          display: false
                        },
                        ticks: {
                          ...chartOptions.scales?.x?.ticks,
                          color: 'rgba(156, 163, 175, 0.8)'
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Activity className="h-8 w-8 mb-2" />
                  <p>No trend data available</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
        
        {/* Test Distribution */}
        <motion.div variants={item} className="h-full">
          <Card className="h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-200">Test Distribution</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">By Type</span>
              </div>
            </div>
            <div className="h-64 flex flex-col">
              {metrics.total > 0 ? (
                <div className="flex-1">
                  <Pie 
                    data={testTypeData} 
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins,
                        legend: {
                          ...pieChartOptions.plugins?.legend,
                          position: 'right',
                          labels: {
                            ...pieChartOptions.plugins?.legend?.labels,
                            color: 'rgba(156, 163, 175, 0.8)',
                            font: {
                              size: 11
                            },
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <PieChart className="h-8 w-8 mb-2" />
                  <p>No test data available</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {testTypeData.labels.map((label, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <div 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: testTypeData.datasets[0].backgroundColor[index] }}
                    />
                    <span className="text-gray-400">{label}</span>
                    <span className="ml-auto font-medium">
                      {testTypeData.datasets[0].data[index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div variants={container} className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trend */}
        <motion.div variants={item}>
          <Card className="h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-200">Performance Trend</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-xs text-emerald-400">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>12% faster</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <Line 
                data={performanceData} 
                options={{
                  ...lineChartOptions,
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    ...lineChartOptions.plugins,
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    ...lineChartOptions.scales,
                    y: {
                      ...lineChartOptions.scales?.y,
                      grid: {
                        ...lineChartOptions.scales?.y?.grid,
                        color: 'rgba(255, 255, 255, 0.05)'
                      },
                      ticks: {
                        ...lineChartOptions.scales?.y?.ticks,
                        color: 'rgba(156, 163, 175, 0.8)'
                      },
                      title: {
                        display: true,
                        text: 'Response Time (ms)',
                        color: 'rgba(156, 163, 175, 0.8)',
                        font: {
                          size: 12
                        }
                      }
                    },
                    x: {
                      ...lineChartOptions.scales?.x,
                      grid: {
                        ...lineChartOptions.scales?.x?.grid,
                        display: false
                      },
                      ticks: {
                        ...lineChartOptions.scales?.x?.ticks,
                        color: 'rgba(156, 163, 175, 0.8)'
                      }
                    }
                  }
                }} 
              />
            </div>
          </Card>
        </motion.div>

        {/* Test Coverage */}
        <motion.div variants={item}>
          <Card className="h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-200">Code Coverage</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-emerald-400">+3.2% from last week</span>
              </div>
            </div>
            <div className="h-64 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white">{codeCoverage}%</div>
                      <div className="text-sm text-gray-400 mt-1">Coverage</div>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${codeCoverage >= 80 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                          {codeCoverage >= 80 ? (
                            <span className="flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              Target Achieved
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Needs Improvement
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="rgba(255, 255, 255, 0.05)" 
                      strokeWidth="8"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke={codeCoverage >= 80 ? "#10B981" : "#F59E0B"} 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      strokeDasharray={`${(codeCoverage / 100) * 282.6} 282.6`}
                      transform="rotate(-90 50 50)"
                      className="transition-all duration-1000 ease-in-out"
                    />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {metrics.testTypes.unit}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Unit Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {metrics.testTypes.integration}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Integration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">
                    {metrics.testTypes.e2e}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">E2E Tests</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
