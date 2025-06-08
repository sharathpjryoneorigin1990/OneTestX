'use client';

import React, { useState, useEffect } from 'react';
import { FiSave, FiFolder, FiDownload, FiUpload, FiPlay, FiCode } from 'react-icons/fi';
import RequestBuilder from './RequestBuilder';
import ResponsePanel from './ResponsePanel';
import EnvironmentManager from './EnvironmentManager';
import AssertionBuilder from './AssertionBuilder';
import PreRequestScript from './PreRequestScript';
import TestChainBuilder from './TestChainBuilder';
import { APIRequest, APIResponse, Environment, Assertion, TestChain, Collection, KeyValuePair } from './types';
import { processEnvironmentVariables } from './EnvironmentManager';

export default function APITestingInterface() {
  // State for the current request
  const [request, setRequest] = useState<APIRequest>({
    id: `req_${Date.now()}`,
    name: 'New Request',
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    body: '',
    contentType: 'application/json',
    auth: { type: 'none' },
    preRequestScript: '',
    tests: ''
  });
  
  // State for the current response
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for environments
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(null);
  
  // State for assertions
  const [assertions, setAssertions] = useState<Assertion[]>([]);
  
  // State for pre-request script
  const [preRequestScript, setPreRequestScript] = useState<string>('');
  
  // State for test chains
  const [testChains, setTestChains] = useState<TestChain[]>([{
    id: 'default_chain',
    name: 'Default Test Chain',
    steps: [],
    variables: []
  }]);
  
  // State for collections
  const [collections, setCollections] = useState<Collection[]>([{
    id: 'default_collection',
    name: 'Default Collection',
    requests: [],
    folders: []
  }]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'request' | 'preRequest' | 'assertions' | 'testChain'>('request');
  
  // Helper function to extract value from JSON path
  const extractFromJsonPath = (obj: any, path: string): string => {
    try {
      const parts = path.replace(/^\$\.?/, '').split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current === null || current === undefined) return '';
        
        // Handle array indices in the path like users[0].name
        const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [_, propName, index] = arrayMatch;
          current = current[propName]?.[parseInt(index)];
        } else {
          current = current[part];
        }
      }
      
      return typeof current === 'object' ? JSON.stringify(current) : String(current || '');
    } catch (error) {
      console.error('Error extracting JSON path:', error);
      return '';
    }
  };
  
  const [showEnvironments, setShowEnvironments] = useState(false);
  
  // Get active environment
  const activeEnvironment = environments.find(env => env.id === activeEnvironmentId) || null;
  
  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('apiTestingState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        
        if (parsedState.request) setRequest(parsedState.request);
        if (parsedState.environments) setEnvironments(parsedState.environments);
        if (parsedState.activeEnvironmentId) setActiveEnvironmentId(parsedState.activeEnvironmentId);
        if (parsedState.assertions) setAssertions(parsedState.assertions);
        if (parsedState.preRequestScript) setPreRequestScript(parsedState.preRequestScript);
        if (parsedState.testChains) setTestChains(parsedState.testChains);
        if (parsedState.collections) setCollections(parsedState.collections);
        if (parsedState.activeCollectionId) setActiveCollectionId(parsedState.activeCollectionId);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);
  
  // Save state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      request,
      environments,
      activeEnvironmentId,
      assertions,
      preRequestScript,
      testChains,
      collections,
      activeCollectionId
    };
    
    localStorage.setItem('apiTestingState', JSON.stringify(stateToSave));
  }, [
    request,
    environments,
    activeEnvironmentId,
    assertions,
    preRequestScript,
    testChains,
    collections,
    activeCollectionId
  ]);
  
  // Handle sending the request
  const handleSendRequest = async () => {
    return sendApiRequest(request);
  };
  
  // Send a specific API request and return the response
  const sendApiRequest = async (requestToSend: APIRequest): Promise<APIResponse> => {
    if (!requestToSend.url) {
      return {
        status: 0,
        statusText: 'Error',
        headers: [],
        body: null,
        time: 0,
        size: 0,
        error: 'URL is required'
      };
    }
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      // Process environment variables in URL and headers
      const processedUrl = processEnvironmentVariables(requestToSend.url, activeEnvironment);
      
      // Process pre-request script if it exists
      if (preRequestScript) {
        try {
          // Create a sandbox environment for the pre-request script
          const sandbox = {
            request: { ...request },
            environment: activeEnvironment ? { ...activeEnvironment } : null,
            console: {
              log: (...args: any[]) => console.log('Pre-request script:', ...args)
            },
            // Add a function to set environment variables
            setEnvironmentVariable: (key: string, value: string) => {
              if (!activeEnvironment) return;
              
              const updatedEnvironment = { ...activeEnvironment };
              const existingVar = updatedEnvironment.variables.find(v => v.key === key);
              
              if (existingVar) {
                existingVar.value = value;
              } else {
                updatedEnvironment.variables.push({ key, value, isSecret: false, enabled: true });
              }
              
              const updatedEnvironments = environments.map(env => 
                env.id === activeEnvironment.id ? updatedEnvironment : env
              );
              
              setEnvironments(updatedEnvironments);
            }
          };
          
          // Execute the pre-request script
          const scriptFunction = new Function(
            'request', 'environment', 'console', 'setEnvironmentVariable',
            preRequestScript
          );
          
          scriptFunction(
            sandbox.request,
            sandbox.environment,
            sandbox.console,
            sandbox.setEnvironmentVariable
          );
        } catch (error) {
          console.error('Error executing pre-request script:', error);
        }
      }
      
      // Prepare headers
      const headers: Record<string, string> = {};
      requestToSend.headers
        .filter(h => h.enabled !== false)
        .forEach(header => {
          headers[header.key] = processEnvironmentVariables(header.value, activeEnvironment);
        });
      
      // Add auth headers if needed
      if (requestToSend.auth && requestToSend.auth.type !== 'none') {
        switch (requestToSend.auth.type) {
          case 'basic':
            if (requestToSend.auth.username && requestToSend.auth.password) {
              const credentials = btoa(`${requestToSend.auth.username}:${requestToSend.auth.password}`);
              headers['Authorization'] = `Basic ${credentials}`;
            }
            break;
          case 'bearer':
            if (requestToSend.auth.token) {
              headers['Authorization'] = `Bearer ${requestToSend.auth.token}`;
            }
            break;
          case 'apiKey':
            if (requestToSend.auth.key && requestToSend.auth.value) {
              if (requestToSend.auth.addTo === 'header') {
                headers[requestToSend.auth.key] = requestToSend.auth.value;
              }
              // For query params, it's handled in the URL construction
            }
            break;
          case 'oauth2':
            if (requestToSend.auth.token) {
              headers['Authorization'] = `Bearer ${requestToSend.auth.token}`;
            }
            break;
          // Digest auth would require a more complex implementation
        }
      }
      
      // Prepare URL with query parameters
      let url = processedUrl;
      
      // Add API key to query params if needed
      if (requestToSend.auth?.type === 'apiKey' && requestToSend.auth.addTo === 'query' && requestToSend.auth.key && requestToSend.auth.value) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}${encodeURIComponent(requestToSend.auth.key)}=${encodeURIComponent(requestToSend.auth.value)}`;
      }
      
      // Prepare request options
      const options: RequestInit = {
        method: requestToSend.method,
        headers,
        credentials: 'include'
      };
      
      // Add body for non-GET/HEAD requests
      if (!['GET', 'HEAD'].includes(requestToSend.method) && requestToSend.body) {
        if (requestToSend.contentType === 'application/json') {
          try {
            // Try to parse as JSON to validate
            const jsonBody = JSON.parse(requestToSend.body);
            options.body = JSON.stringify(jsonBody);
          } catch (error) {
            // If not valid JSON, use as is
            options.body = requestToSend.body;
          }
        } else {
          options.body = requestToSend.body;
        }
        
        // Set content-type header
        headers['Content-Type'] = requestToSend.contentType || 'application/json';
      }
      
      // Use the API route to proxy the request to avoid CORS issues
      const startTime = performance.now();
      
      // Create a proxy endpoint
      const proxyEndpoint = '/api/proxy';
      
      const proxyResponse = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          method: requestToSend.method,
          headers,
          body: options.body
        })
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Parse the response
      const responseData = await proxyResponse.json();
      
      // Format headers
      const responseHeaders = Object.entries(responseData.headers || {}).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(', ') : String(value),
        enabled: true
      }));
      
      // Create response object
      const apiResponse: APIResponse = {
        status: responseData.status,
        statusText: responseData.statusText || '',
        headers: responseHeaders,
        body: responseData.body,
        time: Math.round(responseTime),
        size: JSON.stringify(responseData.body).length,
        contentType: responseData.headers?.['content-type'] || responseData.headers?.['Content-Type'] || ''
      };
      
      setResponse(apiResponse);
      
      // Run assertions if there are any
      if (assertions.length > 0) {
        const updatedAssertions = assertions.map(assertion => {
          const result = runAssertion(assertion, apiResponse);
          return { 
            ...assertion, 
            passed: result.passed,
            actual: result.actual,
            error: result.error
          };
        });
        
        setAssertions(updatedAssertions);
      }
      return apiResponse;
    } catch (error) {
      console.error('Error sending request:', error);
      
      // Create error response
      const errorResponse: APIResponse = {
        status: 0,
        statusText: 'Error',
        headers: [],
        body: null,
        time: 0,
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      setResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Run a single assertion against the response
  const runAssertion = (assertion: Assertion, response: APIResponse): { passed: boolean; error?: string; actual?: any } => {
    try {
      switch (assertion.type) {
        case 'status':
          return evaluateStatusAssertion(assertion, response);
        case 'jsonPath':
          return evaluateJsonPathAssertion(assertion, response);
        case 'responseTime':
          return evaluateResponseTimeAssertion(assertion, response);
        case 'header':
          return evaluateHeaderAssertion(assertion, response);
        case 'schema':
          return evaluateSchemaAssertion(assertion, response);
        default:
          return { passed: false, error: 'Unsupported assertion type' };
      }
    } catch (error) {
      console.error(`Error running assertion: ${assertion.name}`, error);
      return { 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };
  
  // Evaluate status assertion
  const evaluateStatusAssertion = (assertion: Assertion, response: APIResponse): { passed: boolean; error?: string; actual?: any } => {
    if (assertion.type !== 'status') {
      return { passed: false, error: 'Invalid assertion type' };
    }
    
    const { condition, value } = assertion;
    const status = response.status;
    
    if (!value) {
      return { passed: false, error: 'Missing expected value' };
    }
    
    let passed = false;
    
    switch (condition) {
      case 'equals':
        passed = status === Number(value);
        break;
      case 'notEquals':
        passed = status !== Number(value);
        break;
      case 'greaterThan':
        passed = status > Number(value);
        break;
      case 'lessThan':
        passed = status < Number(value);
        break;
      case 'in':
        passed = value.split(',').map(v => Number(v.trim())).includes(status);
        break;
      default:
        return { passed: false, error: `Unsupported condition: ${condition}` };
    }
    
    return { 
      passed, 
      actual: status,
      error: passed ? undefined : `Expected status ${condition} ${value}, but got ${status}`
    };
  };
  
  // Evaluate JSON path assertion
  const evaluateJsonPathAssertion = (assertion: Assertion, response: APIResponse): { passed: boolean; error?: string; actual?: any } => {
    if (assertion.type !== 'jsonPath') {
      return { passed: false, error: 'Invalid assertion type' };
    }
    
    // This is a simplified implementation. In a real app, you would use a library like jsonpath
    // to properly evaluate JSON paths.
    try {
      const { path, condition, value } = assertion;
      
      if (!path) {
        return { passed: false, error: 'Missing JSON path' };
      }
      
      // Simple path evaluation (only supports direct property access)
      const pathParts = path.split('.');
      let result = response.body;
      
      for (const part of pathParts) {
        if (result === null || result === undefined) {
          return { passed: false, error: `Path ${path} not found in response`, actual: undefined };
        }
        result = result[part];
      }
      
      let passed = false;
      
      switch (condition) {
        case 'exists':
          passed = result !== undefined && result !== null;
          break;
        case 'notExists':
          passed = result === undefined || result === null;
          break;
        case 'equals':
          passed = value ? String(result) === value : false;
          break;
        case 'notEquals':
          passed = value ? String(result) !== value : false;
          break;
        case 'contains':
          passed = value ? String(result).includes(value) : false;
          break;
        case 'notContains':
          passed = value ? !String(result).includes(value) : false;
          break;
        case 'in':
          passed = value ? value.split(',').map(v => v.trim()).includes(String(result)) : false;
          break;
        default:
          return { passed: false, error: `Unsupported condition: ${condition}` };
      }
      
      return { 
        passed, 
        actual: result,
        error: passed ? undefined : `JSON path assertion failed: ${path} ${condition} ${value || ''}`
      };
    } catch (error) {
      console.error('Error evaluating JSON path:', error);
      return { 
        passed: false, 
        error: error instanceof Error ? error.message : 'Error evaluating JSON path' 
      };
    }
  };
  
  // Evaluate response time assertion
  const evaluateResponseTimeAssertion = (assertion: Assertion, response: APIResponse): { passed: boolean; error?: string; actual?: any } => {
    if (assertion.type !== 'responseTime') {
      return { passed: false, error: 'Invalid assertion type' };
    }
    
    const { condition, value } = assertion;
    const time = response.time || 0;
    
    if (!value) {
      return { passed: false, error: 'Missing expected value' };
    }
    
    let passed = false;
    
    switch (condition) {
      case 'lessThan':
        passed = time < Number(value);
        break;
      case 'greaterThan':
        passed = time > Number(value);
        break;
      default:
        return { passed: false, error: `Unsupported condition: ${condition}` };
    }
    
    return { 
      passed, 
      actual: time,
      error: passed ? undefined : `Expected response time ${condition} ${value}ms, but got ${time}ms`
    };
  };
  
  // Evaluate header assertion
  const evaluateHeaderAssertion = (assertion: Assertion, response: APIResponse): { passed: boolean; error?: string; actual?: any } => {
    if (assertion.type !== 'header') {
      return { passed: false, error: 'Invalid assertion type' };
    }
    
    const { headerName, condition, value } = assertion;
    
    if (!headerName) {
      return { passed: false, error: 'Missing header name' };
    }
    
    const header = response.headers.find(h => h.key.toLowerCase() === headerName.toLowerCase());
    
    if (!header) {
      const passed = condition === 'notExists';
      return { 
        passed, 
        actual: undefined,
        error: passed ? undefined : `Header ${headerName} not found in response`
      };
    }
    
    let passed = false;
    
    switch (condition) {
      case 'exists':
        passed = true;
        break;
      case 'notExists':
        passed = false;
        break;
      case 'equals':
        passed = value ? header.value === value : false;
        break;
      case 'notEquals':
        passed = value ? header.value !== value : false;
        break;
      case 'contains':
        passed = value ? header.value.includes(value) : false;
        break;
      case 'notContains':
        passed = value ? !header.value.includes(value) : false;
        break;
      case 'in':
        passed = value ? value.split(',').map(v => v.trim()).includes(header.value) : false;
        break;
      default:
        return { passed: false, error: `Unsupported condition: ${condition}` };
    }
    
    return { 
      passed, 
      actual: header.value,
      error: passed ? undefined : `Header assertion failed: ${headerName} ${condition} ${value || ''}`
    };
  };
  
  // Evaluate schema assertion
  const evaluateSchemaAssertion = (assertion: Assertion, response: APIResponse): { passed: boolean; error?: string; actual?: any } => {
    if (assertion.type !== 'schema') {
      return { passed: false, error: 'Invalid assertion type' };
    }
    
    // This is a simplified implementation. In a real app, you would use a library like Ajv
    // to properly validate JSON schemas.
    try {
      // For now, just check if the response body is valid JSON
      const passed = typeof response.body === 'object' && response.body !== null;
      
      return {
        passed,
        actual: response.body,
        error: passed ? undefined : 'Response body is not a valid JSON object'
      };
    } catch (error) {
      return {
        passed: false,
        error: error instanceof Error ? error.message : 'Error validating schema'
      };
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-4">API Testing Suite</h1>
          <input
            type="text"
            className="bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-1 text-sm"
            placeholder="Request Name"
            value={request.name}
            onChange={(e) => setRequest({ ...request, name: e.target.value })}
          />
        </div>
        <div className="flex space-x-2">
          <button
            className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex items-center hover:bg-gray-600"
            onClick={() => setShowEnvironments(!showEnvironments)}
          >
            <FiFolder className="mr-1" />
            Environments
          </button>
          <button
            className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex items-center hover:bg-gray-600"
          >
            <FiSave className="mr-1" />
            Save
          </button>
          <button
            className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex items-center hover:bg-gray-600"
          >
            <FiDownload className="mr-1" />
            Export
          </button>
          <button
            className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex items-center hover:bg-gray-600"
          >
            <FiUpload className="mr-1" />
            Import
          </button>
        </div>
      </div>
      
      {/* Environment Manager (Collapsible) */}
      {showEnvironments && (
        <div className="p-4 border-b border-gray-700">
          <EnvironmentManager
            environments={environments}
            activeEnvironmentId={activeEnvironmentId}
            onEnvironmentChange={setActiveEnvironmentId}
            onEnvironmentsUpdate={setEnvironments}
          />
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-grow flex overflow-hidden">
        {/* Left Panel - Request */}
        <div className="w-1/2 p-4 border-r border-gray-700 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'request' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('request')}
            >
              Request
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'preRequest' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('preRequest')}
            >
              Pre-request Script
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'assertions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('assertions')}
            >
              Assertions
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'testChain' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('testChain')}
            >
              Test Chain
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-grow overflow-auto">
            {activeTab === 'request' && (
              <RequestBuilder
                request={request}
                onRequestChange={setRequest}
                onSendRequest={handleSendRequest}
                isSending={isLoading}
                activeEnvironment={activeEnvironment}
              />
            )}
            {activeTab === 'testChain' && (
              <TestChainBuilder
                collections={collections}
                testChains={testChains}
                setTestChains={setTestChains}
                onRunChain={async (chainId: string) => {
                  // (You may want to implement advanced run logic here)
                }}
              />
            )}
            
            {activeTab === 'preRequest' && (
              <PreRequestScript
                script={preRequestScript}
                setScript={(script: string) => setPreRequestScript(script)}
                onRunScript={async (script: string) => {
                  try {
                    // Run the script in a sandbox
                    const sandbox = {
                      request: { ...request },
                      environment: activeEnvironment ? { ...activeEnvironment } : null,
                      console: {
                        log: (...args: any[]) => console.log('Pre-request script:', ...args)
                      },
                      setEnvironmentVariable: (key: string, value: string) => {
                        if (!activeEnvironment) return;
                        
                        const updatedEnvironment = { ...activeEnvironment };
                        const existingVar = updatedEnvironment.variables.find(v => v.key === key);
                        
                        if (existingVar) {
                          existingVar.value = value;
                        } else {
                          updatedEnvironment.variables.push({ key, value, isSecret: false, enabled: true });
                        }
                        
                        const updatedEnvironments = environments.map(env => 
                          env.id === activeEnvironment.id ? updatedEnvironment : env
                        );
                        
                        setEnvironments(updatedEnvironments);
                      }
                    };
                    
                    const scriptFunction = new Function(
                      'request', 'environment', 'console', 'setEnvironmentVariable',
                      script
                    );
                    
                    scriptFunction(
                      sandbox.request,
                      sandbox.environment,
                      sandbox.console,
                      sandbox.setEnvironmentVariable
                    );
                    
                    return { success: true, message: 'Script executed successfully' };
                  } catch (error) {
                    return { 
                      success: false, 
                      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
                    };
                  }
                }}
                environments={environments}
                activeEnvironmentId={activeEnvironmentId}
                setEnvironmentVariable={(environmentId: string, key: string, value: string) => {
                  const updatedEnvironments = environments.map(env => {
                    if (env.id === environmentId) {
                      const updatedVariables = [...env.variables];
                      const existingVar = updatedVariables.find(v => v.key === key);
                      
                      if (existingVar) {
                        existingVar.value = value;
                      } else {
                        updatedVariables.push({ key, value, enabled: true, isSecret: false });
                      }
                      
                      return { ...env, variables: updatedVariables };
                    }
                    return env;
                  });
                  
                  setEnvironments(updatedEnvironments);
                }}
              />
            )}
            
            {activeTab === 'assertions' && (
              <AssertionBuilder
                assertions={assertions}
                setAssertions={setAssertions}
                response={response}
                onRunAssertions={() => {
                  if (!response) return;
                  
                  const updatedAssertions = assertions.map(assertion => {
                    const result = runAssertion(assertion, response);
                    return { 
                      ...assertion, 
                      passed: result.passed,
                      actual: result.actual,
                      error: result.error
                    };
                  });
                  
                  setAssertions(updatedAssertions);
                }}
              />
            )}
            
            {activeTab === 'testChain' && (
              <TestChainBuilder
                collections={collections}
                testChains={testChains}
                setTestChains={(chains: TestChain[]) => setTestChains(chains)}
                onRunChain={async (chainId: string) => {
                  // Find the test chain by ID
                  const chain = testChains.find(c => c.id === chainId);
                  if (!chain) {
                    console.error(`Test chain with ID ${chainId} not found`);
                    return;
                  }
                  
                  // Get the active environment
                  const env = activeEnvironmentId
                    ? environments.find(e => e.id === activeEnvironmentId)
                    : null;
                  
                  // Initialize variables with environment variables
                  let variables: KeyValuePair[] = [];
                  
                  // Add environment variables if available
                  if (env && env.variables) {
                    variables = [...env.variables];
                  }
                  
                  // Add chain variables
                  if (chain.variables) {
                    variables = [...variables, ...chain.variables];
                  }
                  
                  // Create a temporary environment object for variable processing
                  const tempEnvironment: Environment = {
                    id: 'temp_env_' + Date.now(),
                    name: 'Temporary Environment',
                    variables: variables
                  };
                  
                  // Execute each step in sequence
                  for (const step of chain.steps) {
                    try {
                      // Find the request for this step
                      const requestToRun = collections.flatMap(c => c.requests)
                        .find(r => r.id === step.requestId);
                      
                      if (!requestToRun) {
                        console.error(`Request with ID ${step.requestId} not found`);
                        continue;
                      }
                      
                      // Apply variables to the request
                      const processedRequest = {
                        ...requestToRun,
                        url: requestToRun.url ? processEnvironmentVariables(requestToRun.url, tempEnvironment) : '',
                        headers: requestToRun.headers.map((h: KeyValuePair) => ({
                          ...h,
                          value: h.value ? processEnvironmentVariables(h.value, tempEnvironment) : ''
                        })),
                        body: requestToRun.body ? processEnvironmentVariables(requestToRun.body, tempEnvironment) : ''
                      };
                      
                      // Send the request
                      const stepResponse = await sendApiRequest(processedRequest);
                      
                      // Process extractions
                      if (step.extractions && step.extractions.length > 0 && stepResponse) {
                        for (const extraction of step.extractions) {
                          let extractedValue = '';
                          
                          if (extraction.source === 'response' && extraction.path) {
                            // Extract from response body using path
                            extractedValue = extractFromJsonPath(stepResponse.body, extraction.path);
                          } else if (extraction.source === 'headers' && extraction.path) {
                            // Extract from headers
                            const header = stepResponse.headers.find((h: KeyValuePair) => 
                              h.key.toLowerCase() === extraction.path.toLowerCase());
                            extractedValue = header ? header.value : '';
                          } else if (extraction.source === 'status') {
                            // Extract status code
                            extractedValue = String(stepResponse.status);
                          }
                          
                          // Add or update variable
                          const existingVar = variables.find(v => v.key === extraction.variable);
                          if (existingVar) {
                            existingVar.value = extractedValue;
                          } else {
                            variables.push({
                              key: extraction.variable,
                              value: extractedValue,
                              enabled: true,
                              isSecret: false
                            });
                          }
                        }
                      }
                      
                      // Run assertions
                      if (step.assertions && step.assertions.length > 0 && stepResponse) {
                        for (const assertion of step.assertions) {
                          runAssertion(assertion, stepResponse);
                        }
                      }
                      
                    } catch (error) {
                      console.error(`Error executing step ${step.id}:`, error);
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
        
        {/* Right Panel - Response */}
        <div className="w-1/2 p-4 overflow-hidden flex flex-col">
          <h2 className="text-lg font-medium mb-4">Response</h2>
          <div className="flex-grow overflow-auto">
            <ResponsePanel
              response={response}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
