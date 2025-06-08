import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface AccessibilityIssue {
  id: string;
  description: string;
  help: string;
  helpUrl?: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  tags?: string[];
  nodes: Array<{
    html: string;
    failureSummary: string;
  }>;
}

interface IssueListProps {
  issues: AccessibilityIssue[];
}

export function IssueList({ issues }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No issues found in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {issues.map((issue, index) => (
        <Card key={`${issue.id}-${index}`} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{issue.help}</h3>
                <p className="text-sm text-muted-foreground">{issue.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {issue.impact && (
                  <Badge variant={
                    issue.impact === 'critical' ? 'error' : 
                    issue.impact === 'serious' ? 'warning' : 'default'
                  }>
                    {issue.impact.charAt(0).toUpperCase() + issue.impact.slice(1)}
                  </Badge>
                )}
                {issue.helpUrl && (
                  <a 
                    href={issue.helpUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {issue.nodes.map((node, nodeIndex) => (
                <div key={nodeIndex} className="border rounded-md p-4 bg-muted/10">
                  <div className="font-mono text-sm mb-2 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      <code dangerouslySetInnerHTML={{ __html: node.html }} />
                    </pre>
                  </div>
                  {node.failureSummary && (
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Issue:</p>
                      <p className="mt-1 text-yellow-700 dark:text-yellow-300 whitespace-pre-line">
                        {node.failureSummary}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
