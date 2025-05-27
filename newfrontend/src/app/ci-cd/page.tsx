'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { NewNavbar } from '@/components/layout/NewNavbar';

const testTypes = [
  { id: 'unit', label: 'Unit Tests' },
  { id: 'integration', label: 'Integration Tests' },
  { id: 'e2e', label: 'End-to-End Tests' },
  { id: 'performance', label: 'Performance Tests' },
  { id: 'security', label: 'Security Scans' },
];

export default function CiCdPage() {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [jenkinsUrl, setJenkinsUrl] = useState('');
  const [username, setUsername] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [branch, setBranch] = useState('main');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleTestToggle = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // TODO: Replace with actual API call to your backend
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
        }),
      });

      if (!response.ok) throw new Error('Failed to save configuration');
      
      setIsSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving CI/CD configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <NewNavbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              CI/CD Configuration
            </h1>
            <p className="text-gray-400">
              Set up automated testing and deployment pipelines
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Test Selection</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testTypes.map((test) => (
                    <div key={test.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={test.id}
                        checked={selectedTests.includes(test.id)}
                        onChange={() => handleTestToggle(test.id)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={test.id} className="text-sm font-medium leading-none">
                        {test.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Jenkins Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="jenkinsUrl" className="block text-sm font-medium mb-1">
                      Jenkins URL
                    </label>
                    <input
                      type="url"
                      id="jenkinsUrl"
                      value={jenkinsUrl}
                      onChange={(e) => setJenkinsUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://jenkins.example.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="apiToken" className="block text-sm font-medium mb-1">
                        API Token
                      </label>
                      <input
                        type="password"
                        id="apiToken"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium mb-1">
                      Branch to Monitor
                    </label>
                    <input
                      type="text"
                      id="branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full md:w-1/2 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-4">
                <Link href="/test-type">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>

              {isSuccess && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-md text-green-400 text-sm">
                  Configuration saved successfully! Jenkins pipeline is being configured...
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </main>
    </>
  );
}
