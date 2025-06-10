// Types for accessibility test results
export interface RelatedNode {
  html: string;
  target: string[];
  failureSummary?: string;
  impact?: string;
  any?: any[];
  all?: any[];
  none?: any[];
}

export interface AccessibilityNode {
  html: string;
  target: string[];
  failureSummary: string;
  impact?: string;
  any?: any[];
  all?: any[];
  none?: any[];
  relatedNodes?: RelatedNode[];
  element?: HTMLElement;
  node?: {
    selector: string;
    xpath: string;
    ancestry: string[];
    element: string;
  };
}

export interface AccessibilityRuleResult {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  impact?: string;
  tags?: string[];
  nodes: AccessibilityNode[];
  relatedNodes?: RelatedNode[];
}

export interface TestEngine {
  name: string;
  version: string;
}

export interface TestEnvironment {
  userAgent: string;
  windowWidth: number;
  windowHeight: number;
  orientationAngle: number;
  orientationType: string;
}

export interface TestResult {
  id: string;
  screenName: string;
  url: string;
  viewport: string;
  timestamp: string;
  testEngine: TestEngine;
  testRunner: {
    name: string;
  };
  testEnvironment: TestEnvironment;
  toolOptions: Record<string, any>;
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
