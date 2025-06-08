'use client';

import { useState, useEffect } from 'react';
import { FiSettings, FiLink, FiExternalLink, FiGrid, FiColumns, FiCheck, FiX } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
// Using a simple switch component since the UI library one is not available
const Switch = ({
  checked,
  onCheckedChange,
  className = '',
  id = '',
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  id?: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${className} ${
      checked ? 'bg-blue-600' : 'bg-gray-600'
    }`}
    onClick={() => onCheckedChange(!checked)}
  >
    <span
      className={`${
        checked ? 'translate-x-6' : 'translate-x-1'
      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
    />
  </button>
);

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectSettings = ({ isOpen, onClose }: ProjectSettingsProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [jiraUrl, setJiraUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gridView, setGridView] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load settings from localStorage on mount
  const loadSettings = () => {
    const savedGridView = localStorage.getItem('projectSettings-gridView') !== 'false';
    const savedJiraSettings = localStorage.getItem('jira-settings');
    
    setGridView(savedGridView);
    
    if (savedJiraSettings) {
      const { isConnected, jiraUrl, email } = JSON.parse(savedJiraSettings);
      setIsConnected(isConnected);
      setJiraUrl(jiraUrl || '');
      setEmail(email || '');
      
      // Test the connection if we have saved credentials
      if (isConnected) {
        testJiraConnection(jiraUrl, email, JSON.parse(savedJiraSettings).apiToken);
      }
    }
  };

  // Test Jira connection
  const testJiraConnection = async (domain: string, email: string, token: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const response = await fetch('http://localhost:3005/api/jira/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          email,
          apiToken: token
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Successfully connected to Jira as ${data.user.displayName}`);
        return true;
      } else {
        setError(data.error || 'Failed to connect to Jira');
        return false;
      }
    } catch (error) {
      console.error('Error testing Jira connection:', error);
      setError('Failed to connect to Jira. Please check your credentials and try again.');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectJira = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!jiraUrl || !email || !apiToken) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Test the connection first
      const isConnected = await testJiraConnection(jiraUrl, email, apiToken);
      
      if (isConnected) {
        // Save Jira settings
        const jiraSettings = {
          isConnected: true,
          jiraUrl,
          email,
          // Note: In a real app, consider using HTTP-only cookies or server-side sessions
          // instead of storing tokens in localStorage
          apiToken: btoa(apiToken) // Basic obfuscation (not secure)
        };
        
        localStorage.setItem('jira-settings', JSON.stringify(jiraSettings));
        setIsConnected(true);
        setShowConnectForm(false);
      }
    } catch (error) {
      console.error('Failed to connect to Jira:', error);
      setError('Failed to connect to Jira. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectJira = () => {
    localStorage.removeItem('jira-settings');
    setIsConnected(false);
    setJiraUrl('');
    setEmail('');
    setApiToken('');
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[500px] bg-dark-800 border-dark-700 text-white"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          loadSettings();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiSettings className="h-5 w-5" />
            Project Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Jira Integration Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiLink className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="font-medium text-gray-100">Jira Integration</h3>
                  <p className="text-xs text-gray-400">
                    {isConnected 
                      ? `Connected to ${jiraUrl}` 
                      : 'Connect your Jira account to sync issues'}
                  </p>
                </div>
              </div>
              {isConnected ? (
                <Button 
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                  size="sm"
                  onClick={handleDisconnectJira}
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => setShowConnectForm(true)}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>

            {showConnectForm && (
              <form onSubmit={handleConnectJira} className="space-y-4 mt-4 p-4 bg-dark-700 rounded-lg">
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-md text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-md text-sm">
                    {success}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="jira-url">Jira URL</Label>
                  <div className="relative">
                    <Input
                      id="jira-url"
                      type="url"
                      placeholder="https://your-domain.atlassian.net"
                      value={jiraUrl}
                      onChange={(e) => setJiraUrl(e.target.value)}
                      className="bg-dark-600 border-dark-500 text-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-dark-600 border-dark-500 text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="api-token">API Token</Label>
                    <a 
                      href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Get API token <FiExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <Input
                    id="api-token"
                    type="password"
                    placeholder="••••••••••••"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    className="bg-dark-600 border-dark-500 text-white"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowConnectForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Display Settings */}
          <div className="border-t border-dark-700 pt-4">
            <h3 className="font-medium text-gray-100 mb-3">Display Settings</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {gridView ? (
                  <FiGrid className="h-5 w-5 text-gray-300" />
                ) : (
                  <FiColumns className="h-5 w-5 text-gray-300" />
                )}
                <Label htmlFor="grid-view" className="text-gray-300">Grid View</Label>
              </div>
              <Switch
                id="grid-view"
                checked={gridView}
                onCheckedChange={(checked: boolean) => setGridView(checked)}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSettings;
