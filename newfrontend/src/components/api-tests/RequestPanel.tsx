'use client';

import React, { useState } from 'react';
import { FiSend, FiPlus, FiTrash2 } from 'react-icons/fi';

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

interface RequestPanelProps {
  request: APIRequest;
  setRequest: (request: APIRequest) => void;
  sendRequest: () => void;
  isLoading: boolean;
}

export default function RequestPanel({ request, setRequest, sendRequest, isLoading }: RequestPanelProps) {
  const [activeTab, setActiveTab] = useState('params');
  
  const handleMethodChange = (method: string) => {
    setRequest({ ...request, method });
  };
  
  const handleUrlChange = (url: string) => {
    setRequest({ ...request, url });
  };
  
  const handleNameChange = (name: string) => {
    setRequest({ ...request, name });
  };
  
  const handleAddParam = () => {
    setRequest({
      ...request,
      params: [
        ...request.params,
        { key: '', value: '', enabled: true }
      ]
    });
  };
  
  const handleParamChange = (index: number, field: 'key' | 'value' | 'description', value: string) => {
    const newParams = [...request.params];
    newParams[index] = { ...newParams[index], [field]: value };
    setRequest({ ...request, params: newParams });
  };
  
  const handleParamToggle = (index: number) => {
    const newParams = [...request.params];
    newParams[index] = { ...newParams[index], enabled: !newParams[index].enabled };
    setRequest({ ...request, params: newParams });
  };
  
  const handleRemoveParam = (index: number) => {
    const newParams = [...request.params];
    newParams.splice(index, 1);
    setRequest({ ...request, params: newParams });
  };
  
  const handleAddHeader = () => {
    setRequest({
      ...request,
      headers: [
        ...request.headers,
        { key: '', value: '', enabled: true }
      ]
    });
  };
  
  const handleHeaderChange = (index: number, field: 'key' | 'value' | 'description', value: string) => {
    const newHeaders = [...request.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setRequest({ ...request, headers: newHeaders });
  };
  
  const handleHeaderToggle = (index: number) => {
    const newHeaders = [...request.headers];
    newHeaders[index] = { ...newHeaders[index], enabled: !newHeaders[index].enabled };
    setRequest({ ...request, headers: newHeaders });
  };
  
  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...request.headers];
    newHeaders.splice(index, 1);
    setRequest({ ...request, headers: newHeaders });
  };
  
  const handleBodyContentTypeChange = (contentType: string) => {
    setRequest({
      ...request,
      body: {
        ...request.body,
        contentType
      }
    });
  };
  
  const handleBodyContentChange = (content: string) => {
    setRequest({
      ...request,
      body: {
        ...request.body,
        content
      }
    });
  };
  
  const handleAuthTypeChange = (type: string) => {
    let credentials = {};
    
    if (type === 'basic') {
      credentials = { username: '', password: '' };
    } else if (type === 'bearer') {
      credentials = { token: '' };
    } else if (type === 'apiKey') {
      credentials = { key: '', value: '', in: 'header' };
    }
    
    setRequest({
      ...request,
      auth: {
        type,
        credentials
      }
    });
  };
  
  const handleAuthCredentialChange = (field: string, value: string) => {
    setRequest({
      ...request,
      auth: {
        ...request.auth,
        credentials: {
          ...request.auth.credentials,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Request Name */}
      <div className="mb-4">
        <input
          type="text"
          value={request.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Request Name"
          className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* URL Bar */}
      <div className="flex mb-4">
        <select
          value={request.method}
          onChange={(e) => handleMethodChange(e.target.value)}
          className="bg-gray-700 text-white px-3 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-r border-gray-600"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
          <option value="HEAD">HEAD</option>
          <option value="OPTIONS">OPTIONS</option>
        </select>
        <input
          type="text"
          value={request.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Enter request URL"
          className="flex-1 bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendRequest}
          disabled={isLoading || !request.url}
          className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSend className="mr-2" />
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      {/* Tabs */}
      <div className="mb-4 border-b border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('params')}
            className={`px-4 py-2 ${activeTab === 'params' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Query Params
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-4 py-2 ${activeTab === 'headers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Headers
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`px-4 py-2 ${activeTab === 'body' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-4 py-2 ${activeTab === 'auth' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-white'}`}
          >
            Auth
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Query Params */}
        {activeTab === 'params' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-white">Query Parameters</h3>
              <button
                onClick={handleAddParam}
                className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
              >
                <FiPlus className="mr-1" />
                Add Parameter
              </button>
            </div>
            
            {request.params.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No parameters added yet
              </div>
            ) : (
              <div className="space-y-2">
                {request.params.map((param, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={() => handleParamToggle(index)}
                      className="bg-gray-700 rounded"
                    />
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={param.description || ''}
                      onChange={(e) => handleParamChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveParam(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Headers */}
        {activeTab === 'headers' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-white">Headers</h3>
              <button
                onClick={handleAddHeader}
                className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
              >
                <FiPlus className="mr-1" />
                Add Header
              </button>
            </div>
            
            {request.headers.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No headers added yet
              </div>
            ) : (
              <div className="space-y-2">
                {request.headers.map((header, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={() => handleHeaderToggle(index)}
                      className="bg-gray-700 rounded"
                    />
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={header.description || ''}
                      onChange={(e) => handleHeaderChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveHeader(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Body */}
        {activeTab === 'body' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
              <select
                value={request.body.contentType}
                onChange={(e) => handleBodyContentTypeChange(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="application/json">application/json</option>
                <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                <option value="text/plain">text/plain</option>
                <option value="application/xml">application/xml</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
              <textarea
                value={request.body.content}
                onChange={(e) => handleBodyContentChange(e.target.value)}
                placeholder={request.body.contentType === 'application/json' ? '{\n  "key": "value"\n}' : 'Enter request body'}
                className="w-full h-64 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        )}
        
        {/* Auth */}
        {activeTab === 'auth' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Authentication Type</label>
              <select
                value={request.auth.type}
                onChange={(e) => handleAuthTypeChange(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">No Auth</option>
                <option value="basic">Basic Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="apiKey">API Key</option>
              </select>
            </div>
            
            {request.auth.type === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={request.auth.credentials.username || ''}
                    onChange={(e) => handleAuthCredentialChange('username', e.target.value)}
                    placeholder="Username"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={request.auth.credentials.password || ''}
                    onChange={(e) => handleAuthCredentialChange('password', e.target.value)}
                    placeholder="Password"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            {request.auth.type === 'bearer' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token</label>
                <input
                  type="text"
                  value={request.auth.credentials.token || ''}
                  onChange={(e) => handleAuthCredentialChange('token', e.target.value)}
                  placeholder="Bearer Token"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {request.auth.type === 'apiKey' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Key</label>
                  <input
                    type="text"
                    value={request.auth.credentials.key || ''}
                    onChange={(e) => handleAuthCredentialChange('key', e.target.value)}
                    placeholder="API Key Name"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
                  <input
                    type="text"
                    value={request.auth.credentials.value || ''}
                    onChange={(e) => handleAuthCredentialChange('value', e.target.value)}
                    placeholder="API Key Value"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Added To</label>
                  <select
                    value={request.auth.credentials.in || 'header'}
                    onChange={(e) => handleAuthCredentialChange('in', e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="header">Header</option>
                    <option value="query">Query Parameter</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
