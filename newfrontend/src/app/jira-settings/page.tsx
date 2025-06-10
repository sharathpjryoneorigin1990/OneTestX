'use client';

import React, { useState, useEffect } from 'react';
import { NewNavbar } from '@/components/layout/NewNavbar';
import { toast, Toaster } from 'react-hot-toast';

interface JiraSettings {
  host: string;
  username: string;
  hasApiToken: boolean;
}

export default function JiraSettingsPage() {
  const [settings, setSettings] = useState<JiraSettings>({
    host: '',
    username: '',
    hasApiToken: false
  });
  
  const [formData, setFormData] = useState({
    host: '',
    username: '',
    apiToken: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch current settings
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/settings/jira');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Jira settings');
        }
        
        const data = await response.json();
        setSettings(data);
        setFormData({
          host: data.host || '',
          username: data.username || '',
          apiToken: '' // Don't populate API token for security
        });
      } catch (err: any) {
        console.error('Error fetching Jira settings:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.host) {
        throw new Error('Jira host is required');
      }
      
      if (!formData.username) {
        throw new Error('Jira username is required');
      }
      
      // Only include API token if provided (to avoid overwriting existing token)
      const payload: any = {
        host: formData.host,
        username: formData.username
      };
      
      if (formData.apiToken) {
        payload.apiToken = formData.apiToken;
      }
      
      const response = await fetch('/api/settings/jira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save Jira settings');
      }
      
      const data = await response.json();
      toast.success('Jira settings saved successfully');
      
      // Update settings state to reflect changes
      setSettings({
        host: formData.host,
        username: formData.username,
        hasApiToken: formData.apiToken ? true : settings.hasApiToken
      });
    } catch (err: any) {
      console.error('Error saving Jira settings:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      <Toaster position="top-right" />
      <NewNavbar />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Jira Settings</h1>
          
          {isLoading ? (
            <div className="text-center py-8">Loading settings...</div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-dark-800 p-6 rounded-lg shadow-lg">
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-200">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="host" className="block text-sm font-medium mb-1">
                  Jira Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="host"
                  name="host"
                  value={formData.host}
                  onChange={handleInputChange}
                  placeholder="your-domain.atlassian.net"
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Enter your Jira domain without https:// (e.g., your-domain.atlassian.net)
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Jira Username/Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="your-email@example.com"
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="apiToken" className="block text-sm font-medium mb-1">
                  Jira API Token {settings.hasApiToken && <span className="text-green-500 ml-2">(Already set)</span>}
                </label>
                <input
                  type="password"
                  id="apiToken"
                  name="apiToken"
                  value={formData.apiToken}
                  onChange={handleInputChange}
                  placeholder={settings.hasApiToken ? "••••••••••••••••" : "Enter your Jira API token"}
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {settings.hasApiToken 
                    ? "Leave blank to keep using your existing API token. Enter a new value to update it." 
                    : "Generate an API token from your Atlassian account settings."}
                </p>
                <p className="mt-2 text-xs text-blue-400">
                  <a 
                    href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    How to generate an API token
                  </a>
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-70"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-8 bg-dark-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">About Jira Integration</h2>
            <p className="mb-3">
              This integration allows you to connect to your Jira instance to view, create, and edit issues directly from this application.
            </p>
            <p className="mb-3">
              After configuring your Jira settings here, you can access the Jira dashboard at{' '}
              <a href="/jira-dashboard" className="text-blue-400 underline">
                /jira-dashboard
              </a>
              .
            </p>
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
              <h3 className="font-medium mb-2">Security Note</h3>
              <p className="text-sm">
                Your Jira API token is stored securely and is never exposed to the client. It is only used server-side to authenticate with the Jira API.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
