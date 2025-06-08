import { TestResult } from '@/types/accessibility';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TestResultsProps {
  result: TestResult;
  onRerun?: () => void;
  className?: string;
}

export function TestResults({ result, onRerun, className = '' }: TestResultsProps) {
  const violationsCount = result.results.violations.length;
  const passesCount = result.results.passes.length;
  const incompleteCount = result.results.incomplete.length;
  const inapplicableCount = result.results.inapplicable.length;

  const getImpactBadge = (impact?: string) => {
    if (!impact) return null;
    
    const impactMap: Record<string, { label: string; variant: 'default' | 'error' | 'warning' | 'info' | 'success' }> = {
      critical: { label: 'Critical', variant: 'error' },
      serious: { label: 'Serious', variant: 'error' },
      moderate: { label: 'Moderate', variant: 'warning' },
      minor: { label: 'Minor', variant: 'info' },
    };

    const { label, variant } = impactMap[impact.toLowerCase()] || { label: impact, variant: 'default' };
    
    return (
      <Badge variant={variant} className="ml-2">
        {label}
      </Badge>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Accessibility Test Results</h2>
          <p className="text-muted-foreground">
            Tested {new Date(result.timestamp).toLocaleString()} • {result.viewport} viewport
          </p>
        </div>
        {onRerun && (
          <Button variant="outline" onClick={onRerun}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Rerun Test
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {violationsCount}
          </div>
          <div className="text-sm text-red-600/80 dark:text-red-400/80">
            Accessibility Issues
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {passesCount}
          </div>
          <div className="text-sm text-green-600/80 dark:text-green-400/80">
            Passed Checks
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {incompleteCount}
          </div>
          <div className="text-sm text-amber-600/80 dark:text-amber-400/80">
            Incomplete Checks
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {inapplicableCount}
          </div>
          <div className="text-sm text-blue-600/80 dark:text-blue-400/80">
            Inapplicable Checks
          </div>
        </div>
      </div>

      <Tabs defaultValue={violationsCount > 0 ? 'violations' : 'details'} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="violations">
            Violations
            <Badge variant={violationsCount > 0 ? 'error' : 'default'} className="ml-2">
              {violationsCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="passes">
            Passes
            <Badge variant="default" className="ml-2">
              {passesCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="incomplete">
            Incomplete
            <Badge variant="default" className="ml-2">
              {incompleteCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="details">
            Details
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
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
                            <div className="text-xs text-muted-foreground mb-1">Target:</div>
                            <div className="bg-background p-2 rounded text-xs font-mono mb-3 overflow-x-auto">
                              {node.target.join(' > ')}
                            </div>
                            {node.failureSummary && (
                              <>
                                <div className="text-xs text-muted-foreground mb-1">How to fix:</div>
                                <div className="bg-background p-2 rounded text-sm whitespace-pre-line">
                                  {node.failureSummary}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {violation.nodes.length > 3 && (
                          <div className="text-sm text-muted-foreground text-center">
                            + {violation.nodes.length - 3} more element{violation.nodes.length - 3 !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t">
                        <a 
                          href={violation.helpUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                        >
                          Learn more about this issue
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle>No accessibility issues found!</AlertTitle>
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
                  <Card key={i} className="border-green-200 dark:border-green-900/50">
                    <CardHeader className="bg-green-50 dark:bg-green-900/10 p-4 border-b">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <CardTitle className="text-lg">
                          {pass.id}
                        </CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        {pass.help}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm mb-4">{pass.description}</p>
                      
                      <div className="mt-4 pt-3 border-t">
                        <a 
                          href={pass.helpUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                        >
                          Learn more about this check
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>No passed checks to display</AlertTitle>
                <AlertDescription>
                  No accessibility checks passed during this test.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="incomplete">
            {incompleteCount > 0 ? (
              <div className="space-y-4">
                {result.results.incomplete.map((item, i) => (
                  <Card key={i} className="border-amber-200 dark:border-amber-900/50">
                    <CardHeader className="bg-amber-50 dark:bg-amber-900/10 p-4 border-b">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                        <CardTitle className="text-lg">
                          {item.id}
                        </CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        {item.help}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm mb-4">{item.description}</p>
                      
                      <div className="space-y-4">
                        {item.nodes.slice(0, 2).map((node, j) => (
                          <div key={j} className="bg-muted/30 p-3 rounded-md">
                            <h4 className="font-medium mb-2">Element {j + 1}:</h4>
                            <div className="bg-background p-2 rounded text-sm font-mono mb-2 overflow-x-auto">
                              {node.html || 'No HTML available'}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">Target:</div>
                            <div className="bg-background p-2 rounded text-xs font-mono mb-3 overflow-x-auto">
                              {node.target.join(' > ')}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t">
                        <a 
                          href={item.helpUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                        >
                          Learn more about this check
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>No incomplete checks</AlertTitle>
                <AlertDescription>
                  There were no incomplete accessibility checks during this test.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
                <CardDescription>
                  Detailed information about this accessibility test run
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Screen Name</h4>
                    <p className="font-medium">{result.screenName}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Viewport</h4>
                    <p className="font-medium capitalize">{result.viewport}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Tested URL</h4>
                    <div className="truncate">
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      >
                        {result.url}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Tested At</h4>
                    <p className="font-medium">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Test Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Accessibility Issues</span>
                      <span className="font-medium">{violationsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed Checks</span>
                      <span className="font-medium">{passesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Incomplete Checks</span>
                      <span className="font-medium">{incompleteCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inapplicable Checks</span>
                      <span className="font-medium">{inapplicableCount}</span>
                    </div>
                  </div>
                </div>

                {result.metadata && (
                  <div className="pt-4 mt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h4>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(result.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
