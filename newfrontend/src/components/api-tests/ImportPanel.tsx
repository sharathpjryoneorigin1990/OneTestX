'use client';

import React, { useState, useRef } from 'react';
import { FiX, FiUpload, FiLink } from 'react-icons/fi';
import yaml from 'js-yaml';

interface ImportPanelProps {
  onClose: () => void;
  onImportSwagger: (data: any) => void;
  onImportPostman: (data: any) => void;
}

export default function ImportPanel({ onClose, onImportSwagger, onImportPostman }: ImportPanelProps) {
  const [importType, setImportType] = useState<'swagger' | 'postman'>('swagger');
  const [importMethod, setImportMethod] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError('');
    setIsLoading(true);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        console.log('[ImportPanel] File content length:', content.length);
        console.log('[ImportPanel] File content preview:', content.substring(0, 200) + '...');
        
        // Try to parse as JSON first, if that fails try YAML
        let data;
        try {
          data = JSON.parse(content);
          console.log('[ImportPanel] Successfully parsed as JSON');
        } catch (jsonError) {
          console.log('[ImportPanel] JSON parsing failed, trying YAML');
          try {
            data = yaml.load(content);
            console.log('[ImportPanel] Successfully parsed as YAML');
          } catch (yamlError) {
            console.error('[ImportPanel] Failed to parse as YAML:', yamlError);
            throw new Error('Failed to parse file as JSON or YAML');
          }
        }
        
        console.log('[ImportPanel] Parsed data keys:', Object.keys(data));
        
        if (importType === 'swagger') {
          console.log('[ImportPanel] Swagger import - paths exist:', !!data.paths);
          if (data.paths) {
            console.log('[ImportPanel] Swagger paths keys:', Object.keys(data.paths));
          } else {
            // Check if this might be a nested structure
            for (const key of Object.keys(data)) {
              if (data[key] && typeof data[key] === 'object' && data[key].paths) {
                console.log(`[ImportPanel] Found paths in nested property '${key}'`);
                // Use the nested object instead
                data = data[key];
                break;
              }
            }
          }
          onImportSwagger(data);
        } else {
          onImportPostman(data);
        }
        
        onClose();
      } catch (error) {
        console.error('Failed to parse file', error);
        setError('Failed to parse file. Please make sure it is a valid JSON file.');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const handleUrlImport = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Use a proxy to avoid CORS issues
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      // Try to get the response as text first to handle both JSON and YAML
      const responseText = await response.text();
      console.log('[ImportPanel] URL import response text length:', responseText.length);
      console.log('[ImportPanel] URL import response text preview:', responseText.substring(0, 200) + '...');
      
      // Try to parse as JSON first, if that fails try YAML
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[ImportPanel] URL response successfully parsed as JSON');
      } catch (jsonError) {
        console.log('[ImportPanel] URL JSON parsing failed, trying YAML');
        try {
          data = yaml.load(responseText);
          console.log('[ImportPanel] URL response successfully parsed as YAML');
        } catch (yamlError) {
          console.error('[ImportPanel] Failed to parse URL response as YAML:', yamlError);
          throw new Error('Failed to parse response as JSON or YAML');
        }
      }
      
      console.log('[ImportPanel] URL import response data keys:', Object.keys(data));
      
      if (importType === 'swagger') {
        console.log('[ImportPanel] Swagger URL import - paths exist:', !!data.paths);
        if (data.paths) {
          console.log('[ImportPanel] Swagger paths keys from URL:', Object.keys(data.paths));
        } else {
          console.log('[ImportPanel] No paths found in Swagger URL import');
          // Check if this might be a nested structure (some APIs return the spec in a property)
          for (const key of Object.keys(data)) {
            if (data[key] && typeof data[key] === 'object' && data[key].paths) {
              console.log(`[ImportPanel] Found paths in nested property '${key}'`);
              // Use the nested object instead
              data = data[key];
              break;
            }
          }
          
          // If still no paths, check if this might be a Swagger 2.0 spec with a different structure
          if (!data.paths && data.swagger === '2.0' && data.basePath && data.definitions) {
            console.log('[ImportPanel] This appears to be a Swagger 2.0 spec with a non-standard structure');
            // Try to reconstruct a valid Swagger object
            if (!data.paths && data.apis) {
              console.log('[ImportPanel] Found apis array, trying to construct paths object');
              const paths: Record<string, Record<string, any>> = {};
              data.apis.forEach((api: any) => {
                if (api.path && api.operations) {
                  paths[api.path] = {};
                  api.operations.forEach((op: any) => {
                    if (op.method) {
                      paths[api.path][op.method.toLowerCase()] = op;
                    }
                  });
                }
              });
              if (Object.keys(paths).length > 0) {
                data.paths = paths;
                console.log('[ImportPanel] Successfully constructed paths object:', Object.keys(paths));
              }
            }
          }
        }
        onImportSwagger(data);
      } else {
        onImportPostman(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to fetch from URL', error);
      setError('Failed to fetch from URL. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Import Collection</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* Import Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Import Type</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setImportType('swagger')}
              className={`px-4 py-2 rounded-md ${
                importType === 'swagger' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Swagger/OpenAPI
            </button>
            <button
              onClick={() => setImportType('postman')}
              className={`px-4 py-2 rounded-md ${
                importType === 'postman' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Postman Collection
            </button>
          </div>
        </div>
        
        {/* Import Method Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Import Method</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setImportMethod('file')}
              className={`px-4 py-2 rounded-md ${
                importMethod === 'file' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              File Upload
            </button>
            <button
              onClick={() => setImportMethod('url')}
              className={`px-4 py-2 rounded-md ${
                importMethod === 'url' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              URL
            </button>
          </div>
        </div>
        
        {/* File Upload */}
        {importMethod === 'file' && (
          <div className="mb-4">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-gray-600 rounded-md flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
              disabled={isLoading}
            >
              <FiUpload size={32} className="text-gray-400 mb-2" />
              <span className="text-gray-300">
                {isLoading ? 'Uploading...' : 'Click to upload JSON file'}
              </span>
            </button>
          </div>
        )}
        
        {/* URL Input */}
        {importMethod === 'url' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {importType === 'swagger' ? 'Swagger/OpenAPI URL' : 'Postman Collection URL'}
            </label>
            <div className="flex">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={`Enter ${importType === 'swagger' ? 'Swagger/OpenAPI' : 'Postman Collection'} URL`}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleUrlImport}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors flex items-center"
                disabled={isLoading}
              >
                <FiLink className="mr-2" />
                {isLoading ? 'Loading...' : 'Import'}
              </button>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {/* Help Text */}
        <div className="text-sm text-gray-400">
          {importType === 'swagger' ? (
            <p>Import a Swagger/OpenAPI specification to automatically generate API requests.</p>
          ) : (
            <p>Import a Postman Collection to bring in your existing API requests.</p>
          )}
        </div>
      </div>
    </div>
  );
}
