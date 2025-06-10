'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function TestApiPage() {
  const [status, setStatus] = useState<string>('Ready');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testSaveApi = async () => {
    setStatus('Testing save API...');
    setError(null);
    setResponse(null);

    try {
      const testData = {
        id: `test-${Date.now()}`,
        testId: 'test-api-call',
        testName: 'API Test',
        url: 'https://example.com',
        timestamp: new Date().toISOString(),
        status: 'completed',
        passed: true,
        details: 'This is a test result',
        steps: [
          {
            action: 'Test started',
            timestamp: new Date().toISOString(),
            status: 'completed'
          }
        ],
        screenshots: [],
        warnings: [],
        focusedElement: null
      };

      console.log('Sending test data:', testData);

      const response = await fetch('/api/test-results/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save test result');
      }

      setResponse(data);
      setStatus('API call successful!');
    } catch (err) {
      console.error('API test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatus('API test failed');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test API Endpoint</h1>
      
      <div className="mb-6">
        <Button onClick={testSaveApi}>
          Test Save API
        </Button>
        <p className="mt-2 text-sm text-gray-600">Status: {status}</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold">Error:</h2>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {response && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="font-bold mb-2">Response:</h2>
          <pre className="bg-white p-4 rounded border overflow-auto max-h-96">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Console Output:</h2>
        <p className="text-sm text-gray-600">
          Check your browser's developer console (F12) for detailed logs.
        </p>
      </div>
    </div>
  );
}
