"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { 
  AlertCircle, 
  CheckCircle2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TestForm } from './components/TestForm';
import { IssueList } from './components/IssueList';

type ViewportType = 'desktop' | 'tablet' | 'mobile';

interface AccessibilityIssue {
  id: string;
  help: string;
  description: string;
  helpUrl?: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor';
  tags: string[];
  nodes: Array<{
    html: string;
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
    passes: AccessibilityIssue[];
    incomplete: AccessibilityIssue[];
    inapplicable: any[];
  };
}

type TabValue = 'summary' | 'violations' | 'passes' | 'incomplete' | 'inapplicable';

const getImpactBadge = (impact?: string) => {
  if (!impact) return null;
  
  switch (impact) {
    case 'critical':
      return <Badge variant="error">Critical</Badge>;
    case 'serious':
      return <Badge variant="warning">Serious</Badge>;
    case 'moderate':
      return <Badge variant="info">Moderate</Badge>;
    case 'minor':
      return <Badge variant="default">Minor</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

function AccessibilityTestPage() {
  // State for the form inputs
  const [url, setUrl] = useState('');
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('summary');
  
  // Mock data for development
  const mockTestResults: TestResult = {
    id: 'test-123',
    url: url || 'https://example.com',
    viewport: viewport,
    timestamp: new Date().toISOString(),
    issues: {
      violations: [
        {
          id: 'color-contrast',
          help: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
          description: 'This element has insufficient contrast at this conformance level.',
          impact: 'serious',
          tags: ['cat.color', 'wcag2aa', 'wcag143'],
          nodes: [
            {
              html: '<p class="text-gray-500">Low contrast text</p>',
              failureSummary: 'Fix any of the following:\\n  Element has insufficient color contrast of 3.96 (foreground color: #6b7280, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1'
            }
          ]
        }
      ],
      passes: [
        {
          id: 'html-has-lang',
          help: '<html> element must have a lang attribute',
          description: 'Ensures every HTML document has a lang attribute',
          impact: 'moderate',
          tags: ['cat.language', 'wcag2a', 'wcag311', 'ACT'],
          nodes: [
            {
              html: '<html lang="en">',
              failureSummary: ''
            }
          ]
        }
      ],
      incomplete: [],
      inapplicable: []
    }
  };

  const displayResults = testResults || mockTestResults;

  // Rest of the component code...
  const handleRunTest = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the accessibility test API
      const response = await fetch('/api/accessibility/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.startsWith('http') ? url : `https://${url}`,
          viewport,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run accessibility test');
      }

      // Ensure the response has the expected structure
      if (!data.issues || !data.issues.violations) {
        throw new Error('Invalid response from server');
      }

      setTestResults(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error running accessibility test:', err);
    } finally {
      setIsLoading(false);
    }
  }, [url, viewport]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Accessibility Testing</h1>
        <p className="text-muted-foreground">
          Test your website for accessibility issues using automated testing tools.
        </p>
      </div>
      
      <TestForm 
        url={url}
        setUrl={setUrl}
        viewport={viewport}
        setViewport={setViewport}
        isLoading={isLoading}
        onRunTest={handleRunTest}
      />
      
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {testResults && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Test Results</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(testResults.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <a 
                    href={testResults.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    Visit Tested URL <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs 
            defaultValue="summary" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as TabValue)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="violations">
                Violations ({testResults.issues.violations.length})
              </TabsTrigger>
              <TabsTrigger value="passes">
                Passes ({testResults.issues.passes.length})
              </TabsTrigger>
              <TabsTrigger value="incomplete">
                Incomplete ({testResults.issues.incomplete.length})
              </TabsTrigger>
              <TabsTrigger value="inapplicable">
                Inapplicable ({testResults.issues.inapplicable.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-500">
                      {testResults.issues.violations.length}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Violations</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-500">
                      {testResults.issues.passes.length}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Passes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-500">
                      {testResults.issues.incomplete.length}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Incomplete</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-500">
                      {testResults.issues.inapplicable.length}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Inapplicable</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="violations" className="pt-6">
              <IssueList issues={testResults.issues.violations} />
            </TabsContent>
            
            <TabsContent value="passes" className="pt-6">
              <IssueList issues={testResults.issues.passes} />
            </TabsContent>
            
            <TabsContent value="incomplete" className="pt-6">
              <IssueList issues={testResults.issues.incomplete} />
            </TabsContent>
            
            <TabsContent value="inapplicable" className="pt-6">
              <IssueList issues={testResults.issues.inapplicable} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

export default AccessibilityTestPage;
