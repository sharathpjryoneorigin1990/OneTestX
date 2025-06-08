'use client';

import React, { useState } from 'react';
import { FiPlay, FiPlus, FiTrash2, FiCheck, FiX, FiAlertTriangle, FiShield } from 'react-icons/fi';

export interface SecurityVulnerability {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}

export interface SecurityTest {
  id: string;
  name: string;
  target: string;
  testType: 'xss' | 'sql' | 'csrf' | 'auth' | 'headers' | 'custom';
  parameters?: { [key: string]: string };
  lastRun?: Date;
  status?: 'passed' | 'failed' | 'pending';
  vulnerabilities: SecurityVulnerability[];
  customScript?: string;
}

interface SecurityTestingPanelProps {
  securityTests: SecurityTest[];
  setSecurityTests: (tests: SecurityTest[]) => void;
}

export default function SecurityTestingPanel({ securityTests, setSecurityTests }: SecurityTestingPanelProps) {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(
    securityTests.length > 0 ? securityTests[0].id : null
  );
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestTarget, setNewTestTarget] = useState('');
  const [newTestType, setNewTestType] = useState<'xss' | 'sql' | 'csrf' | 'auth' | 'headers' | 'custom'>('xss');
  
  const selectedTest = securityTests.find(test => test.id === selectedTestId);
  
  // Add a new security test
  const handleAddTest = () => {
    if (!newTestName.trim() || !newTestTarget.trim()) return;
    
    const newTest: SecurityTest = {
      id: `sectest_${Date.now()}`,
      name: newTestName.trim(),
      target: newTestTarget.trim(),
      testType: newTestType,
      vulnerabilities: [],
      parameters: getDefaultParameters(newTestType)
    };
    
    setSecurityTests([...securityTests, newTest]);
    setSelectedTestId(newTest.id);
    setIsAddingTest(false);
    setNewTestName('');
    setNewTestTarget('');
    setNewTestType('xss');
  };
  
  // Get default parameters based on test type
  const getDefaultParameters = (testType: string) => {
    switch (testType) {
      case 'xss':
        return {
          injectionPoints: 'query,body',
          payloads: '<script>alert(1)</script>,<img src=x onerror=alert(1)>',
          checkResponse: 'true'
        };
      case 'sql':
        return {
          injectionPoints: 'query,body',
          payloads: "' OR 1=1 --,\" OR 1=1 --",
          checkErrors: 'true'
        };
      case 'csrf':
        return {
          checkTokens: 'true',
          checkOrigin: 'true',
          checkReferrer: 'true'
        };
      case 'auth':
        return {
          checkBruteForce: 'true',
          checkWeakPasswords: 'true',
          checkSessionFixation: 'true'
        };
      case 'headers':
        return {
          checkHSTS: 'true',
          checkCSP: 'true',
          checkXFrameOptions: 'true',
          checkXXSSProtection: 'true'
        };
      default:
        return {};
    }
  };
  
  // Delete a security test
  const handleDeleteTest = (testId: string) => {
    const updatedTests = securityTests.filter(test => test.id !== testId);
    setSecurityTests(updatedTests);
    
    if (selectedTestId === testId) {
      setSelectedTestId(updatedTests.length > 0 ? updatedTests[0].id : null);
    }
  };
  
  // Run a security test
  const handleRunTest = (testId: string) => {
    const test = securityTests.find(t => t.id === testId);
    if (!test) return;
    
    // Simulate running a test with random results
    setTimeout(() => {
      const updatedTests = securityTests.map(t => {
        if (t.id === testId) {
          // Simulate finding vulnerabilities
          const vulnerabilities: SecurityVulnerability[] = [];
          
          if (Math.random() > 0.5) {
            vulnerabilities.push({
              id: `vuln_${Date.now()}_1`,
              name: t.testType === 'xss' ? 'Reflected XSS Vulnerability' :
                    t.testType === 'sql' ? 'SQL Injection Vulnerability' :
                    t.testType === 'csrf' ? 'Missing CSRF Token' :
                    t.testType === 'auth' ? 'Weak Password Policy' :
                    t.testType === 'headers' ? 'Missing Security Headers' : 'Custom Vulnerability',
              description: `A ${t.testType.toUpperCase()} vulnerability was detected in the target endpoint.`,
              severity: Math.random() > 0.7 ? 'critical' : Math.random() > 0.5 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
              remediation: t.testType === 'xss' ? 'Sanitize user input and implement Content-Security-Policy.' :
                          t.testType === 'sql' ? 'Use parameterized queries or prepared statements.' :
                          t.testType === 'csrf' ? 'Implement anti-CSRF tokens for all state-changing operations.' :
                          t.testType === 'auth' ? 'Enforce strong password policies and implement rate limiting.' :
                          t.testType === 'headers' ? 'Add recommended security headers to all responses.' : 'Fix the identified vulnerability.'
            });
          }
          
          return {
            ...t,
            lastRun: new Date(),
            status: vulnerabilities.length > 0 ? 'failed' : 'passed',
            vulnerabilities
          };
        }
        return t;
      });
      
      setSecurityTests(updatedTests);
    }, 1500);
    
    // Set status to pending immediately
    const updatedTests = securityTests.map(t => {
      if (t.id === testId) {
        return { ...t, status: 'pending' };
      }
      return t;
    });
    
    setSecurityTests(updatedTests);
  };
  
  // Update test parameters
  const handleUpdateParameter = (testId: string, key: string, value: string) => {
    const updatedTests = securityTests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          parameters: {
            ...test.parameters,
            [key]: value
          }
        };
      }
      return test;
    });
    
    setSecurityTests(updatedTests);
  };
  
  // Update custom script
  const handleUpdateCustomScript = (testId: string, script: string) => {
    const updatedTests = securityTests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          customScript: script
        };
      }
      return test;
    });
    
    setSecurityTests(updatedTests);
  };
  
  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-900/30';
      case 'high':
        return 'text-orange-500 bg-orange-900/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-900/30';
      case 'low':
        return 'text-green-500 bg-green-900/30';
      default:
        return 'text-gray-500 bg-gray-900/30';
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Left Panel - Test List */}
      <div className="w-1/3 pr-4 border-r border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Security Tests</h3>
          <button
            onClick={() => setIsAddingTest(true)}
            className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
          >
            <FiPlus className="mr-1" />
            Add Test
          </button>
        </div>
        
        {isAddingTest ? (
          <div className="bg-gray-800 p-3 rounded-md mb-4">
            <input
              type="text"
              placeholder="Test Name"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
            />
            <input
              type="text"
              placeholder="Target URL"
              value={newTestTarget}
              onChange={(e) => setNewTestTarget(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
            />
            <select
              value={newTestType}
              onChange={(e) => setNewTestType(e.target.value as any)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
            >
              <option value="xss">Cross-Site Scripting (XSS)</option>
              <option value="sql">SQL Injection</option>
              <option value="csrf">CSRF Protection</option>
              <option value="auth">Authentication Tests</option>
              <option value="headers">Security Headers</option>
              <option value="custom">Custom Test</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingTest(false)}
                className="px-3 py-1 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTest}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Add
              </button>
            </div>
          </div>
        ) : null}
        
        {securityTests.length === 0 ? (
          <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-md">
            No security tests yet
          </div>
        ) : (
          <div className="space-y-2">
            {securityTests.map(test => (
              <div
                key={test.id}
                className={`flex justify-between items-center p-3 rounded-md cursor-pointer ${
                  selectedTestId === test.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-750'
                }`}
                onClick={() => setSelectedTestId(test.id)}
              >
                <div>
                  <div className="font-medium text-white flex items-center">
                    {test.name}
                    {test.status && (
                      <span className={`ml-2 ${
                        test.status === 'passed' ? 'text-green-500' : 
                        test.status === 'failed' ? 'text-red-500' : 
                        'text-yellow-500'
                      }`}>
                        {test.status === 'passed' ? <FiCheck size={14} /> : 
                         test.status === 'failed' ? <FiX size={14} /> : 
                         <FiPlay size={14} className="animate-pulse" />}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center">
                    <span className="capitalize">{test.testType}</span>
                    <span className="mx-1">•</span>
                    <span className="truncate">{test.target}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunTest(test.id);
                    }}
                    className="p-1 text-green-400 hover:text-green-300 rounded-md"
                    disabled={test.status === 'pending'}
                  >
                    <FiPlay />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTest(test.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 rounded-md"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Right Panel - Test Details */}
      <div className="w-2/3 pl-4">
        {selectedTest ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                {selectedTest.name}
                {selectedTest.status && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedTest.status === 'passed' ? 'bg-green-900/50 text-green-400' : 
                    selectedTest.status === 'failed' ? 'bg-red-900/50 text-red-400' : 
                    'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {selectedTest.status === 'passed' ? 'PASSED' : 
                     selectedTest.status === 'failed' ? 'FAILED' : 
                     'RUNNING...'}
                  </span>
                )}
              </h3>
              <button
                onClick={() => handleRunTest(selectedTest.id)}
                className="flex items-center text-sm px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
                disabled={selectedTest.status === 'pending'}
              >
                <FiPlay className="mr-1" />
                Run Test
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Test Type</h4>
                <div className="bg-gray-800 p-2 rounded-md text-white">
                  {selectedTest.testType === 'xss' ? 'Cross-Site Scripting (XSS)' :
                   selectedTest.testType === 'sql' ? 'SQL Injection' :
                   selectedTest.testType === 'csrf' ? 'CSRF Protection' :
                   selectedTest.testType === 'auth' ? 'Authentication Tests' :
                   selectedTest.testType === 'headers' ? 'Security Headers' : 'Custom Test'}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Target URL</h4>
                <div className="bg-gray-800 p-2 rounded-md text-white overflow-hidden text-ellipsis">
                  {selectedTest.target}
                </div>
              </div>
            </div>
            
            {selectedTest.lastRun && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Last Run</h4>
                <div className="bg-gray-800 p-2 rounded-md text-white">
                  {new Date(selectedTest.lastRun).toLocaleString()}
                </div>
              </div>
            )}
            
            {/* Test Parameters */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Test Parameters</h4>
              <div className="bg-gray-800 p-3 rounded-md">
                {selectedTest.parameters && Object.entries(selectedTest.parameters).map(([key, value]) => (
                  <div key={key} className="mb-3">
                    <label className="block text-sm text-gray-400 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                    {key.includes('check') ? (
                      <select
                        value={value}
                        onChange={(e) => handleUpdateParameter(selectedTest.id, key, e.target.value)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleUpdateParameter(selectedTest.id, key, e.target.value)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                      />
                    )}
                  </div>
                ))}
                
                {selectedTest.testType === 'custom' && (
                  <div className="mb-3">
                    <label className="block text-sm text-gray-400 mb-1">Custom Script</label>
                    <textarea
                      value={selectedTest.customScript || '// Write your custom security test script here\n// Example: Check for specific vulnerabilities\n\nfunction testSecurity(target) {\n  // Your test logic here\n  return {\n    vulnerabilities: []\n  };\n}'}
                      onChange={(e) => handleUpdateCustomScript(selectedTest.id, e.target.value)}
                      rows={8}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Vulnerabilities */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">
                Detected Vulnerabilities
                {selectedTest.vulnerabilities.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-900/50 text-red-400">
                    {selectedTest.vulnerabilities.length}
                  </span>
                )}
              </h4>
              
              {selectedTest.vulnerabilities.length === 0 ? (
                <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-md">
                  {selectedTest.status === 'passed' ? (
                    <div className="flex flex-col items-center">
                      <FiShield className="text-green-500 mb-2" size={24} />
                      <p>No vulnerabilities detected</p>
                    </div>
                  ) : selectedTest.status === 'pending' ? (
                    <p>Running security tests...</p>
                  ) : (
                    <p>Run the test to detect vulnerabilities</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTest.vulnerabilities.map(vuln => (
                    <div key={vuln.id} className="bg-gray-800 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-white flex items-center">
                          <FiAlertTriangle className="mr-2 text-red-500" />
                          {vuln.name}
                        </h5>
                        <span className={`px-2 py-0.5 text-xs rounded-full uppercase font-medium ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-3 text-sm">
                        {vuln.description}
                      </p>
                      <div>
                        <h6 className="text-sm font-medium text-gray-400 mb-1">Remediation</h6>
                        <p className="text-gray-300 text-sm bg-gray-700/50 p-2 rounded">
                          {vuln.remediation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-2">No security test selected</p>
            <p className="text-gray-500">Create a security test to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
