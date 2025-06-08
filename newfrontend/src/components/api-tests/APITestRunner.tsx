'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { FiSend, FiSettings, FiCode, FiLayers, FiUpload, FiDownload, FiPlus, FiTrash2, FiSave, FiPlay, FiCopy, FiLink, FiServer, FiShield, FiBarChart2 } from 'react-icons/fi';
import ImportPanel from './ImportPanel';
import ExportPanel from './ExportPanel';
import RequestPanel from './RequestPanel';
import ResponsePanel from './ResponsePanel';
import TestsPanel from '@/components/api-tests/TestsPanel';
import EnvironmentPanel from './EnvironmentPanel';
import CollectionPanel from './CollectionPanel';
import TestChainBuilder from './TestChainBuilder';
import MockServerPanel, { MockServer } from './MockServerPanel';
import SecurityTestingPanel, { SecurityTest } from './SecurityTestingPanel';
import PerformanceTestPanel, { PerformanceTest } from './PerformanceTestPanel';

// Define types
interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

interface APIRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: {
    contentType: string;
    content: string;
  };
  auth: {
    type: string;
    credentials: any;
  };
}

interface APIResponse {
  status: number;
  statusText: string;
  headers: { key: string; value: string }[];
  body: any;
  time: number;
  size: number;
}

interface APIEnvironment {
  id: string;
  name: string;
  variables: KeyValuePair[];
  isActive: boolean;
}

interface APITest {
  id: string;
  name: string;
  script: string;
  enabled: boolean;
}

interface APICollection {
  id: string;
  name: string;
  description?: string;
  requests: APIRequest[];
}

export default function APITestRunner() {
  // State for the current request
  const [currentRequest, setCurrentRequest] = useState<APIRequest>({
    id: 'req_' + Date.now(),
    name: 'New Request',
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    body: {
      contentType: 'application/json',
      content: ''
    },
    auth: {
      type: 'none',
      credentials: {}
    }
  });

  // State for the current response
  const [currentResponse, setCurrentResponse] = useState<APIResponse | null>(null);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // State for environments
  const [environments, setEnvironments] = useState<APIEnvironment[]>([
    {
      id: 'env_default',
      name: 'Default',
      variables: [],
      isActive: true
    }
  ]);
  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(null);
  
  // State for collections and requests
  const [collections, setCollections] = useState<APICollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<APIRequest | null>(null);
  
  // State for tests
  const [tests, setTests] = useState<APITest[]>([]);
  
  // State for test chains
  const [testChains, setTestChains] = useState<any[]>([
    {
      id: 'chain_default',
      name: 'Default Test Chain',
      steps: [],
      variables: []
    }
  ]);

  // State for Mock Servers
  const [mockServers, setMockServers] = useState<MockServer[]>([]);
  
  // State for Security Tests
  const [securityTests, setSecurityTests] = useState<SecurityTest[]>([]);
  
  // State for Performance Tests
  const [performanceTests, setPerformanceTests] = useState<PerformanceTest[]>([]);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'tests' | 'environment' | 'testChain' | 'mockServer' | 'security' | 'performance'>('request');
  
  // State for import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Function to send the request
  const sendRequest = async () => {
    setIsLoading(true);
    setCurrentResponse(null);
    
    try {
      // Process environment variables in URL and headers
      const processedRequest = processEnvironmentVariables(currentRequest, environments);
      
      // Build the request options
      const options: RequestInit = {
        method: processedRequest.method,
        headers: processedRequest.headers.reduce((obj, header) => {
          if (header.enabled && header.key) {
            obj[header.key] = header.value;
          }
          return obj;
        }, {} as Record<string, string>)
      };
      
      // Add body if not GET or HEAD
      if (!['GET', 'HEAD'].includes(processedRequest.method)) {
        if (processedRequest.body.contentType === 'application/json') {
          options.body = processedRequest.body.content;
        } else if (processedRequest.body.contentType === 'application/x-www-form-urlencoded') {
          // Handle form data
          const formData = new URLSearchParams();
          try {
            const formParams = JSON.parse(processedRequest.body.content);
            Object.entries(formParams).forEach(([key, value]) => {
              formData.append(key, value as string);
            });
            options.body = formData;
          } catch (e) {
            console.error('Failed to parse form data', e);
          }
        }
      }
      
      // Build URL with query parameters
      let url = processedRequest.url;
      if (processedRequest.params.length > 0) {
        const queryParams = new URLSearchParams();
        processedRequest.params.forEach(param => {
          if (param.enabled && param.key) {
            queryParams.append(param.key, param.value);
          }
        });
        url += `?${queryParams.toString()}`;
      }
      
      // Handle authentication
      if (!options.headers) {
        options.headers = {};
      }
      
      // Convert headers to a Record type for proper indexing
      const headers = options.headers as Record<string, string>;
      
      if (processedRequest.auth.type === 'basic') {
        const { username, password } = processedRequest.auth.credentials;
        headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
      } else if (processedRequest.auth.type === 'bearer') {
        headers['Authorization'] = `Bearer ${processedRequest.auth.credentials.token}`;
      } else if (processedRequest.auth.type === 'apiKey') {
        const { key, value, in: location } = processedRequest.auth.credentials;
        if (location === 'header') {
          headers[key] = value;
        } else if (location === 'query') {
          const urlObj = new URL(url);
          urlObj.searchParams.append(key, value);
          url = urlObj.toString();
        }
      }
      
      // Record start time
      const startTime = performance.now();
      
      // Send the request
      const response = await fetch(url, options);
      
      // Record end time
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Parse response
      let responseBody;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      // Create response object
      const apiResponse: APIResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers.entries()).map(([key, value]) => ({ key, value })),
        body: responseBody,
        time: responseTime,
        size: JSON.stringify(responseBody).length
      };
      
      setCurrentResponse(apiResponse);
      
      // Run tests if any
      if (tests.length > 0) {
        runTests(apiResponse);
      }
    } catch (error) {
      console.error('Request failed', error);
      setCurrentResponse({
        status: 0,
        statusText: 'Error',
        headers: [],
        body: { error: error instanceof Error ? error.message : 'Unknown error' },
        time: 0,
        size: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to process environment variables
  const processEnvironmentVariables = (request: APIRequest, envs: APIEnvironment[]): APIRequest => {
    const activeEnv = envs.find(env => env.isActive);
    if (!activeEnv) return request;
    
    const processString = (str: string) => {
      let result = str;
      activeEnv.variables.forEach(variable => {
        result = result.replace(new RegExp(`{{${variable.key}}}`, 'g'), variable.value);
      });
      return result;
    };
    
    // Deep clone the request to avoid modifying the original
    const processedRequest = JSON.parse(JSON.stringify(request)) as APIRequest;
    
    // Process URL
    processedRequest.url = processString(processedRequest.url);
    
    // Process headers
    processedRequest.headers = processedRequest.headers.map(header => ({
      ...header,
      value: processString(header.value)
    }));
    
    // Process params
    processedRequest.params = processedRequest.params.map(param => ({
      ...param,
      value: processString(param.value)
    }));
    
    // Process body
    if (typeof processedRequest.body.content === 'string') {
      processedRequest.body.content = processString(processedRequest.body.content);
    }
    
    return processedRequest;
  };

  // Function to run tests
  const runTests = (response: APIResponse) => {
    // Implementation for running tests
    console.log('Running tests against response', response);
  };


  // Helper function to generate examples from Swagger schemas
  const generateSwaggerExample = (schema: any, definitions?: any): any => {
    if (!schema) return {};
    
    // Handle schema references (Swagger 2.0 uses $ref)
    if (schema.$ref && definitions) {
      const refPath = schema.$ref.split('/');
      const refName = refPath[refPath.length - 1];
      if (definitions[refName]) {
        return generateSwaggerExample(definitions[refName], definitions);
      }
      return { $ref: schema.$ref }; // Return reference if definition not found
    }
    
    // Use example if provided
    if (schema.example) return schema.example;
    
    // Handle different types
    if (schema.type === 'object') {
      const result: Record<string, any> = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
          result[key] = generateSwaggerExample(prop, definitions);
        });
      }
      return result;
    } else if (schema.type === 'array') {
      if (schema.items) {
        return [generateSwaggerExample(schema.items, definitions)];
      }
      return [];
    } else if (schema.type === 'string') {
      return schema.default || 'string';
    } else if (schema.type === 'number' || schema.type === 'integer') {
      return schema.default || 0;
    } else if (schema.type === 'boolean') {
      return schema.default || false;
    }
    
    return {};
  };

  // Function to handle import from Swagger/OpenAPI
  const handleImportFromSwagger = (swaggerJson: any) => {
    try {
      console.log('[SwaggerImport] Received swaggerJson type:', typeof swaggerJson);
      
      // Validate that we have a proper object
      if (!swaggerJson || typeof swaggerJson !== 'object') {
        console.error('[SwaggerImport] Invalid swaggerJson received:', swaggerJson);
        throw new Error('Invalid Swagger/OpenAPI specification format. Expected a JSON object.');
      }
      
      // Log the keys to help diagnose issues
      console.log('[SwaggerImport] swaggerJson keys:', Object.keys(swaggerJson));
      
      // Check for key Swagger/OpenAPI properties
      if (!swaggerJson.swagger && !swaggerJson.openapi) {
        console.error('[SwaggerImport] Missing swagger/openapi version identifier');
        throw new Error('Missing swagger/openapi version identifier in the specification.');
      }
      
      if (!swaggerJson.paths || Object.keys(swaggerJson.paths).length === 0) {
        console.error('[SwaggerImport] No paths found in specification');
        throw new Error('No API paths found in the specification.');
      }
      
      console.log('[SwaggerImport] Swagger version:', swaggerJson.swagger || swaggerJson.openapi);
      console.log('[SwaggerImport] API title:', swaggerJson.info?.title);
      console.log('[SwaggerImport] Paths count:', Object.keys(swaggerJson.paths).length);
      console.log('[SwaggerImport] First few paths:', Object.keys(swaggerJson.paths).slice(0, 3));
      console.log('[SwaggerImport] swaggerJson.paths keys:', Object.keys(swaggerJson.paths));
      const firstPathKey = Object.keys(swaggerJson.paths)[0];
      if (firstPathKey) {
        console.log(`[SwaggerImport] Example path item (swaggerJson.paths['${firstPathKey}']):`, JSON.stringify(swaggerJson.paths[firstPathKey], null, 2));
      }
    } catch (error) {
      console.error('[SwaggerImport] Error inspecting swagger paths:', error);
    }
    let pushedRequestsCount = 0;
    try {
      console.log('Importing Swagger/OpenAPI specification:', swaggerJson);
      
      // Create a new collection from Swagger
      const collectionId = 'col_' + Date.now();
      const newCollection: APICollection = {
        id: collectionId,
        name: swaggerJson.info?.title || 'Imported API',
        description: swaggerJson.info?.description || '',
        requests: []
      };
      
      console.log('Created new collection:', newCollection);
      
      // Process paths and operations
      const requests: APIRequest[] = [];
      
      // Check if paths exist in the swagger JSON
      if (!swaggerJson.paths || Object.keys(swaggerJson.paths).length === 0) {
        console.error('No paths found in the Swagger/OpenAPI specification');
        throw new Error('No API paths found in the specification');
      }
      
      console.log(`Processing ${Object.keys(swaggerJson.paths).length} paths`);
      
      Object.entries(swaggerJson.paths || {}).forEach(([path, pathItem]: [string, any], pathIndex) => {
        // For each HTTP method in the path
        ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].forEach((method, methodIndex) => {
          if (pathItem[method]) {
            const operation = pathItem[method];
            const timestamp = Date.now() + pathIndex + methodIndex; // Ensure unique IDs
            
            console.log(`Processing ${method.toUpperCase()} ${path} (${operation.operationId || 'unnamed'})`);
            
            // Create a new request
            const request: APIRequest = {
              id: `req_${timestamp}_${Math.random().toString(36).substring(2, 9)}`,
              name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
              method: method.toUpperCase(),
              url: `{{baseUrl}}${path}`,
              headers: [],
              params: [],
              body: {
                contentType: 'application/json',
                content: ''
              },
              auth: {
                type: 'none',
                credentials: {}
              }
            };
            
            // Add path parameters
            const pathParams = path.match(/\{([^}]+)\}/g);
            if (pathParams) {
              console.log(`Found ${pathParams.length} path parameters in ${path}`);
              pathParams.forEach((param: string) => {
                const paramName = param.substring(1, param.length - 1);
                request.params.push({
                  key: paramName,
                  value: '',
                  description: `Path parameter: ${paramName}`,
                  enabled: true
                });
              });
            }
            
            // Add parameters from operation
            (operation.parameters || []).forEach((param: any) => {
              switch (param.in) {
                case 'query':
                  request.params.push({
                    key: param.name,
                    value: param.default || param.example || '', // Use default if available
                    description: param.description || '',
                    enabled: param.required === true,
                  });
                  break;
                case 'header':
                  request.headers.push({
                    key: param.name,
                    value: param.default || param.example || '', // Use default if available
                    description: param.description || '',
                    enabled: param.required === true,
                  });
                  break;
                case 'path':
                  // Path parameters are typically processed from the path string itself earlier.
                  // This case is a placeholder if additional schema info for path params is needed here.
                  break;
                case 'formData':
                  // Basic handling for formData. A more robust solution might be needed for file uploads or complex forms.
                  if (!request.body.content || request.body.content === '{}' || request.body.content === '') {
                    request.body.contentType = operation.consumes && operation.consumes.includes('multipart/form-data') ? 'multipart/form-data' : 'application/x-www-form-urlencoded';
                    request.body.content = `${param.name}=${param.default || param.example || ''}`; 
                  } else if (typeof request.body.content === 'string' && request.body.content.includes('=')) {
                    request.body.content += `&${param.name}=${param.default || param.example || ''}`;
                  }
                  console.log(`FormData param: ${param.name}, type: ${param.type}`);
                  break;
                case 'body': // Swagger 2.0 body parameter
                  if (param.schema) {
                    request.body.contentType = operation.consumes && operation.consumes.length > 0 ? operation.consumes[0] : 'application/json'; // Use consumes or default to JSON
                    try {
                      // Generate example from schema, passing definitions for resolving $refs
                      console.log(`Generating body example for ${method.toUpperCase()} ${path} using schema:`, param.schema);
                      const example = generateSwaggerExample(param.schema, swaggerJson.definitions);
                      request.body.content = JSON.stringify(example, null, 2);
                      console.log(`Generated body example for ${method.toUpperCase()} ${path}:`, request.body.content);
                    } catch (e) {
                      console.error('Failed to generate example for body schema for Swagger 2.0', e);
                      request.body.content = '{}'; // Fallback
                    }
                  }
                  break;
              }
            });

            // Handle OpenAPI 3.0 request bodies (which are outside parameters array)
            if (operation.requestBody && typeof operation.requestBody === 'object') {
              console.log(`Processing OpenAPI 3.0 request body for ${method.toUpperCase()} ${path}`);
              const content = operation.requestBody.content;
              
              if (content) {
                // Try application/json first, then fall back to other content types
                const contentType = content['application/json'] ? 'application/json' : 
                                   Object.keys(content)[0] || 'application/json';
                
                request.body.contentType = contentType;
                
                if (content[contentType] && content[contentType].schema) {
                  try {
                    console.log(`Generating body example for OpenAPI 3.0 ${method.toUpperCase()} ${path} using schema:`, content[contentType].schema);
                    // For OpenAPI 3.0, schemas are in components.schemas
                    const example = generateSwaggerExample(content[contentType].schema, swaggerJson.components?.schemas);
                    request.body.content = JSON.stringify(example, null, 2);
                    console.log(`Generated body example for OpenAPI 3.0 ${method.toUpperCase()} ${path}:`, request.body.content);
                  } catch (e) {
                    console.error('Failed to generate example for OpenAPI 3.0 body schema', e);
                    request.body.content = '{}'; // Fallback
                  }
                }
              }
            }

            // Add to requests array
            requests.push(request);
            pushedRequestsCount++;
            console.log(`[SwaggerImport] Pushed request: ${request.name}. Total pushed so far: ${pushedRequestsCount}`);
          }
        });
      });
      
      // Check if any requests were actually generated
      if (requests.length === 0) {
        console.error("No requests were generated from the Swagger/OpenAPI specification. Check the parsing logic and the input file.");
        throw new Error('No API endpoints were generated from the specification. Collection will not be added.');
      }
      
      // Assign the requests to the collection
      newCollection.requests = requests;
      console.log(`[SwaggerImport] Created collection with ${requests.length} requests:`, newCollection);

      // Add the new collection to state
      setCollections((prev: APICollection[]) => {
        const updated = [...prev, newCollection];
        console.log('[SwaggerImport] Updated collections:', updated);
        return updated;
      });
      
      // Select the newly created collection
      setSelectedCollectionId(collectionId);
      
// Select the first request from the collection if available
if (requests.length > 0) {
setCurrentRequest({...requests[0]});
setSelectedRequest(requests[0]);
}
      
// Create environment with baseUrl
let baseUrl = '';
if (swaggerJson.servers && swaggerJson.servers.length > 0) {
// OpenAPI 3.0 format
baseUrl = swaggerJson.servers[0].url;
console.log('[SwaggerImport] Using OpenAPI 3.0 server URL:', baseUrl);
} else {
// Swagger 2.0 format
if (swaggerJson.host) {
const scheme = swaggerJson.schemes && swaggerJson.schemes.length > 0 ? swaggerJson.schemes[0] : 'https';
baseUrl = `${scheme}://${swaggerJson.host}${swaggerJson.basePath || ''}`;
console.log('[SwaggerImport] Using Swagger 2.0 host and basePath:', baseUrl);
} else {
// Default to petstore if no host is specified
baseUrl = 'https://petstore.swagger.io/v2';
console.log('[SwaggerImport] Using default baseUrl:', baseUrl);
}
}
      
const newEnv: APIEnvironment = {
id: 'env_' + Date.now(),
name: `${swaggerJson.info?.title || 'API'} Environment`,
variables: [
{
key: 'baseUrl',
value: baseUrl,
description: 'Base URL for the API',
enabled: true
}
],
isActive: true
};
      
      // Add the new environment to state
      setEnvironments((prev: APIEnvironment[]) => {
        const updated = [...prev, newEnv];
        console.log('[SwaggerImport] Added new environment:', newEnv.name);
        return updated;
      });
      
      // Set the new environment as active
      setActiveEnvironmentId(newEnv.id);
      
      // Close the import modal
      setShowImportModal(false);
      
      // Show success message
      alert(`Successfully imported ${requests.length} API endpoints from ${swaggerJson.info?.title || 'API'}.`);
    } catch (error: any) { // Type assertion to avoid TypeScript error
      console.error('[SwaggerImport] Error processing Swagger specification:', error);
      alert(`Failed to import Swagger/OpenAPI specification. ${error?.message || 'Please check the format and try again.'}`);
      setShowImportModal(false);
    }
  };

  // Function to handle import from Postman
  const handleImportFromPostman = (postmanJson: any) => {
    try {
      // Create a new collection from Postman
      const newCollection: APICollection = {
        id: 'col_' + Date.now(),
        name: postmanJson.info?.name || 'Imported Collection',
        description: postmanJson.info?.description || '',
        requests: []
      };
      
      // Process requests
      const processItems = (items: any[]) => {
        items.forEach(item => {
          if (item.request) {
            // This is a request
            const request: APIRequest = {
              id: 'req_' + Date.now() + Math.random().toString(36).substring(2, 9),
              name: item.name || 'Unnamed Request',
              method: item.request.method || 'GET',
              url: typeof item.request.url === 'string' ? item.request.url : item.request.url.raw || '',
              headers: (item.request.header || []).map((h: any) => ({
                key: h.key,
                value: h.value,
                description: h.description || '',
                enabled: !h.disabled
              })),
              params: [],
              body: {
                contentType: 'application/json',
                content: ''
              },
              auth: {
                type: 'none',
                credentials: {}
              }
            };
            
            // Process URL query params
            if (item.request.url && item.request.url.query) {
              request.params = item.request.url.query.map((q: any) => ({
                key: q.key,
                value: q.value,
                description: q.description || '',
                enabled: !q.disabled
              }));
            }
            
            // Process body
            if (item.request.body) {
              if (item.request.body.mode === 'raw' && item.request.body.raw) {
                request.body.content = item.request.body.raw;
                if (item.request.body.options && item.request.body.options.raw && item.request.body.options.raw.language === 'json') {
                  request.body.contentType = 'application/json';
                }
              } else if (item.request.body.mode === 'urlencoded' && item.request.body.urlencoded) {
                request.body.contentType = 'application/x-www-form-urlencoded';
                const formData: Record<string, string> = {};
                item.request.body.urlencoded.forEach((param: any) => {
                  if (!param.disabled) {
                    formData[param.key] = param.value;
                  }
                });
                request.body.content = JSON.stringify(formData, null, 2);
              }
            }
            
            // Process auth
            if (item.request.auth) {
              if (item.request.auth.type === 'basic') {
                request.auth = {
                  type: 'basic',
                  credentials: {
                    username: item.request.auth.basic.find((a: any) => a.key === 'username')?.value || '',
                    password: item.request.auth.basic.find((a: any) => a.key === 'password')?.value || ''
                  }
                };
              } else if (item.request.auth.type === 'bearer') {
                request.auth = {
                  type: 'bearer',
                  credentials: {
                    token: item.request.auth.bearer.find((a: any) => a.key === 'token')?.value || ''
                  }
                };
              } else if (item.request.auth.type === 'apikey') {
                request.auth = {
                  type: 'apiKey',
                  credentials: {
                    key: item.request.auth.apikey.find((a: any) => a.key === 'key')?.value || '',
                    value: item.request.auth.apikey.find((a: any) => a.key === 'value')?.value || '',
                    in: item.request.auth.apikey.find((a: any) => a.key === 'in')?.value || 'header'
                  }
                };
              }
            }
            
            // Add to collection
            newCollection.requests.push(request);
          } else if (item.item) {
            // This is a folder, process recursively
            processItems(item.item);
          }
        });
      };
      
      if (postmanJson.item) {
        processItems(postmanJson.item);
      }
      
      // Add the new collection
      setCollections(prev => [...prev, newCollection]);
      
      // Import environments if available
      if (postmanJson.variable) {
        const newEnv: APIEnvironment = {
          id: 'env_' + Date.now(),
          name: `${postmanJson.info?.name || 'Postman'} Environment`,
          variables: postmanJson.variable.map((v: any) => ({
            key: v.key,
            value: v.value,
            description: v.description || '',
            enabled: true
          })),
          isActive: false
        };
        
        setEnvironments((prev: APIEnvironment[]) => [...prev, newEnv]);
      }
    } catch (error) {
      console.error('Failed to import Postman collection', error);
      alert('Failed to import Postman collection. Please check the format and try again.');
    }
  };

  // Helper function to generate example from JSON Schema
  const generateExampleFromSchema = (schema: any): any => {
    if (!schema) return {};
    
    if (schema.example) return schema.example;
    
    if (schema.type === 'object') {
      const result: Record<string, any> = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
          result[key] = generateExampleFromSchema(prop);
        });
      }
      return result;
    } else if (schema.type === 'array') {
      if (schema.items) {
        return [generateExampleFromSchema(schema.items)];
      }
      return [];
    } else if (schema.type === 'string') {
      return schema.default || 'string';
    } else if (schema.type === 'number' || schema.type === 'integer') {
      return schema.default || 0;
    } else if (schema.type === 'boolean') {
      return schema.default || false;
    }
    
    return {};
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">API Testing</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors mr-2"
          >
            <FiUpload className="mr-1" />
            Import
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            <FiDownload className="mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Left Panel - Collections */}
        <div className="w-full lg:w-1/4 bg-gray-800 rounded-lg p-4">
          <CollectionPanel 
            collections={collections} 
            setCurrentRequest={setCurrentRequest}
          />
        </div>
        
        {/* Right Panel - Request/Response */}
        <div className="w-full lg:w-3/4 bg-gray-800 rounded-lg p-4 flex flex-col">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'request' | 'response' | 'tests' | 'environment' | 'testChain' | 'mockServer' | 'security' | 'performance')} defaultValue={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="request" className="flex items-center">
                <FiSend className="mr-2" />
                Request
              </TabsTrigger>
              <TabsTrigger value="response" className="flex items-center">
                <FiCode className="mr-2" />
                Response
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex items-center">
                <FiLayers className="mr-2" />
                Tests
              </TabsTrigger>
              <TabsTrigger value="environment" className="flex items-center">
                <FiSettings className="mr-2" />
                Environment
              </TabsTrigger>
              <TabsTrigger value="testChain" className="flex items-center">
                <FiLink className="mr-2" />
                Test Chain
              </TabsTrigger>
              <TabsTrigger value="mockServer" className="flex items-center">
                <FiServer className="mr-2" />
                Mock Server
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center">
                <FiShield className="mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center">
                <FiBarChart2 className="mr-2" />
                Performance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="request">
              <RequestPanel 
                request={currentRequest} 
                setRequest={setCurrentRequest}
                sendRequest={sendRequest}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="response">
              <ResponsePanel 
                response={currentResponse}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="tests">
              <TestsPanel 
                tests={tests}
                setTests={setTests}
                response={currentResponse}
              />
            </TabsContent>
            
            <TabsContent value="environment">
              <EnvironmentPanel 
                environments={environments}
                setEnvironments={setEnvironments}
              />
            </TabsContent>
            
            <TabsContent value="testChain">
              <TestChainBuilder
                collections={collections as any} // Type cast to avoid collection type mismatch
                testChains={testChains}
                setTestChains={setTestChains}
                onRunChain={async (chainId: string) => {
                  // Find the test chain by ID
                  const chain = testChains.find(c => c.id === chainId);
                  if (!chain) {
                    console.error(`Test chain with ID ${chainId} not found`);
                    return;
                  }
                  
                  // Execute the chain (simplified implementation)
                  console.log(`Running test chain: ${chain.name}`);
                  // Full implementation would execute steps in sequence
                }}
              />
            </TabsContent>

            <TabsContent value="mockServer">
              <MockServerPanel 
                mockServers={mockServers}
                setMockServers={setMockServers}
              />
            </TabsContent>

            <TabsContent value="security">
              <SecurityTestingPanel 
                securityTests={securityTests}
                setSecurityTests={setSecurityTests}
              />
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceTestPanel 
                performanceTests={performanceTests}
                setPerformanceTests={setPerformanceTests}
                apiRequests={collections.flatMap(c => c.requests || [])} // Flatten all requests from collections
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Import Modal */}
      {showImportModal && (
        <ImportPanel 
          onClose={() => setShowImportModal(false)}
          onImportSwagger={handleImportFromSwagger}
          onImportPostman={handleImportFromPostman}
        />
      )}
    </div>
  );
}
