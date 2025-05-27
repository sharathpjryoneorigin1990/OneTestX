'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Terminal, Play, Loader2 } from 'lucide-react';

type Test = {
  id: string;
  name: string;
  path: string;
  type: 'smoke' | 'load' | 'stress' | 'soak' | 'other';
  description?: string;
};

type TestResult = {
  success: boolean;
  output: string[];
  exitCode: number | null;
  testId: string;
  timestamp: string;
};

const TestCard = ({ 
  test, 
  isRunning, 
  onRun, 
  result 
}: { 
  test: Test; 
  isRunning: boolean; 
  onRun: (id: string) => void;
  result?: TestResult;
}) => (
  <Card className="relative overflow-hidden">
    <div className="absolute top-2 right-2">
      <Badge variant={
        test.type === 'smoke' ? 'default' : 
        test.type === 'load' ? 'success' :
        test.type === 'stress' ? 'warning' : 'info'
      }>
        {test.type}
      </Badge>
    </div>
    <CardHeader>
      <CardTitle className="text-lg">{test.name}</CardTitle>
      <p className="text-sm text-muted-foreground">
        {test.path}
      </p>
    </CardHeader>
    <CardContent>
      <Button 
        onClick={() => onRun(test.id)}
        disabled={isRunning}
        className="w-full"
        variant={isRunning ? 'secondary' : 'default'}
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Test
          </>
        )}
      </Button>
    </CardContent>
    {result && (
      <div className="px-6 pb-4">
        <div className={`text-sm p-2 rounded ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex justify-between">
            <span>Status: {result.success ? '✅ Passed' : '❌ Failed'}</span>
            <span className="text-xs opacity-75">{result.timestamp}</span>
          </div>
          {result.output.length > 0 && (
            <ScrollArea className="h-32 mt-2 bg-white/50 rounded p-2 text-xs font-mono">
              {result.output.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">{line}</div>
              ))}
            </ScrollArea>
          )}
        </div>
      </div>
    )}
  </Card>
);

export default function PerformanceDashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState(false);

  // Fetch available tests
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('http://localhost:3005/api/performance/tests');
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch tests: ${error}`);
        }
        const data = await response.json();
        console.log('Fetched tests:', data.tests);
        setTests(data.tests || []);
      } catch (error) {
        console.error('Error fetching tests:', error);
        setTests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  const runTest = async (testId: string) => {
    if (isRunning) return;
    
    setIsRunning(true);
    setActiveTest(testId);
    
    try {
      const response = await fetch('http://localhost:3005/api/performance/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testId }),
      });
      
      if (!response.ok) throw new Error('Test execution failed');
      
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          ...result,
          timestamp: new Date().toLocaleString(),
        },
      }));
      
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Performance Testing</h1>
        <p className="text-muted-foreground">Run and monitor performance tests for your application</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="smoke">Smoke Tests</TabsTrigger>
          <TabsTrigger value="load">Load Tests</TabsTrigger>
          <TabsTrigger value="stress">Stress Tests</TabsTrigger>
          <TabsTrigger value="soak">Soak Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <TestCard 
                key={test.id} 
                test={test} 
                isRunning={isRunning && activeTest === test.id}
                onRun={runTest}
                result={testResults[test.id]}
              />
            ))}
          </div>
        </TabsContent>
        
        {['smoke', 'load', 'stress', 'soak'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests
                .filter(test => test.type === type)
                .map((test) => (
                  <TestCard 
                    key={test.id} 
                    test={test} 
                    isRunning={isRunning && activeTest === test.id}
                    onRun={runTest}
                    result={testResults[test.id]}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
