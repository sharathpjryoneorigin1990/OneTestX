'use client';

import React, { useState } from 'react';
import { FiDownload, FiCopy, FiCheck } from 'react-icons/fi';

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

interface APITest {
  id: string;
  name: string;
  script: string;
  enabled: boolean;
  result?: {
    passed: boolean;
    message?: string;
  };
}

interface APICollection {
  id: string;
  name: string;
  description?: string;
  requests: APIRequest[];
}

interface APIEnvironment {
  id: string;
  name: string;
  variables: KeyValuePair[];
  isActive: boolean;
}

interface ExportData {
  collections: APICollection[];
  environments: APIEnvironment[];
  tests: APITest[];
  currentRequest?: APIRequest;
}

interface ExportPanelProps {
  collections: APICollection[];
  environments: APIEnvironment[];
  tests: APITest[];
  currentRequest?: APIRequest;
}

export default function ExportPanel({ collections, environments, tests, currentRequest }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'postman'>('json');
  
  const handleExport = () => {
    const exportData: ExportData = {
      collections,
      environments,
      tests,
      currentRequest
    };
    
    let exportContent: string;
    let filename: string;
    
    if (exportFormat === 'json') {
      exportContent = JSON.stringify(exportData, null, 2);
      filename = 'api-tests-export.json';
    } else {
      // Convert to Postman Collection format
      const postmanCollection = convertToPostmanFormat(exportData);
      exportContent = JSON.stringify(postmanCollection, null, 2);
      filename = 'postman-collection.json';
    }
    
    // Create a blob and download it
    const blob = new Blob([exportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleCopyToClipboard = () => {
    const exportData: ExportData = {
      collections,
      environments,
      tests,
      currentRequest
    };
    
    const exportContent = JSON.stringify(exportData, null, 2);
    
    navigator.clipboard.writeText(exportContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const convertToPostmanFormat = (data: ExportData) => {
    // This is a simplified conversion - a real implementation would need to be more comprehensive
    return {
      info: {
        name: "Exported API Tests",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: data.collections.flatMap(collection => 
        collection.requests.map(request => ({
          name: request.name,
          request: {
            method: request.method,
            header: request.headers.filter(h => h.enabled).map(h => ({
              key: h.key,
              value: h.value,
              description: h.description
            })),
            url: {
              raw: request.url,
              protocol: request.url.startsWith('https') ? 'https' : 'http',
              host: request.url.replace(/^https?:\/\//, '').split('/')[0].split('.'),
              path: request.url.replace(/^https?:\/\/[^/]+/, '').split('?')[0].split('/').filter(Boolean),
              query: request.params.filter(p => p.enabled).map(p => ({
                key: p.key,
                value: p.value,
                description: p.description
              }))
            },
            body: request.body.content ? {
              mode: request.body.contentType.includes('json') ? 'raw' : 'text',
              raw: request.body.content,
              options: {
                raw: {
                  language: request.body.contentType.includes('json') ? 'json' : 'text'
                }
              }
            } : undefined,
            auth: request.auth.type !== 'none' ? {
              type: request.auth.type.toLowerCase(),
              [request.auth.type.toLowerCase()]: Object.entries(request.auth.credentials || {}).map(([key, value]) => ({
                key,
                value,
                type: 'string'
              }))
            } : undefined
          },
          event: tests.filter(test => test.enabled).map(test => ({
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: test.script.split('\n')
            }
          }))
        }))
      ),
      variable: data.environments.flatMap(env => 
        env.variables.filter(v => v.enabled).map(v => ({
          key: v.key,
          value: v.value,
          description: v.description,
          type: 'string'
        }))
      )
    };
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Export API Tests</h2>
      
      <div className="mb-6">
        <label className="block text-gray-300 mb-2">Export Format</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-500"
              name="exportFormat"
              value="json"
              checked={exportFormat === 'json'}
              onChange={() => setExportFormat('json')}
            />
            <span className="ml-2 text-white">JSON (Native)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-500"
              name="exportFormat"
              value="postman"
              checked={exportFormat === 'postman'}
              onChange={() => setExportFormat('postman')}
            />
            <span className="ml-2 text-white">Postman Collection</span>
          </label>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-2">Export Summary</h3>
        <div className="bg-gray-700 rounded-md p-4 text-gray-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1"><span className="font-medium">Collections:</span> {collections.length}</p>
              <p className="mb-1"><span className="font-medium">Requests:</span> {collections.reduce((sum, collection) => sum + collection.requests.length, 0)}</p>
            </div>
            <div>
              <p className="mb-1"><span className="font-medium">Environments:</span> {environments.length}</p>
              <p className="mb-1"><span className="font-medium">Tests:</span> {tests.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FiDownload className="mr-2" />
          Download {exportFormat === 'json' ? 'JSON' : 'Postman Collection'}
        </button>
        
        <button
          onClick={handleCopyToClipboard}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <>
              <FiCheck className="mr-2" />
              Copied!
            </>
          ) : (
            <>
              <FiCopy className="mr-2" />
              Copy to Clipboard
            </>
          )}
        </button>
      </div>
      
      <div className="mt-6 text-sm text-gray-400">
        <p>Note: The exported file will contain all your collections, environments, and tests.</p>
        <p>You can import this file back into the API Testing Suite or into Postman (if using Postman format).</p>
      </div>
    </div>
  );
}
