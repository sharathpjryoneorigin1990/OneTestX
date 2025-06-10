"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TestForm } from './components/TestForm';
import { IssueList } from './components/IssueList';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ViewportType = 'desktop' | 'tablet' | 'mobile';

interface AccessibilityIssue {
  id: string;
  help: string;
  description: string;
  helpUrl?: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  tags?: string[];
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
    inapplicable: AccessibilityIssue[];
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

const AccessibilityTestPage: React.FC = () => {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('summary');

  // Mock data
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
              failureSummary: 'Fix any of the following:\n  Element has insufficient color contrast of 3.96 (foreground color: #6b7280, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1'
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

  const handleRunTest = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Accessibility Testing</h1>
        <a href="/test-files/screen-reader-test" className="flex items-center gap-2">
          <Button variant="outline">
            <ExternalLink className="w-4 h-4" />
            Screen Reader Tests
          </Button>
        </a>
      </div>
      
      <div className="mb-8">
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
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Test Results</h2>
                  <p className="text-sm text-muted-foreground">Last tested: {new Date(displayResults.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              <Tabs defaultValue="summary" value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="violations">Violations</TabsTrigger>
                  <TabsTrigger value="passes">Passes</TabsTrigger>
                  <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
                  <TabsTrigger value="inapplicable">Inapplicable</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Overview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium">Violations</h4>
                          <p className="text-2xl font-bold text-destructive">{displayResults.issues.violations.length}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Passes</h4>
                          <p className="text-2xl font-bold text-success">{displayResults.issues.passes.length}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Impact Distribution</h3>
                      <div className="flex gap-2">
                        {['critical', 'serious', 'moderate', 'minor'].map(impact => {
                          const count = displayResults.issues.violations.filter(v => v.impact === impact).length;
                          return (
                            <div key={impact} className="flex items-center gap-2">
                              {getImpactBadge(impact)}
                              <span className="text-sm">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="violations">
                  <IssueList issues={displayResults.issues.violations} />
                </TabsContent>
                
                <TabsContent value="passes">
                  <IssueList issues={displayResults.issues.passes} />
                </TabsContent>
                
                <TabsContent value="incomplete">
                  <IssueList issues={displayResults.issues.incomplete} />
                </TabsContent>
                
                <TabsContent value="inapplicable">
                  <IssueList issues={displayResults.issues.inapplicable} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccessibilityTestPage;
