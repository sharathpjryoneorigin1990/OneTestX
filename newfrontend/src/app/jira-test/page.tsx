'use client';

import { useState } from 'react';

export default function JiraTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/jira/test-connection');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect to Jira');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Test connection failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Jira Connection Test</h1>
        
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isLoading ? 'Testing...' : 'Test Jira Connection'}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <p className="font-bold">Success!</p>
            <pre className="mt-2 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Current Settings:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(
              {
                host: process.env.NEXT_PUBLIC_JIRA_HOST || 'Not set',
                username: process.env.NEXT_PUBLIC_JIRA_USERNAME 
                  ? `${process.env.NEXT_PUBLIC_JIRA_USERNAME.substring(0, 3)}...` 
                  : 'Not set',
                apiToken: process.env.NEXT_PUBLIC_JIRA_API_TOKEN 
                  ? '••••••••••••' 
                  : 'Not set',
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
