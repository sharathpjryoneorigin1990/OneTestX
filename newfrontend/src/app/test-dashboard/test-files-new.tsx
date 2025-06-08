import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUp, FiPlay, FiCheck } from 'react-icons/fi';

// Components
import { NewNavbar } from '@/components/layout/NewNavbar';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

// Helper function for rendering a test card
function renderTestCard(
  test: any,
  selectedTests: string[],
  toggleTestSelection: (id: string) => void,
  runningTests: string[],
  runTest: (path: string) => void
) {
  return (
    <>
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
              <li>...and {test.testCases.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
      {test.summary && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span>Total:</span>
            <span>{test.summary.totalTests}</span>
            <span>Passed:</span>
            <span className="text-green-400">{test.summary.passedTests}</span>
            <span>Failed:</span>
            <span className="text-red-400">{test.summary.failedTests}</span>
            <span>Duration:</span>
            <span>{((test.summary.duration / 1000) || 0).toFixed(2)}s</span>
          </div>
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
    </>
  );
}

function TestFilesPage() {
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
          <>
            {/* Grouped and ordered test cards for project-management/ai */}
            {type === 'project-management' && category === 'ai' ? (
              <Tabs defaultValue="sprint-planning" className="w-full">
                <TabsList className="mb-4 bg-gray-800 border border-gray-700 rounded-md p-1 flex-wrap">
                  <TabsTrigger value="sprint-planning">Sprint Planning & Stand-Up</TabsTrigger>
                  <TabsTrigger value="risk-blockers">Risk & Blockers</TabsTrigger>
                  <TabsTrigger value="team-health">Team Health</TabsTrigger>
                  <TabsTrigger value="insights-querying">Insights & Querying</TabsTrigger>
                  <TabsTrigger value="other-tests">Other Tests</TabsTrigger>
                </TabsList>

                <TabsContent value="sprint-planning">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests
                      .filter((test: any) =>
                        /sprintplanning|standup|predictivesprint/i.test(test.name)
                      )
                      .map((test: any) => (
                        <motion.div key={test.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          {renderTestCard(test, selectedTests, toggleTestSelection, runningTests, runTest)}
                        </motion.div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="risk-blockers">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests
                      .filter((test: any) =>
                        /risk|blocker/i.test(test.name)
                      )
                      .map((test: any) => (
                        <motion.div key={test.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          {renderTestCard(test, selectedTests, toggleTestSelection, runningTests, runTest)}
                        </motion.div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="team-health">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests
                      .filter((test: any) =>
                        /sentiment|resource/i.test(test.name)
                      )
                      .map((test: any) => (
                        <motion.div key={test.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          {renderTestCard(test, selectedTests, toggleTestSelection, runningTests, runTest)}
                        </motion.div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="insights-querying">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests
                      .filter((test: any) =>
                        /query|deadline|upcoming/i.test(test.name)
                      )
                      .map((test: any) => (
                        <motion.div key={test.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          {renderTestCard(test, selectedTests, toggleTestSelection, runningTests, runTest)}
                        </motion.div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="other-tests">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests
                      .filter((test: any) =>
                        !/sprintplanning|standup|predictivesprint|risk|blocker|sentiment|resource|query|deadline|upcoming/i.test(test.name)
                      )
                      .map((test: any) => (
                        <motion.div key={test.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          {renderTestCard(test, selectedTests, toggleTestSelection, runningTests, runTest)}
                        </motion.div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // Generic test rendering for other categories/types
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test: any) => (
                  <motion.div key={test.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    {renderTestCard(test, selectedTests, toggleTestSelection, runningTests, runTest)}
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default TestFilesPage;
