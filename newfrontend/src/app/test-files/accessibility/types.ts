export type ViewportType = 'desktop' | 'tablet' | 'mobile';

export interface AccessibilityIssue {
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

export interface TestResult {
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

export type TabValue = 'summary' | 'violations' | 'passes' | 'incomplete' | 'inapplicable';
