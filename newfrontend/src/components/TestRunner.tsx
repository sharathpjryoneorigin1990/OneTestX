'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge, BadgeProps } from '@/components/ui/Badge';

export interface TestResult {
  success: boolean;
  testName: string;
  url: string;
  screenshot: string;
  video: string | null;
  logs: Array<{ type: string; text: string }>;
  timestamp: string;
  error?: string;
}

interface TestRunnerProps {
  testId: string;
  testName: string;
  description: string;
  onRunTest: () => void;
  isLoading?: boolean;
  result?: TestResult | null;
}

export function TestRunner({ testId, testName, description, onRunTest, isLoading, result }: TestRunnerProps) {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});

  const status = result 
    ? result.success 
      ? 'success' 
      : 'error'
    : 'idle';
    
  const statusText = {
    idle: 'Not Run',
    success: 'Passed',
    error: 'Failed',
  }[status];
  
  const statusColor = {
    idle: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  }[status];
  
  const badgeVariant: BadgeProps['variant'] = 
    status === 'success' ? 'success' : 
    status === 'error' ? 'error' : 
    'default';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{testName}</CardTitle>
          <Badge
            variant={badgeVariant}
            className={statusColor}
          >
            {statusText}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Button
            onClick={onRunTest}
            disabled={isLoading}
            className="w-32"
          >
            {isLoading ? 'Running...' : 'Run Test'}
          </Button>
          
          {result?.video && (
            <div className="text-sm">
              <a 
                href={result.video} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Recording
              </a>
            </div>
          )}
        </div>

        {result && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Test Results:</h4>
            <div className="bg-muted p-3 rounded-md">
              {!result.success && result.error && (
                <div className="text-destructive">
                  <p className="font-medium">Error:</p>
                  <pre className="whitespace-pre-wrap mt-1">{result.error}</pre>
                </div>
              )}
              
              {result.logs && result.logs.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Logs:</p>
                  <div className="bg-background p-2 rounded max-h-32 overflow-y-auto">
                    {result.logs.map((log, i) => (
                      <div 
                        key={i} 
                        className={`text-xs font-mono mb-1 ${
                          log.type === 'error' ? 'text-red-500' : 
                          log.type === 'warning' ? 'text-yellow-600' : ''
                        }`}
                      >
                        [{log.type}] {log.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.screenshot && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Screenshot:</p>
                  <img 
                    src={result.screenshot} 
                    alt="Test result screenshot"
                    className="max-w-full h-auto border rounded"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
