'use client';

import React, { useState } from 'react';
import { FiCode, FiPlay, FiInfo, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { KeyValuePair } from './types';

interface PreRequestScriptProps {
  script: string;
  setScript: (script: string) => void;
  onRunScript: (script: string) => Promise<any>;
  environments: {
    id: string;
    name: string;
    variables: KeyValuePair[];
  }[];
  activeEnvironmentId: string | null;
  setEnvironmentVariable: (environmentId: string, key: string, value: string) => void;
}

export default function PreRequestScript({
  script,
  setScript,
  onRunScript,
  environments,
  activeEnvironmentId,
  setEnvironmentVariable
}: PreRequestScriptProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [scriptResult, setScriptResult] = useState<{
    success: boolean;
    message: string;
    output?: any;
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleRunScript = async () => {
    if (!script.trim()) {
      setScriptResult({
        success: false,
        message: 'Script is empty'
      });
      return;
    }

    setIsRunning(true);
    setScriptResult(null);

    try {
      const result = await onRunScript(script);
      setScriptResult({
        success: true,
        message: 'Script executed successfully',
        output: result
      });
    } catch (error) {
      setScriptResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white flex items-center">
          <FiCode className="mr-2" />
          Pre-request Script
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
          >
            <FiInfo className="mr-1" />
            Help
          </button>
          <button
            onClick={handleRunScript}
            disabled={isRunning}
            className="flex items-center text-sm px-2 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlay className="mr-1" />
            Run
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="mb-4 p-3 bg-gray-700 rounded-md text-sm">
          <h4 className="font-medium text-white mb-2">Pre-request Script Help</h4>
          <p className="text-gray-300 mb-2">
            Use pre-request scripts to modify requests before they are sent. You can:
          </p>
          <ul className="list-disc pl-5 text-gray-300 space-y-1 mb-3">
            <li>Generate dynamic values (timestamps, UUIDs, random data)</li>
            <li>Set environment variables using <code className="bg-gray-800 px-1 py-0.5 rounded">pm.environment.set(key, value)</code></li>
            <li>Compute authentication tokens</li>
            <li>Manipulate request parameters</li>
          </ul>
          <div className="bg-gray-800 p-2 rounded-md">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
{`// Example: Generate a JWT token and store it
const payload = {
  userId: "123",
  exp: Math.floor(Date.now() / 1000) + 3600
};

// Create a simple token (in real usage, you'd use a proper JWT library)
const token = btoa(JSON.stringify(payload));
pm.environment.set("authToken", token);

// Generate a timestamp
const timestamp = new Date().toISOString();
pm.environment.set("timestamp", timestamp);

// Generate a UUID
const uuid = crypto.randomUUID();
pm.environment.set("requestId", uuid);

console.log("Pre-request script completed successfully");`}
            </pre>
          </div>
        </div>
      )}

      <div className="flex-grow relative">
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="w-full h-full min-h-[200px] bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
          placeholder="// Write your pre-request script here
// Example: pm.environment.set('timestamp', new Date().toISOString());"
        />
      </div>

      {scriptResult && (
        <div className={`mt-4 p-3 rounded-md ${scriptResult.success ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
          <div className="flex items-start">
            {scriptResult.success ? (
              <FiCheckCircle className="text-green-400 mr-2 mt-0.5" />
            ) : (
              <FiAlertCircle className="text-red-400 mr-2 mt-0.5" />
            )}
            <div>
              <div className="font-medium text-white">{scriptResult.message}</div>
              {scriptResult.output && (
                <div className="mt-2">
                  <div className="text-sm text-gray-300">Output:</div>
                  <pre className="mt-1 p-2 bg-gray-800 rounded text-xs overflow-auto max-h-32">
                    {typeof scriptResult.output === 'object'
                      ? JSON.stringify(scriptResult.output, null, 2)
                      : String(scriptResult.output)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
