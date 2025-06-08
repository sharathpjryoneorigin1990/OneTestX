'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { NewNavbar } from '@/components/layout/NewNavbar';
import { toast } from 'react-hot-toast';

type ScheduleType = 'manual' | 'on-push' | 'scheduled';

const testTypes = [
  { id: 'unit', label: 'Unit Tests' },
  { id: 'integration', label: 'Integration Tests' },
  { id: 'e2e', label: 'End-to-End Tests' },
  { id: 'performance', label: 'Performance Tests' },
  { id: 'security', label: 'Security Scans' },
];

const scheduleOptions = [
  { value: 'manual', label: 'Manual Trigger' },
  { value: 'on-push', label: 'On Push to Branch' },
  { value: 'scheduled', label: 'Scheduled' },
];

const frequencyOptions = [
  { value: '*/5 * * * *', label: 'Every 5 minutes' },
  { value: '0 * * * *', label: 'Hourly' },
  { value: '0 0 * * *', label: 'Daily' },
  { value: '0 0 * * 0', label: 'Weekly' },
  { value: 'custom', label: 'Custom Cron Expression' },
];

export default function CiCdPage() {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('manual');
  const [cronExpression, setCronExpression] = useState('0 * * * *');
  const [selectedFrequency, setSelectedFrequency] = useState('0 * * * *');
  const [isCustomCron, setIsCustomCron] = useState(false);
  const [jenkinsUrl, setJenkinsUrl] = useState('');
  const [username, setUsername] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [showApiToken, setShowApiToken] = useState(false);
  const [branch, setBranch] = useState('main');
  const [isSaving, setIsSaving] = useState(false);

  const handleTestToggle = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleFrequencyChange = (value: string) => {
    setSelectedFrequency(value);
    if (value !== 'custom') {
      setCronExpression(value);
      setIsCustomCron(false);
    } else {
      setIsCustomCron(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTests.length) {
      toast.error('Please select at least one test type');
      return;
    }

    if (!jenkinsUrl) {
      toast.error('Jenkins URL is required');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch('/api/ci-cd/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedTests,
          jenkinsConfig: {
            url: jenkinsUrl,
            username,
            apiToken,
            branch,
          },
          schedule: {
            type: scheduleType,
            cronExpression: scheduleType === 'scheduled' ? cronExpression : undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save configuration');
      }
      
      toast.success('CI/CD configuration saved successfully!');
      // Reset form
      setSelectedTests([]);
      setJenkinsUrl('');
      setUsername('');
      setApiToken('');
      setScheduleType('manual');
      setCronExpression('0 * * * *');
      setSelectedFrequency('0 * * * *');
    } catch (error: unknown) {
      console.error('Error saving CI/CD configuration:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <NewNavbar />
      <main className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">CI/CD Configuration</h1>
              <p className="text-gray-400">Set up your continuous integration and deployment pipeline</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Test Selection</h2>
                  <p className="text-sm text-gray-400 mt-1">Select the types of tests to include in your pipeline</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testTypes.map((testType) => (
                    <div
                      key={testType.id}
                      onClick={() => handleTestToggle(testType.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTests.includes(testType.id)
                          ? 'border-indigo-500 bg-indigo-900/30 ring-2 ring-indigo-500/30'
                          : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`flex items-center h-5`}>
                          <Checkbox
                            id={testType.id}
                            checked={selectedTests.includes(testType.id)}
                            onChange={() => {}}
                            className={`h-4 w-4 ${
                              selectedTests.includes(testType.id)
                                ? 'text-indigo-400 focus:ring-indigo-500 bg-indigo-600 border-indigo-400'
                                : 'text-gray-400 focus:ring-gray-500 bg-gray-700 border-gray-600'
                            }`}
                          />
                        </div>
                        <label
                          htmlFor={testType.id}
                          className="ml-3 block text-sm font-medium text-gray-200"
                        >
                          {testType.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Jenkins Configuration</h2>
                  <p className="text-sm text-gray-400 mt-1">Connect to your Jenkins server and configure pipeline settings</p>
                </div>
                
                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="jenkinsUrl" className="block text-sm font-medium text-gray-200">
                          Jenkins Server URL *
                        </label>
                        <span className="text-xs text-red-400">Required</span>
                      </div>
                      <div className="mt-1">
                        <input
                          type="url"
                          id="jenkinsUrl"
                          value={jenkinsUrl}
                          onChange={(e) => setJenkinsUrl(e.target.value)}
                          className="block w-full rounded-md shadow-sm sm:text-sm py-2.5 px-3 border bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="https://jenkins.example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="branch" className="block text-sm font-medium text-gray-200">
                        Git Branch
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="branch"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="block w-full rounded-md shadow-sm sm:text-sm py-2.5 px-3 border bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="main"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                        Jenkins Username
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="block w-full rounded-md shadow-sm sm:text-sm py-2.5 px-3 border bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="apiToken" className="block text-sm font-medium text-gray-200">
                          API Token
                        </label>
                        <a
                          href="https://www.jenkins.io/doc/book/using/using-credentials/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          How to create token
                        </a>
                      </div>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showApiToken ? 'text' : 'password'}
                          id="apiToken"
                          value={apiToken}
                          onChange={(e) => setApiToken(e.target.value)}
                          className="block w-full rounded-md shadow-sm sm:text-sm py-2.5 px-3 pr-10 border bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="••••••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiToken(!showApiToken)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                          tabIndex={-1}
                        >
                          {showApiToken ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !jenkinsUrl || !selectedTests.length}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isSaving || !jenkinsUrl || !selectedTests.length ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </>
  );
}
