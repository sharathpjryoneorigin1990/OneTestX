import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUp, FiPlay, FiCheck } from 'react-icons/fi';

// Components
import { NewNavbar } from '@/components/layout/NewNavbar';
import { useSearchParams } from 'next/navigation';

const TestFilesPage: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';

  // Debug function to log test results state
  const logTestResults = () => {
    console.log('Current test results:', testResults);
    console.log('Current tests:', tests);
    
    // Check if test paths match between tests and results
    if (tests.length > 0 && Object.keys(testResults).length > 0) {
      console.log('Test path examples:');
      tests.slice(0, 3).forEach(test => {
        console.log(`Test path: ${test.path}`);
        console.log(`Has result: ${testResults[test.path] ? 'Yes' : 'No'}`);
      });
    }
  };
  
  useEffect(() => {
    async function fetchTests() {
      setLoading(true);
      const res = await fetch('/api/tests');
      const data = await res.json();
      // Case-insensitive filter
      const typeLower = type.toLowerCase();
      const categoryLower = category.toLowerCase();
      let filtered = data.tests.filter((t: any) => {
        const testCategory = (t.category || '').toLowerCase();
        const testTags = (t.tags || []).map((tag: string) => tag.toLowerCase());
        if (category && type) {
          return (
            testCategory === `${categoryLower}/${typeLower}` ||
            (testTags.includes(categoryLower) && testTags.includes(typeLower))
          );
        } else if (category) {
          return (
            testCategory.startsWith(categoryLower) ||
            testTags.includes(categoryLower)
          );
        }
        return true;
      });
      
      console.log('Fetched tests:', filtered);
      setTests(filtered);
      setLoading(false);
      
      // Log test results after a short delay to ensure state is updated
      setTimeout(logTestResults, 500);
    }
    fetchTests();
  }, [category, type]);

  // Function to run a single test
  const runTest = async (testPath: string) => {
    if (runningTests.includes(testPath)) return;
    
    setRunningTests(prev => [...prev, testPath]);
    try {
      // Normalize the test path to match the backend format
      const normalizedPath = testPath.replace(/\\/g, '/');
      
      console.log(`Running test: ${testPath}`);
      console.log(`Normalized path: ${normalizedPath}`);
      
      const response = await fetch('/api/tests/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testPath: normalizedPath,
          env: 'qa'
        }),
      });
      
      const result = await response.json();
      console.log('Test result received:', result);
      
      // Find the test in the tests array to get its ID
      const testItem = tests.find(t => t.path === testPath);
      
      // Store the result by both test path and test ID for redundancy
      setTestResults(prev => {
        const newResults = {
          ...prev,
          [testPath]: result,
          // Also store by ID if available
          ...(testItem ? { [testItem.id]: result } : {})
        };
        console.log('Updated test results:', newResults);
        return newResults;
      });
    } catch (error) {
      console.error('Error running test:', error);
      // Find the test in the tests array to get its ID
      const testItem = tests.find(t => t.path === testPath);
      
      setTestResults(prev => ({
        ...prev,
        [testPath]: { error: 'Failed to run test' },
        // Also store by ID if available
        ...(testItem ? { [testItem.id]: { error: 'Failed to run test' } } : {})
      }));
    } finally {
      setRunningTests(prev => prev.filter(path => path !== testPath));
    }
  };
  
  // Function to run all selected tests
  const runSelectedTests = async () => {
    if (selectedTests.length === 0) return;
    
    // Run each selected test sequentially
    for (const testPath of selectedTests) {
      await runTest(testPath);
    }
  };
  
  // Toggle test selection
  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };
  
  // Select or deselect all tests
  const toggleSelectAll = () => {
    if (selectedTests.length === tests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(tests.map(test => test.id));
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      <NewNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Test Files
            </h1>
            <p className="text-gray-400">Filtered by category: <b>{category}</b> type: <b>{type}</b></p>
          </div>
          
          {tests.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="select-all"
                  className="mr-2 h-4 w-4"
                  checked={selectedTests.length === tests.length && tests.length > 0}
                  onChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">Select All</label>
              </div>
              
              <button
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  selectedTests.length > 0 
                    ? 'bg-cyan-600 hover:bg-cyan-500' 
                    : 'bg-gray-700 cursor-not-allowed'
                }`}
                disabled={selectedTests.length === 0}
                onClick={runSelectedTests}
              >
                <FiPlay className="h-4 w-4" />
                Run Selected ({selectedTests.length})
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-red-400 p-8 text-center bg-dark-800 rounded-lg">
            No test files found for this category/type.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test: any) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-start mb-3">
                  <input
                    type="checkbox"
                    id={`test-${test.id}`}
                    className="mr-3 h-4 w-4 mt-1"
                    checked={selectedTests.includes(test.id)}
                    onChange={() => toggleTestSelection(test.id)}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-1">{test.name}</h3>
                    <p className="text-sm text-gray-400 mb-1">Path: {test.path}</p>
                    {test.tags && test.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {test.tags.map((tag: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {test.testCases && test.testCases.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Test Cases:</p>
                    <ul className="text-sm text-gray-400 list-disc list-inside">
                      {test.testCases.slice(0, 3).map((tc: any, i: number) => (
                        <li key={i}>{tc.name}</li>
                      ))}
                      {test.testCases.length > 3 && (
                        <li className="text-gray-500">+{test.testCases.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Check for results by both ID and path */}
                {(testResults[test.path] || testResults[test.id]) && (
                  <div className="mb-3 p-2 bg-gray-900 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium">Results:</p>
                      {/* Get results from either path or ID */}
                      {(testResults[test.path] || testResults[test.id])?.success ? (
                        <span className="text-xs px-2 py-0.5 bg-green-800 text-green-200 rounded">PASSED</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-red-800 text-red-200 rounded">FAILED</span>
                      )}
                      {(testResults[test.path] || testResults[test.id])?.timestamp && (
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date((testResults[test.path] || testResults[test.id])?.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Playwright specific results */}
                    {/* Get Playwright results */}
                    {(testResults[test.path] || testResults[test.id])?.runner === 'playwright' && (testResults[test.path] || testResults[test.id])?.summary && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-300">
                          <div className="grid grid-cols-2 gap-1">
                            <span>Total tests:</span>
                            <span>{(testResults[test.path] || testResults[test.id])?.summary?.totalTests}</span>
                            
                            <span>Passed:</span>
                            <span className="text-green-400">{(testResults[test.path] || testResults[test.id])?.summary?.passedTests}</span>
                            
                            <span>Failed:</span>
                            <span className="text-red-400">{(testResults[test.path] || testResults[test.id])?.summary?.failedTests}</span>
                            
                            <span>Duration:</span>
                            <span>{((testResults[test.path] || testResults[test.id])?.summary?.duration / 1000).toFixed(2)}s</span>
                          </div>
                        </div>
                        
                        {/* Test output */}
                        {(testResults[test.path] || testResults[test.id])?.details?.suites?.map((suite: any, suiteIndex: number) => (
                          <div key={suiteIndex} className="mt-2">
                            {suite.specs?.map((spec: any, specIndex: number) => (
                              <div key={specIndex} className="mt-1 border-l-2 border-gray-700 pl-2">
                                <div className="flex items-center gap-1">
                                  <span className={`h-2 w-2 rounded-full ${spec.ok ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                  <span className="text-xs font-medium">{spec.title}</span>
                                </div>
                                
                                {/* Test output logs */}
                                {spec.tests?.[0]?.results?.[0]?.stdout?.length > 0 && (
                                  <div className="mt-1 bg-gray-800 p-1 rounded text-xs font-mono">
                                    {spec.tests[0].results[0].stdout.map((log: any, logIndex: number) => (
                                      <div key={logIndex} className="text-gray-300">{log.text}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Jest or other test runners */}
                    {(!(testResults[test.path] || testResults[test.id])?.runner || (testResults[test.path] || testResults[test.id])?.runner !== 'playwright') && (
                      <pre className="text-xs text-gray-400 overflow-x-auto">
                        {JSON.stringify(testResults[test.path] || testResults[test.id], null, 2)}
                      </pre>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button 
                    className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                      runningTests.includes(test.path)
                        ? 'bg-gray-700 cursor-wait'
                        : 'bg-cyan-600 hover:bg-cyan-500'
                    }`}
                    onClick={() => runTest(test.path)}
                    disabled={runningTests.includes(test.path)}
                  >
                    {runningTests.includes(test.path) ? (
                      <>
                        <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-white animate-spin mr-1"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <FiPlay className="h-3 w-3" />
                        Run Test
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TestFilesPage;
