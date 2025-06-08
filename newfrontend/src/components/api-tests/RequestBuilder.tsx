'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSend, FiChevronDown, FiChevronUp, FiLock, FiUnlock } from 'react-icons/fi';
import { APIRequest, KeyValuePair, Environment, AuthConfig } from './types';
import { processEnvironmentVariables } from './EnvironmentManager';

interface RequestBuilderProps {
  request: APIRequest;
  onRequestChange: (request: APIRequest) => void;
  onSendRequest: () => void;
  isSending: boolean;
  activeEnvironment: Environment | null;
}

export default function RequestBuilder({
  request,
  onRequestChange,
  onSendRequest,
  isSending,
  activeEnvironment,
}: RequestBuilderProps) {
  const [showHeaders, setShowHeaders] = useState(true);
  const [showParams, setShowParams] = useState(true);
  const [showBody, setShowBody] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  // For new header/param entries
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamValue, setNewParamValue] = useState('');
  
  // Update URL with query parameters
  useEffect(() => {
    if (!request.url) return;
    
    try {
      const url = new URL(processEnvironmentVariables(request.url, activeEnvironment));
      
      // Clear existing query parameters
      url.search = '';
      
      // Add query parameters
      request.params.forEach(param => {
        if (param.key && param.enabled !== false) {
          const value = processEnvironmentVariables(param.value, activeEnvironment);
          url.searchParams.append(param.key, value);
        }
      });
      
      // Only update if the URL has changed (ignoring query params)
      const newUrlWithParams = url.toString();
      const currentUrlBase = request.url.split('?')[0];
      const newUrlBase = newUrlWithParams.split('?')[0];
      
      if (currentUrlBase !== newUrlBase) {
        // URL base has changed, update the whole URL
        onRequestChange({
          ...request,
          url: newUrlWithParams
        });
      } else if (request.url !== newUrlWithParams) {
        // Only query params have changed, update the URL
        onRequestChange({
          ...request,
          url: newUrlWithParams
        });
      }
    } catch (error) {
      // Invalid URL, do nothing
    }
  }, [request.params, request.url, activeEnvironment]);
  
  // Handle URL change
  const handleUrlChange = (url: string) => {
    onRequestChange({
      ...request,
      url
    });
    
    // Extract query parameters from URL
    try {
      const urlObj = new URL(url);
      const params: KeyValuePair[] = [];
      
      // Keep existing params that aren't in the URL
      const existingParamKeys = new Set(request.params.map(p => p.key));
      
      // Add params from URL
      urlObj.searchParams.forEach((value, key) => {
        params.push({ key, value, enabled: true });
        existingParamKeys.delete(key);
      });
      
      // Add back existing params that weren't in the URL
      request.params.forEach(param => {
        if (existingParamKeys.has(param.key)) {
          params.push(param);
        }
      });
      
      onRequestChange({
        ...request,
        params
      });
    } catch (error) {
      // Invalid URL, do nothing
    }
  };
  
  // Handle method change
  const handleMethodChange = (method: string) => {
    onRequestChange({
      ...request,
      method
    });
  };
  
  // Add a new header
  const handleAddHeader = () => {
    if (!newHeaderKey.trim()) return;
    
    onRequestChange({
      ...request,
      headers: [
        ...request.headers,
        { key: newHeaderKey, value: newHeaderValue, enabled: true }
      ]
    });
    
    setNewHeaderKey('');
    setNewHeaderValue('');
  };
  
  // Update a header
  const handleUpdateHeader = (index: number, key: string, value: string, enabled: boolean) => {
    const updatedHeaders = [...request.headers];
    updatedHeaders[index] = { key, value, enabled };
    
    onRequestChange({
      ...request,
      headers: updatedHeaders
    });
  };
  
  // Delete a header
  const handleDeleteHeader = (index: number) => {
    const updatedHeaders = [...request.headers];
    updatedHeaders.splice(index, 1);
    
    onRequestChange({
      ...request,
      headers: updatedHeaders
    });
  };
  
  // Add a new query parameter
  const handleAddParam = () => {
    if (!newParamKey.trim()) return;
    
    onRequestChange({
      ...request,
      params: [
        ...request.params,
        { key: newParamKey, value: newParamValue, enabled: true }
      ]
    });
    
    setNewParamKey('');
    setNewParamValue('');
  };
  
  // Update a query parameter
  const handleUpdateParam = (index: number, key: string, value: string, enabled: boolean) => {
    const updatedParams = [...request.params];
    updatedParams[index] = { key, value, enabled };
    
    onRequestChange({
      ...request,
      params: updatedParams
    });
  };
  
  // Delete a query parameter
  const handleDeleteParam = (index: number) => {
    const updatedParams = [...request.params];
    updatedParams.splice(index, 1);
    
    onRequestChange({
      ...request,
      params: updatedParams
    });
  };
  
  // Handle body content type change
  const handleContentTypeChange = (contentType: string) => {
    onRequestChange({
      ...request,
      contentType
    });
  };
  
  // Handle body content change
  const handleBodyChange = (body: string) => {
    onRequestChange({
      ...request,
      body
    });
  };
  
  // Handle auth type change
  const handleAuthTypeChange = (type: string) => {
    const newAuth: AuthConfig = { type };
    
    // Set default values based on auth type
    switch (type) {
      case 'basic':
        newAuth.username = '';
        newAuth.password = '';
        break;
      case 'bearer':
        newAuth.token = '';
        break;
      case 'apiKey':
        newAuth.key = '';
        newAuth.value = '';
        newAuth.addTo = 'header';
        break;
      case 'oauth2':
        newAuth.token = '';
        break;
      case 'digest':
        newAuth.username = '';
        newAuth.password = '';
        break;
    }
    
    onRequestChange({
      ...request,
      auth: newAuth
    });
  };
  
  // Handle auth config change
  const handleAuthConfigChange = (config: Partial<AuthConfig>) => {
    onRequestChange({
      ...request,
      auth: {
        ...request.auth,
        ...config
      }
    });
  };
  
  // Render auth form based on auth type
  const renderAuthForm = () => {
    if (!request.auth) return null;
    
    switch (request.auth.type) {
      case 'basic':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Username</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                value={request.auth.username || ''}
                onChange={(e) => handleAuthConfigChange({ username: e.target.value })}
                placeholder="Username"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Password</label>
              <input
                type="password"
                className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                value={request.auth.password || ''}
                onChange={(e) => handleAuthConfigChange({ password: e.target.value })}
                placeholder="Password"
              />
            </div>
          </div>
        );
      
      case 'bearer':
        return (
          <div>
            <label className="block text-gray-400 text-sm mb-1">Token</label>
            <input
              type="text"
              className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
              value={request.auth.token || ''}
              onChange={(e) => handleAuthConfigChange({ token: e.target.value })}
              placeholder="Bearer token"
            />
          </div>
        );
      
      case 'apiKey':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Key</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                value={request.auth.key || ''}
                onChange={(e) => handleAuthConfigChange({ key: e.target.value })}
                placeholder="API key name"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Value</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                value={request.auth.value || ''}
                onChange={(e) => handleAuthConfigChange({ value: e.target.value })}
                placeholder="API key value"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Add to</label>
              <select
                className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                value={request.auth.addTo || 'header'}
                onChange={(e) => handleAuthConfigChange({ addTo: e.target.value as 'header' | 'query' })}
              >
                <option value="header">Header</option>
                <option value="query">Query Parameter</option>
              </select>
            </div>
          </div>
        );
      
      case 'oauth2':
        return (
          <div>
            <label className="block text-gray-400 text-sm mb-1">Access Token</label>
            <input
              type="text"
              className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
              value={request.auth.token || ''}
              onChange={(e) => handleAuthConfigChange({ token: e.target.value })}
              placeholder="OAuth2 access token"
            />
          </div>
        );
      
      case 'digest':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Username</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                value={request.auth.username || ''}
                onChange={(e) => handleAuthConfigChange({ username: e.target.value })}
                placeholder="Username"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Password</label>
              <input
                type="password"
                className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                value={request.auth.password || ''}
                onChange={(e) => handleAuthConfigChange({ password: e.target.value })}
                placeholder="Password"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* URL and Method */}
      <div className="flex mb-4">
        <select
          className="bg-gray-700 text-white rounded-l-md border-r border-gray-600 px-3 py-2 text-sm w-28"
          value={request.method}
          onChange={(e) => handleMethodChange(e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="HEAD">HEAD</option>
          <option value="OPTIONS">OPTIONS</option>
        </select>
        <input
          type="text"
          className="flex-grow bg-gray-700 text-white border-l border-gray-600 px-3 py-2 text-sm"
          placeholder="Enter URL"
          value={request.url}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
        <button
          className={`bg-blue-600 text-white rounded-r-md px-4 py-2 text-sm flex items-center ${
            isSending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
          onClick={onSendRequest}
          disabled={isSending}
        >
          <FiSend className="mr-2" />
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      {/* Request Sections */}
      <div className="flex-grow overflow-y-auto space-y-4">
        {/* Auth Section */}
        <div className="bg-gray-800 rounded-md">
          <div
            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700 rounded-t-md"
            onClick={() => setShowAuth(!showAuth)}
          >
            <div className="flex items-center">
              <FiLock className="mr-2 text-gray-400" />
              <h3 className="text-white font-medium">Authorization</h3>
              {request.auth && request.auth.type !== 'none' && (
                <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                  {request.auth.type}
                </span>
              )}
            </div>
            {showAuth ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          
          {showAuth && (
            <div className="p-4 border-t border-gray-700">
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Type</label>
                <select
                  className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                  value={request.auth?.type || 'none'}
                  onChange={(e) => handleAuthTypeChange(e.target.value)}
                >
                  <option value="none">No Auth</option>
                  <option value="basic">Basic Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apiKey">API Key</option>
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="digest">Digest Auth</option>
                </select>
              </div>
              
              {renderAuthForm()}
            </div>
          )}
        </div>
        
        {/* Headers Section */}
        <div className="bg-gray-800 rounded-md">
          <div
            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700 rounded-t-md"
            onClick={() => setShowHeaders(!showHeaders)}
          >
            <div className="flex items-center">
              <h3 className="text-white font-medium">Headers</h3>
              <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                {request.headers.filter(h => h.enabled !== false).length}
              </span>
            </div>
            {showHeaders ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          
          {showHeaders && (
            <div className="p-4 border-t border-gray-700">
              {/* Add Header Form */}
              <div className="grid grid-cols-12 gap-2 mb-4">
                <div className="col-span-5">
                  <input
                    type="text"
                    className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                    placeholder="Header Name"
                    value={newHeaderKey}
                    onChange={(e) => setNewHeaderKey(e.target.value)}
                  />
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                    placeholder="Value"
                    value={newHeaderValue}
                    onChange={(e) => setNewHeaderValue(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <button
                    className="w-full bg-blue-600 text-white rounded-md px-3 py-2 text-sm flex items-center justify-center"
                    onClick={handleAddHeader}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
              
              {/* Headers List */}
              <div className="space-y-2">
                {request.headers.map((header, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input
                        type="text"
                        className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                        value={header.key}
                        onChange={(e) => handleUpdateHeader(index, e.target.value, header.value, header.enabled !== false)}
                        placeholder="Header Name"
                      />
                    </div>
                    <div className="col-span-5">
                      <input
                        type="text"
                        className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                        value={header.value}
                        onChange={(e) => handleUpdateHeader(index, header.key, e.target.value, header.enabled !== false)}
                        placeholder="Value"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={header.enabled !== false}
                        onChange={(e) => handleUpdateHeader(index, header.key, header.value, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        className="w-full bg-red-600 text-white rounded-md px-3 py-2 text-sm flex items-center justify-center"
                        onClick={() => handleDeleteHeader(index)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
                
                {request.headers.length === 0 && (
                  <div className="text-gray-400 text-center py-2">
                    No headers added
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Query Params Section */}
        <div className="bg-gray-800 rounded-md">
          <div
            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700 rounded-t-md"
            onClick={() => setShowParams(!showParams)}
          >
            <div className="flex items-center">
              <h3 className="text-white font-medium">Query Parameters</h3>
              <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                {request.params.filter(p => p.enabled !== false).length}
              </span>
            </div>
            {showParams ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          
          {showParams && (
            <div className="p-4 border-t border-gray-700">
              {/* Add Param Form */}
              <div className="grid grid-cols-12 gap-2 mb-4">
                <div className="col-span-5">
                  <input
                    type="text"
                    className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                    placeholder="Parameter Name"
                    value={newParamKey}
                    onChange={(e) => setNewParamKey(e.target.value)}
                  />
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                    placeholder="Value"
                    value={newParamValue}
                    onChange={(e) => setNewParamValue(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <button
                    className="w-full bg-blue-600 text-white rounded-md px-3 py-2 text-sm flex items-center justify-center"
                    onClick={handleAddParam}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
              
              {/* Params List */}
              <div className="space-y-2">
                {request.params.map((param, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input
                        type="text"
                        className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                        value={param.key}
                        onChange={(e) => handleUpdateParam(index, e.target.value, param.value, param.enabled !== false)}
                        placeholder="Parameter Name"
                      />
                    </div>
                    <div className="col-span-5">
                      <input
                        type="text"
                        className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                        value={param.value}
                        onChange={(e) => handleUpdateParam(index, param.key, e.target.value, param.enabled !== false)}
                        placeholder="Value"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={param.enabled !== false}
                        onChange={(e) => handleUpdateParam(index, param.key, param.value, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        className="w-full bg-red-600 text-white rounded-md px-3 py-2 text-sm flex items-center justify-center"
                        onClick={() => handleDeleteParam(index)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
                
                {request.params.length === 0 && (
                  <div className="text-gray-400 text-center py-2">
                    No parameters added
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Request Body Section */}
        <div className="bg-gray-800 rounded-md">
          <div
            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700 rounded-t-md"
            onClick={() => setShowBody(!showBody)}
          >
            <div className="flex items-center">
              <h3 className="text-white font-medium">Request Body</h3>
              {!['GET', 'HEAD'].includes(request.method) && request.body && (
                <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                  {request.contentType || 'none'}
                </span>
              )}
            </div>
            {showBody ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          
          {showBody && !['GET', 'HEAD'].includes(request.method) && (
            <div className="p-4 border-t border-gray-700">
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Content Type</label>
                <select
                  className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                  value={request.contentType || 'application/json'}
                  onChange={(e) => handleContentTypeChange(e.target.value)}
                >
                  <option value="application/json">JSON</option>
                  <option value="application/xml">XML</option>
                  <option value="application/x-www-form-urlencoded">Form URL Encoded</option>
                  <option value="multipart/form-data">Form Data</option>
                  <option value="text/plain">Plain Text</option>
                  <option value="text/html">HTML</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Body</label>
                <textarea
                  className="w-full bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm font-mono h-48"
                  value={request.body || ''}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder={
                    request.contentType === 'application/json'
                      ? '{\n  "key": "value"\n}'
                      : request.contentType === 'application/xml'
                      ? '<root>\n  <element>value</element>\n</root>'
                      : 'Enter request body'
                  }
                />
              </div>
            </div>
          )}
          
          {showBody && ['GET', 'HEAD'].includes(request.method) && (
            <div className="p-4 border-t border-gray-700">
              <div className="text-gray-400 text-center py-2">
                {request.method} requests do not have a request body
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
