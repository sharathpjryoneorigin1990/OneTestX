'use client';

import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiPlay, FiCheck, FiX } from 'react-icons/fi';

interface APITest {
  id: string;
  name: string;
  script: string;
  enabled: boolean;
  result?: {
    passed: boolean;
    message?: string;
  };
}

interface APIResponse {
  status: number;
  statusText: string;
  headers: { key: string; value: string }[];
  body: any;
  time: number;
  size: number;
}

interface TestsPanelProps {
  tests: APITest[];
  setTests: (tests: APITest[]) => void;
  response: APIResponse | null;
}

export default function TestsPanel({ tests, setTests, response }: TestsPanelProps) {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  
  const handleAddTest = () => {
    const newTest: APITest = {
      id: 'test_' + Date.now(),
      name: 'New Test',
      script: `// Write your test script here\n// Example:\n\npm.test("Status code is 200", function() {\n    pm.expect(pm.response.code).to.equal(200);\n});\n\npm.test("Response time is less than 500ms", function() {\n    pm.expect(pm.response.responseTime).to.be.below(500);\n});\n\npm.test("Response has the correct structure", function() {\n    const responseJson = pm.response.json();\n    pm.expect(responseJson).to.be.an('object');\n    pm.expect(responseJson).to.have.property('data');\n});`,
      enabled: true
    };
    
    setTests([...tests, newTest]);
    setSelectedTest(newTest.id);
  };
  
  const handleRemoveTest = (id: string) => {
    setTests(tests.filter(test => test.id !== id));
    if (selectedTest === id) {
      setSelectedTest(tests.length > 1 ? tests[0].id : null);
    }
  };
  
  const handleTestNameChange = (id: string, name: string) => {
    setTests(tests.map(test => 
      test.id === id ? { ...test, name } : test
    ));
  };
  
  const handleTestScriptChange = (id: string, script: string) => {
    setTests(tests.map(test => 
      test.id === id ? { ...test, script } : test
    ));
  };
  
  const handleTestToggle = (id: string) => {
    setTests(tests.map(test => 
      test.id === id ? { ...test, enabled: !test.enabled } : test
    ));
  };
  
  const runTest = (test: APITest) => {
    if (!response) {
      alert('No response to test against. Send a request first.');
      return;
    }
    
    try {
      // Create a sandbox environment to run the test script
      const pm = {
        response: {
          code: response.status,
          status: response.statusText,
          headers: response.headers.reduce((obj, header) => {
            obj[header.key] = header.value;
            return obj;
          }, {} as Record<string, string>),
          json: () => typeof response.body === 'string' ? JSON.parse(response.body) : response.body,
          text: () => typeof response.body === 'string' ? response.body : JSON.stringify(response.body),
          responseTime: response.time
        },
        test: (name: string, testFn: () => void) => {
          try {
            testFn();
            return { passed: true, name };
          } catch (error) {
            return { 
              passed: false, 
              name, 
              message: error instanceof Error ? error.message : String(error) 
            };
          }
        },
        expect: (actual: any) => ({
          to: {
            equal: (expected: any) => {
              if (actual !== expected) {
                throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
              }
            },
            be: {
              an: (type: string) => {
                const actualType = Array.isArray(actual) ? 'array' : typeof actual;
                if (actualType !== type) {
                  throw new Error(`Expected type ${type} but got ${actualType}`);
                }
              },
              above: (expected: number) => {
                if (actual <= expected) {
                  throw new Error(`Expected ${actual} to be above ${expected}`);
                }
              },
              below: (expected: number) => {
                if (actual >= expected) {
                  throw new Error(`Expected ${actual} to be below ${expected}`);
                }
              }
            },
            include: (expected: any) => {
              if (!actual.includes(expected)) {
                throw new Error(`Expected ${JSON.stringify(actual)} to include ${JSON.stringify(expected)}`);
              }
            },
            have: {
              property: (prop: string) => {
                if (!Object.prototype.hasOwnProperty.call(actual, prop)) {
                  throw new Error(`Expected object to have property ${prop}`);
                }
              },
              lengthOf: (length: number) => {
                if (actual.length !== length) {
                  throw new Error(`Expected length ${length} but got ${actual.length}`);
                }
              }
            }
          }
        })
      };
      
      // Execute the test script
      const testResults: any[] = [];
      const originalTest = pm.test;
      pm.test = (name, testFn) => {
        const result = originalTest(name, testFn);
        testResults.push(result);
        return result;
      };
      
      // Use Function constructor to create a function from the script
      // This is safer than eval but still has security implications
      // In a production app, consider using a more secure approach
      const testFunction = new Function('pm', test.script);
      testFunction(pm);
      
      // Update test results
      const passed = testResults.every(result => result.passed);
      const message = testResults
        .filter(result => !result.passed)
        .map(result => `${result.name}: ${result.message}`)
        .join('\n');
      
      setTests(tests.map(t => 
        t.id === test.id ? { ...t, result: { passed, message } } : t
      ));
      
      return { passed, message };
    } catch (error) {
      console.error('Test execution error', error);
      
      setTests(tests.map(t => 
        t.id === test.id ? { 
          ...t, 
          result: { 
            passed: false, 
            message: error instanceof Error ? error.message : String(error) 
          } 
        } : t
      ));
      
      return { 
        passed: false, 
        message: error instanceof Error ? error.message : String(error) 
      };
    }
  };
  
  const runAllTests = () => {
    if (!response) {
      alert('No response to test against. Send a request first.');
      return;
    }
    
    const enabledTests = tests.filter(test => test.enabled);
    let allPassed = true;
    
    enabledTests.forEach(test => {
      const result = runTest(test);
      if (result && !result.passed) {
        allPassed = false;
      }
    });
    
    return allPassed;
  };

  return (
    <div className="flex h-full">
      {/* Test List */}
      <div className="w-1/3 pr-4 border-r border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Tests</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleAddTest}
              className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
            >
              <FiPlus className="mr-1" />
              Add Test
            </button>
            <button
              onClick={runAllTests}
              disabled={!response || tests.length === 0}
              className="flex items-center text-sm px-2 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlay className="mr-1" />
              Run All
            </button>
          </div>
        </div>
        
        {tests.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No tests added yet
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {tests.map(test => (
              <div 
                key={test.id}
                onClick={() => setSelectedTest(test.id)}
                className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${
                  selectedTest === test.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={test.enabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleTestToggle(test.id);
                    }}
                    className="mr-2"
                  />
                  <div>
                    <div className="text-white">{test.name}</div>
                    {test.result && (
                      <div className={`text-sm flex items-center ${
                        test.result.passed ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {test.result.passed ? (
                          <>
                            <FiCheck className="mr-1" />
                            Passed
                          </>
                        ) : (
                          <>
                            <FiX className="mr-1" />
                            Failed
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runTest(test);
                    }}
                    disabled={!response}
                    className="text-green-400 hover:text-green-300 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiPlay />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTest(test.id);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Test Editor */}
      <div className="w-2/3 pl-4">
        {selectedTest ? (
          <>
            {tests.filter(test => test.id === selectedTest).map(test => (
              <div key={test.id} className="h-full flex flex-col">
                <div className="mb-4">
                  <input
                    type="text"
                    value={test.name}
                    onChange={(e) => handleTestNameChange(test.id, e.target.value)}
                    placeholder="Test Name"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex-1">
                  <textarea
                    value={test.script}
                    onChange={(e) => handleTestScriptChange(test.id, e.target.value)}
                    className="w-full h-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                
                {test.result && !test.result.passed && test.result.message && (
                  <div className="mt-4 p-3 bg-red-900 bg-opacity-50 text-red-200 rounded-md">
                    <div className="font-bold mb-1">Test Failed:</div>
                    <pre className="whitespace-pre-wrap">{test.result.message}</pre>
                  </div>
                )}
                
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-white mb-2">Test Variables</h4>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <p className="text-gray-300 mb-2">You can use these variables in your tests:</p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li><code className="bg-gray-800 px-1 py-0.5 rounded">pm.response.code</code> - HTTP status code</li>
                      <li><code className="bg-gray-800 px-1 py-0.5 rounded">pm.response.status</code> - Status text</li>
                      <li><code className="bg-gray-800 px-1 py-0.5 rounded">pm.response.headers</code> - Response headers</li>
                      <li><code className="bg-gray-800 px-1 py-0.5 rounded">pm.response.json()</code> - Response body as JSON</li>
                      <li><code className="bg-gray-800 px-1 py-0.5 rounded">pm.response.text()</code> - Response body as text</li>
                      <li><code className="bg-gray-800 px-1 py-0.5 rounded">pm.response.responseTime</code> - Response time in ms</li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-lg mb-2">No test selected</p>
            <p className="text-sm">Select a test from the list or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
