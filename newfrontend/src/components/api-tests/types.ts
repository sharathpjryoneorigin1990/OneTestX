/**
 * Shared types for API testing components
 */

export interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
  isSecret?: boolean;
}

export interface APIRequest {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: string;
  contentType?: string;
  auth: AuthConfig;
  preRequestScript?: string;
  tests?: string;
}

export interface APIResponse {
  status: number;
  statusText: string;
  headers: KeyValuePair[];
  body: any;
  time: number;
  size: number;
  contentType?: string;
  error?: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValuePair[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: APIRequest[];
  folders?: CollectionFolder[];
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  requests: APIRequest[];
  folders?: CollectionFolder[];
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestRun {
  id: string;
  requestId: string;
  timestamp: number;
  duration: number;
  results: TestResult[];
  response: APIResponse;
  environment?: string;
}

export interface Assertion {
  id: string;
  type: 'status' | 'jsonPath' | 'schema' | 'dataType' | 'responseTime' | 'header' | 'custom';
  enabled: boolean;
  name: string;
  condition: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists' | 'matches' | 'in';
  expected?: any;
  path?: string;
  value?: string;
  headerName?: string;
  actual?: any;
  passed?: boolean;
  error?: string;
}

export interface TestChain {
  id: string;
  name: string;
  steps: TestChainStep[];
  variables: KeyValuePair[];
}

export interface TestChainStep {
  id: string;
  name: string;
  requestId: string;
  extractions: {
    source: 'response' | 'headers' | 'status';
    path: string;
    variable: string;
  }[];
  assertions: Assertion[];
  condition?: {
    type: 'always' | 'onSuccess' | 'onFailure' | 'expression';
    expression?: string;
  };
}

export interface MockServer {
  id: string;
  name: string;
  baseUrl: string;
  routes: MockServerRoute[];
  enabled: boolean;
}

export interface MockServerRoute {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  responseBody: string;
  responseHeaders: KeyValuePair[];
  delay?: number;
  script?: string;
}

export interface ContractTest {
  id: string;
  name: string;
  specUrl: string;
  endpoints: {
    path: string;
    method: string;
    enabled: boolean;
  }[];
}

export interface PerformanceTest {
  id: string;
  name: string;
  requestId: string;
  config: {
    virtualUsers: number;
    duration: number;
    rampUp: number;
    iterations?: number;
    thresholds: {
      responseTime: number;
      errorRate: number;
    };
  };
}

export interface SecurityTest {
  id: string;
  name: string;
  requestId: string;
  tests: {
    type: 'injection' | 'xss' | 'auth' | 'sensitive' | 'csrf';
    enabled: boolean;
    config?: any;
  }[];
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth2' | 'digest';
  username?: string;
  password?: string;
  token?: string;
  key?: string;
  value?: string;
  addTo?: 'header' | 'query';
}

export interface PreRequestScriptProps {
  script: string;
  onScriptChange: (script: string) => void;
  onRun: (script: string) => { success: boolean; message: string };
}

export interface AssertionBuilderProps {
  assertions: Assertion[];
  onAssertionsChange: (assertions: Assertion[]) => void;
  response: APIResponse | null;
  onRunAssertions: () => void;
}

export interface TestChainBuilderProps {
  testChains: TestChain[];
  onTestChainsChange: (testChains: TestChain[]) => void;
  environments: Environment[];
  activeEnvironmentId: string | null;
  onRunTestChain: (chainId: string) => Promise<void>;
}
