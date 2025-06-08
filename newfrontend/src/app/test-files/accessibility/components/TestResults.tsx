import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ViewportType = 'desktop' | 'tablet' | 'mobile';

interface AccessibilityIssue {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

interface TestResult {
  id: string;
  url: string;
  viewport: ViewportType;
  timestamp: string;
  issues: {
    violations: AccessibilityIssue[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  };
}

type TabValue = 'summary' | 'violations' | 'passes' | 'incomplete' | 'inapplicable';

interface TestResultsProps {
  testResults: TestResult | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunNewTest: () => void;
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut'
    }
  }),
  hover: {
    y: -5,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
  }
};

export function TestResults({
  testResults,
  activeTab,
  setActiveTab,
  onRunNewTest,
}: TestResultsProps) {
  if (!testResults) return null;

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical':
        return <Badge variant="error">Critical</Badge>;
      case 'serious':
        return <Badge variant="warning">Serious</Badge>;
      case 'moderate':
        return <Badge variant="default">Moderate</Badge>;
      case 'minor':
        return <Badge variant="info">Minor</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Test Results</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tested {testResults.url} on {testResults.viewport} • {formatDate(testResults.timestamp)}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRunNewTest}
        >
          Run New Test
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger 
            value="summary"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 rounded-md"
          >
            Summary
          </TabsTrigger>
          <TabsTrigger 
            value="violations"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 rounded-md"
          >
            <div className="flex items-center">
              <span>Violations</span>
              {testResults.issues.violations.length > 0 && (
                <Badge variant="error" className="ml-2">
                  {testResults.issues.violations.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="passes"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 rounded-md"
          >
            <div className="flex items-center">
              <span>Passes</span>
              <Badge variant="default" className="ml-2">
                {testResults.issues.passes.length}
              </Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="incomplete"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 rounded-md"
          >
            <div className="flex items-center">
              <span>Incomplete</span>
              <Badge variant="default" className="ml-2">
                {testResults.issues.incomplete.length}
              </Badge>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Summary content will be added here */}
          <p className="text-gray-600 dark:text-gray-300">
            Summary of accessibility test results will be displayed here.
          </p>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          {testResults.issues.violations.length > 0 ? (
            <AnimatePresence>
              {testResults.issues.violations.map((violation, i) => (
                <motion.div
                  key={violation.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4 border-b border-red-100 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
                          {violation.help}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getImpactBadge(violation.impact || '')}
                          <span className="text-sm text-red-600 dark:text-red-400">
                            {violation.nodes.length} instance{violation.nodes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <a
                        href={violation.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                      >
                        Learn more
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  {/* Add more details about the violation here */}
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
              <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-green-800 dark:text-green-200">
                No accessibility violations found!
              </h4>
              <p className="text-green-600 dark:text-green-300 mt-1">
                Great job! Your page meets all critical accessibility standards.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="passes">
          {/* Passes content will be added here */}
          <p className="text-gray-600 dark:text-gray-300">
            Passed accessibility checks will be displayed here.
          </p>
        </TabsContent>

        <TabsContent value="incomplete">
          {/* Incomplete content will be added here */}
          <p className="text-gray-600 dark:text-gray-300">
            Incomplete accessibility checks will be displayed here.
          </p>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
