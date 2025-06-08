'use client';

import React, { useState, useEffect } from 'react';
import { FiCopy, FiDownload, FiClock, FiFileText, FiCheckCircle, FiAlertCircle, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface APIResponse {
  status: number;
  statusText: string;
  headers: { key: string; value: string }[];
  body: any;
  time?: number;
  size?: number;
  contentType?: string;
  error?: string;
}

interface ResponsePanelProps {
  response: APIResponse | null;
  isLoading: boolean;
}

export default function ResponsePanel({ response, isLoading }: ResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'info'>('body');
  const [formattedBody, setFormattedBody] = useState<string>('');
  const [syntaxLanguage, setSyntaxLanguage] = useState<string>('json');
  const [copySuccess, setCopySuccess] = useState(false);
  
  useEffect(() => {
    if (response?.body) {
      let formatted = '';
      let language = 'text';
      
      const contentType = response.contentType || '';
      
      if (typeof response.body === 'object') {
        formatted = JSON.stringify(response.body, null, 2);
        language = 'json';
      } else if (typeof response.body === 'string') {
        formatted = response.body;
        
        // Try to detect JSON
        if (contentType.includes('application/json') || 
            (formatted.trim().startsWith('{') && formatted.trim().endsWith('}')) || 
            (formatted.trim().startsWith('[') && formatted.trim().endsWith(']'))) {
          try {
            const parsed = JSON.parse(formatted);
            formatted = JSON.stringify(parsed, null, 2);
            language = 'json';
          } catch (e) {
            // Not valid JSON, keep as is
          }
        } else if (contentType.includes('text/html')) {
          language = 'html';
        } else if (contentType.includes('text/xml') || contentType.includes('application/xml')) {
          language = 'xml';
        } else if (contentType.includes('text/css')) {
          language = 'css';
        } else if (contentType.includes('text/javascript') || contentType.includes('application/javascript')) {
          language = 'javascript';
        }
      } else {
        formatted = String(response.body);
      }
      
      setFormattedBody(formatted);
      setSyntaxLanguage(language);
    }
  }, [response]);
  
  const handleCopyResponse = () => {
    if (!response) return;
    
    navigator.clipboard.writeText(formattedBody);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  
  const handleDownloadResponse = () => {
    if (!response) return;
    
    const contentType = response.contentType || 'application/json';
    const extension = getFileExtension(contentType);
    
    const blob = new Blob([formattedBody], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const getFileExtension = (contentType: string): string => {
    if (contentType.includes('application/json')) return 'json';
    if (contentType.includes('text/html')) return 'html';
    if (contentType.includes('text/xml') || contentType.includes('application/xml')) return 'xml';
    if (contentType.includes('text/css')) return 'css';
    if (contentType.includes('text/javascript') || contentType.includes('application/javascript')) return 'js';
    if (contentType.includes('text/plain')) return 'txt';
    return 'txt';
  };
  
  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'bg-green-900/50 text-green-300';
    if (status >= 300 && status < 400) return 'bg-yellow-900/50 text-yellow-300';
    if (status >= 400 && status < 500) return 'bg-red-900/50 text-red-300';
    if (status >= 500) return 'bg-purple-900/50 text-purple-300';
    return 'bg-gray-900/50 text-gray-300';
  };
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-32 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }
  
  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg mb-2">No response yet</p>
        <p className="text-sm">Send a request to see the response here</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div 
            className={`px-3 py-1 rounded-md mr-2 text-sm font-medium ${getStatusColor(response.status)}`}
          >
            {response.status} {response.statusText}
          </div>
          
          {response.time !== undefined && (
            <div className="flex items-center text-sm text-gray-400 mr-2">
              <FiClock className="mr-1" />
              {response.time} ms
            </div>
          )}
          
          {response.size !== undefined && (
            <div className="flex items-center text-sm text-gray-400">
              <FiFileText className="mr-1" />
              {formatBytes(response.size)}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCopyResponse}
            className="flex items-center px-2 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
          >
            {copySuccess ? (
              <>
                <FiCheckCircle className="mr-1 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <FiCopy className="mr-1" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownloadResponse}
            className="flex items-center px-2 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
          >
            <FiDownload className="mr-1" />
            Download
          </button>
        </div>
      </div>
      
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'body' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => setActiveTab('body')}
        >
          Body
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'headers' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => setActiveTab('headers')}
        >
          Headers
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'info' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
      </div>
      
      <div className="flex-grow overflow-auto">
        {activeTab === 'body' ? (
          <div className="bg-gray-900 rounded-md h-full overflow-auto">
            {response.error ? (
              <div className="p-4 bg-red-900/30 text-red-300 rounded-md">
                <div className="flex items-start">
                  <FiAlertCircle className="mr-2 mt-0.5 text-red-400" />
                  <div>
                    <h4 className="font-medium">Error</h4>
                    <p className="text-sm mt-1">{response.error}</p>
                  </div>
                </div>
              </div>
            ) : formattedBody ? (
              <SyntaxHighlighter 
                language={syntaxLanguage} 
                style={vscDarkPlus}
                customStyle={{ margin: 0, borderRadius: '0.375rem', background: '#1a1a1a' }}
                wrapLongLines={true}
              >
                {formattedBody}
              </SyntaxHighlighter>
            ) : (
              <div className="p-4 text-gray-400 text-center">
                No response body
              </div>
            )}
          </div>
        ) : activeTab === 'headers' ? (
          <div className="bg-gray-900 rounded-md p-4 h-full overflow-auto">
            {response.headers.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2">Header</th>
                    <th className="pb-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {response.headers.map((header, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-2 pr-4 text-blue-300 font-medium">{header.key}</td>
                      <td className="py-2 text-white">{header.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-400 text-center py-4">
                No headers received
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-md p-4 h-full overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Status</h4>
                  <p className="text-white">{response.status} {response.statusText}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Time</h4>
                  <p className="text-white">{response.time !== undefined ? `${response.time} ms` : 'N/A'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Size</h4>
                  <p className="text-white">{response.size !== undefined ? formatBytes(response.size) : 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Content Type</h4>
                  <p className="text-white">{response.contentType || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Headers Count</h4>
                  <p className="text-white">{response.headers.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

interface JSONTreeProps {
  data: any;
  level?: number;
  isLast?: boolean;
}

function JSONTree({ data, level = 0, isLast = true }: JSONTreeProps): React.ReactNode {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  if (data === null) {
    return <span className="text-gray-400">null</span>;
  }
  
  if (data === undefined) {
    return <span className="text-gray-400">undefined</span>;
  }
  
  if (typeof data === 'boolean') {
    return <span className="text-yellow-400">{data.toString()}</span>;
  }
  
  if (typeof data === 'number') {
    return <span className="text-blue-400">{data}</span>;
  }
  
  if (typeof data === 'string') {
    return <span className="text-green-400">"{data}"</span>;
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-gray-400">[]</span>;
    }
    
    return (
      <div>
        <div 
          onClick={toggleExpand}
          className="cursor-pointer inline-flex items-center"
        >
          <span className="text-gray-400 mr-1">
            {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </span>
          <span className="text-gray-400">[{data.length}]</span>
        </div>
        
        {isExpanded && (
          <div className="ml-4 border-l border-gray-600 pl-2">
            {data.map((item, index) => (
              <div key={index} className="my-1">
                <JSONTree 
                  data={item} 
                  level={level + 1} 
                  isLast={index === data.length - 1} 
                />
                {index < data.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Object
  const entries = Object.entries(data);
  
  if (entries.length === 0) {
    return <span className="text-gray-400">{"{}"}</span>;
  }
  
  return (
    <div>
      <div 
        onClick={toggleExpand}
        className="cursor-pointer inline-flex items-center"
      >
        <span className="text-gray-400 mr-1">
          {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        </span>
        <span className="text-gray-400">{"{"}{entries.length}{"}"}</span>
      </div>
      
      {isExpanded && (
        <div className="ml-4 border-l border-gray-600 pl-2">
          {entries.map(([key, value], index) => (
            <div key={key} className="my-1">
              <span className="text-purple-400">"{key}"</span>
              <span className="text-gray-400">: </span>
              <JSONTree 
                data={value} 
                level={level + 1} 
                isLast={index === entries.length - 1} 
              />
              {index < entries.length - 1 && <span className="text-gray-400">,</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
