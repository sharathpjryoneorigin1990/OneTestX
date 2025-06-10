import { useRef, useEffect, useState } from 'react';
import { TestResult } from '@/types/accessibility';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  ArrowUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface TestResultsProps {
  result: TestResult;
  onRerun?: () => void;
  className?: string;
}

// Skip link component for keyboard users
const SkipLink = ({ targetId, children }: { targetId: string; children: React.ReactNode }) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
  >
    {children}
  </a>
);

export function TestResults({ result, onRerun, className = '' }: TestResultsProps) {
  const [activeTab, setActiveTab] = useState<string>(
    result.results.violations.length > 0 ? 'violations' : 'details'
  );
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  const violationsCount = result.results.violations.length;
  const passesCount = result.results.passes.length;
  const incompleteCount = result.results.incomplete.length;
  const inapplicableCount = result.results.inapplicable.length;

  // Handle keyboard navigation for tabs
  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tabId);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const tabs = ['violations', 'passes', 'incomplete', 'details'];
      const currentIndex = tabs.indexOf(activeTab);
      let nextIndex;
      
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      }
      
      setActiveTab(tabs[nextIndex]);
      // Focus the new tab
      const tabElement = tabListRef.current?.querySelector(
        `[data-state="${tabs[nextIndex] === activeTab ? 'active' : 'inactive'}"]`
      ) as HTMLElement;
      tabElement?.focus();
    }
  };

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Set initial tab based on violations
  useEffect(() => {
    setActiveTab(violationsCount > 0 ? 'violations' : 'details');
  }, [violationsCount]);

  const getImpactBadge = (impact?: string) => {
    if (!impact) return null;
    
    const impactMap: Record<string, { label: string; variant: 'default' | 'error' | 'warning' | 'info' | 'success' }> = {
      critical: { label: 'Critical', variant: 'error' },
      serious: { label: 'Serious', variant: 'error' },
      moderate: { label: 'Moderate', variant: 'warning' },
      minor: { label: 'Minor', variant: 'info' },
    };

    const impactInfo = impactMap[impact.toLowerCase()];
    if (!impactInfo) return null;

    return (
      <Badge variant={impactInfo.variant} className="ml-2">
        {impactInfo.label}
      </Badge>
    );
  };

  return (
    <div className={`space-y-6 relative ${className}`} ref={mainContentRef}>
      {/* Skip to main content link for keyboard users */}
      <SkipLink targetId="main-content">
        Skip to test results
      </SkipLink>
      
      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className={cn(
          'fixed bottom-8 right-8 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          showBackToTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Accessibility Test Results</h2>
          <p className="text-muted-foreground">
            {result.timestamp ? new Date(result.timestamp).toLocaleString() : 'No timestamp available'}
          </p>
        </div>
        {onRerun && (
          <Button onClick={onRerun} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Rerun Tests
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={violationsCount > 0 ? 'border-red-200 dark:border-red-900/50' : ''}>
          <CardHeader className="p-4">
            <div className="flex items-center">
              <XCircle className={`h-5 w-5 mr-2 ${violationsCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
              <CardTitle className="text-lg">Violations</CardTitle>
            </div>
            <div className="text-2xl font-bold">{violationsCount}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              <CardTitle className="text-lg">Passes</CardTitle>
            </div>
            <div className="text-2xl font-bold">{passesCount}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-500 dark:text-yellow-400" />
              <CardTitle className="text-lg">Incomplete</CardTitle>
            </div>
            <div className="text-2xl font-bold">{incompleteCount}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
              <CardTitle className="text-lg">Inapplicable</CardTitle>
            </div>
            <div className="text-2xl font-bold">{inapplicableCount}</div>
          </CardHeader>
        </Card>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        defaultValue={violationsCount > 0 ? 'violations' : 'details'}
        className="w-full"
      >
        <div className="relative">
          <div ref={tabListRef}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger 
                value="violations"
                onKeyDown={(e) => handleKeyDown(e, 'violations')}
              >
                <span className="flex items-center">
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Violations
                  <Badge 
                    variant={violationsCount > 0 ? 'error' : 'default'} 
                    className="ml-2"
                    aria-hidden="true"
                  >
                    {violationsCount}
                  </Badge>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="passes"
                onKeyDown={(e) => handleKeyDown(e, 'passes')}
              >
                <span className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Passes
                  <Badge 
                    variant="default" 
                    className="ml-2"
                    aria-hidden="true"
                  >
                    {passesCount}
                  </Badge>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="incomplete"
                onKeyDown={(e) => handleKeyDown(e, 'incomplete')}
              >
                <span className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5" />
                  Incomplete
                  <Badge 
                    variant="default" 
                    className="ml-2"
                    aria-hidden="true"
                  >
                    {incompleteCount}
                  </Badge>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="details"
                onKeyDown={(e) => handleKeyDown(e, 'details')}
              >
                <span className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="mr-1.5"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" x2="8" y1="13" y2="13" />
                    <line x1="16" x2="8" y1="17" y2="17" />
                    <line x1="10" x2="8" y1="9" y2="9" />
                  </svg>
                  Details
                </span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="mt-4" id="main-content" tabIndex={-1}>
          <TabsContent value="violations">
            {violationsCount > 0 ? (
              <div className="space-y-4">
                {result.results.violations.map((violation, i) => (
                  <Card key={i} className="border-red-200 dark:border-red-900/50">
                    <CardHeader className="bg-red-50 dark:bg-red-900/10 p-4 border-b">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                        <CardTitle className="text-lg">
                          {violation.id}
                          {getImpactBadge(violation.impact)}
                        </CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        {violation.help}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm mb-4">{violation.description}</p>
                      
                      <div className="space-y-4">
                        {violation.nodes.slice(0, 3).map((node, j) => (
                          <div key={j} className="bg-muted/30 p-3 rounded-md">
                            <h4 className="font-medium mb-2">Element {j + 1}:</h4>
                            <div className="bg-background p-2 rounded text-sm font-mono mb-2 overflow-x-auto">
                              {node.html || 'No HTML available'}
                            </div>
                            {node.failureSummary && (
                              <div className="mt-2">
                                <h5 className="font-medium text-sm mb-1">How to fix:</h5>
                                <div 
                                  className="prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: node.failureSummary }} 
                                />
                              </div>
                            )}
                            {node.relatedNodes && node.relatedNodes.length > 0 && (
                              <div className="mt-3">
                                <h5 className="font-medium text-sm mb-1">Related elements:</h5>
                                <div className="space-y-2">
                                  {node.relatedNodes.map((relatedNode, k) => (
                                    <div key={k} className="bg-background p-2 rounded text-sm font-mono">
                                      {relatedNode.html || 'No HTML available'}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {violation.nodes.length > 3 && (
                          <div className="text-center text-sm text-muted-foreground mt-2">
                            + {violation.nodes.length - 3} more elements with this issue
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>No violations found</AlertTitle>
                <AlertDescription>
                  Great job! No accessibility violations were detected on this page.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="passes">
            {passesCount > 0 ? (
              <div className="space-y-4">
                {result.results.passes.map((pass, i) => (
                  <Card key={i}>
                    <CardHeader className="bg-green-50 dark:bg-green-900/10 p-4 border-b">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <CardTitle className="text-lg">{pass.id}</CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        {pass.help}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm mb-4">{pass.description}</p>
                      
                      {pass.nodes.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Passing elements:</h4>
                          {pass.nodes.slice(0, 3).map((node, j) => (
                            <div key={j} className="bg-muted/30 p-3 rounded-md">
                              <div className="bg-background p-2 rounded text-sm font-mono mb-2 overflow-x-auto">
                                {node.html || 'No HTML available'}
                              </div>
                            </div>
                          ))}
                          {pass.nodes.length > 3 && (
                            <div className="text-center text-sm text-muted-foreground mt-2">
                              + {pass.nodes.length - 3} more elements
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No passed checks</AlertTitle>
                <AlertDescription>
                  No accessibility checks passed on this page.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="incomplete">
            {incompleteCount > 0 ? (
              <div className="space-y-4">
                {result.results.incomplete.map((item, i) => (
                  <Card key={i} className="border-yellow-200 dark:border-yellow-900/50">
                    <CardHeader className="bg-yellow-50 dark:bg-yellow-900/10 p-4 border-b">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2" />
                        <CardTitle className="text-lg">
                          {item.id}
                          {getImpactBadge(item.impact)}
                        </CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        {item.help}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm mb-4">{item.description}</p>
                      
                      <div className="space-y-4">
                        <Alert variant="warning" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Manual review required</AlertTitle>
                          <AlertDescription>
                            This check could not be completed automatically and requires manual review.
                          </AlertDescription>
                        </Alert>

                        {item.nodes.slice(0, 3).map((node, j) => (
                          <div key={j} className="bg-muted/30 p-3 rounded-md">
                            <h4 className="font-medium mb-2">Element {j + 1}:</h4>
                            <div className="bg-background p-2 rounded text-sm font-mono mb-2 overflow-x-auto">
                              {node.html || 'No HTML available'}
                            </div>
                            {node.failureSummary && (
                              <div className="mt-2">
                                <h5 className="font-medium text-sm mb-1">Potential issue:</h5>
                                <div 
                                  className="prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: node.failureSummary }} 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        {item.nodes.length > 3 && (
                          <div className="text-center text-sm text-muted-foreground mt-2">
                            + {item.nodes.length - 3} more elements to review
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>No incomplete checks</AlertTitle>
                <AlertDescription>
                  All accessibility checks were completed automatically.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
                <CardDescription>
                  Additional information about this accessibility test run
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Test Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Test Engine:</span>
                        <span>{result.testEngine.name} v{result.testEngine.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Test Runner:</span>
                        <span>{result.testRunner?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Environment:</span>
                        <span className="text-right">
                          {result.testEnvironment.userAgent.split(' ')[0]}
                          <br />
                          {result.testEnvironment.windowWidth}×{result.testEnvironment.windowHeight}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">URL:</span>
                        <span className="truncate max-w-[200px]" title={result.url}>
                          {result.url}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Elements:</span>
                        <span>{result.results.violations.reduce((sum, v) => sum + v.nodes.length, 0) + 
                               result.results.passes.reduce((sum, p) => sum + p.nodes.length, 0) + 
                               result.results.incomplete.reduce((sum, i) => sum + i.nodes.length, 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Rules:</span>
                        <span>{result.results.violations.length + 
                               result.results.passes.length + 
                               result.results.incomplete.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timestamp:</span>
                        <span>{result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tool Options:</span>
                        <span>{result.toolOptions ? JSON.stringify(result.toolOptions) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Test Summary</h4>
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded bg-red-50 dark:bg-red-900/20">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {violationsCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Violations</div>
                      </div>
                      <div className="text-center p-4 rounded bg-green-50 dark:bg-green-900/20">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {passesCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Passes</div>
                      </div>
                      <div className="text-center p-4 rounded bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">
                          {incompleteCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Incomplete</div>
                      </div>
                    </div>
                  </div>
                </div>

                {result.results.inapplicable.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Inapplicable Rules</h4>
                    <div className="space-y-2">
                      {result.results.inapplicable.map((item, i) => (
                        <div key={i} className="bg-muted/30 p-3 rounded-md">
                          <div className="font-medium">{item.id}</div>
                          <p className="text-sm text-muted-foreground">{item.help}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Raw Results</h4>
                  <div className="bg-muted/30 p-4 rounded-md overflow-x-auto">
                    <pre className="text-xs">
                      <code>
                        {JSON.stringify(result, null, 2)}
                      </code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
