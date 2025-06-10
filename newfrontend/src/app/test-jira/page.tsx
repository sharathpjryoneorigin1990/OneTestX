'use client';

import { useState, useEffect } from 'react';

export default function TestJiraPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [settingsSource, setSettingsSource] = useState<string>('');

  // Load settings when component mounts
  useEffect(() => {
    loadSettings();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // First, reload settings to ensure we have the latest
      const reloadResponse = await fetch('/api/jira/reload-settings', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!reloadResponse.ok) {
        const errorData = await reloadResponse.json();
        throw new Error(errorData.message || 'Failed to reload settings');
      }
      
      // Then test the connection
      const testResponse = await fetch('/api/jira/test-connection');
      const data = await testResponse.json();
      
      if (!testResponse.ok) {
        throw new Error(data.message || 'Failed to connect to Jira');
      }
      
      setResult(data);
      
      // Reload settings after successful test
      await loadSettings();
      
    } catch (err) {
      console.error('Test connection failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const response = await fetch('/api/settings/jira', {
        cache: 'no-store', // Ensure we get fresh settings
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load settings');
      }
      
      const data = await response.json();
      setSettings(data);
      
      // Determine the source of the settings
      if (process.env.JIRA_HOST && process.env.JIRA_USERNAME && process.env.JIRA_API_TOKEN) {
        setSettingsSource('Environment Variables');
      } else {
        setSettingsSource('jira-settings.json');
      }
      
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Jira Connection Test</h1>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={testConnection}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isLoading ? 'Testing...' : 'Test Jira Connection'}
            </button>
            
            <button
              onClick={loadSettings}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Load Settings
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {result && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="font-bold">Success!</p>
              <pre className="mt-2 overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          {settings && (
            <div className="mt-6 p-4 bg-gray-50 rounded border">
              <h2 className="font-bold mb-2">Current Jira Settings:</h2>
              <pre className="text-sm overflow-auto max-h-60">
                {JSON.stringify(
                  {
                    host: settings.host || 'Not set',
                    username: settings.username 
                      ? `${settings.username.substring(0, 3)}...` 
                      : 'Not set',
                    apiToken: settings.apiToken 
                      ? '••••••••••••' 
                      : 'Not set',
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
