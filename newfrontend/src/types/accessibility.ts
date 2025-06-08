// Types for accessibility test results
export interface AccessibilityNode {
  html: string;
  target: string[];
  failureSummary: string;
  impact?: string;
  any?: any[];
  all?: any[];
  none?: any[];
}

export interface AccessibilityRuleResult {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  impact?: string;
  tags?: string[];
  nodes: AccessibilityNode[];
}

export interface TestResult {
  id: string;
  screenName: string;
  url: string;
  viewport: string;
  timestamp: string;
  results: {
    violations: AccessibilityRuleResult[];
    passes: AccessibilityRuleResult[];
    incomplete: AccessibilityRuleResult[];
    inapplicable: any[];
  };
  metadata?: {
    userAgent: string;
    url: string;
    timestamp: string;
    viewport: {
      width: number;
      height: number;
    };
  };
}

export interface TestRunOptions {
  screenName: string;
  url: string;
  viewport?: 'mobile' | 'tablet' | 'desktop' | 'large';
  waitFor?: number;
  waitForSelector?: string;
  waitForTimeout?: number;
}
