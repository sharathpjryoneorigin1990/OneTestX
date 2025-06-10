import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiChevronDown, FiChevronRight, FiPlay, FiFileText, FiList, FiFilter, FiRotateCw, FiTrash2, FiEye, FiExternalLink } from 'react-icons/fi';

// Components
import { NewNavbar } from '@/components/layout/NewNavbar';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

interface TestResultSummary {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  startTime: string;
}

interface TestResultDetail {
  suites?: Array<{
    title: string;
    specs?: Array<{
      title: string;
      ok: boolean;
      tests?: Array<{
        results?: Array<{
          status: 'passed' | 'failed' | 'skipped' | 'timedOut'; // More specific status
          stdout?: Array<{ text: string }>;
          // Add other potential result fields like error, duration, etc.
        }>;
      }>;
    }>;
  }>;
  // Add other potential detail fields
}

interface TestReport {
  testPath: string;
  summary?: TestResultSummary;
  details?: TestResultDetail | string; // details can be an object or a string for errors
  error?: string;
  playwrightReportUrl?: string; // Optional URL to the full Playwright HTML report
}

interface TestFile {
  id: string;
  name: string;
  path: string;
  isEmpty?: boolean;
  tags?: string[];
  testCases?: Array<{ name: string; [key: string]: any }>;
  category?: string;
  summary?: TestResultSummary;
  lastRun?: {
    status: 'passed' | 'failed';
    timestamp: string;
  };
}

// Test Report Modal Component
function TestReportModal({ report, onClose }: { report: TestReport; onClose: () => void }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto text-gray-100">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-bold">Test Report: {report.testPath}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4">
          {/* Test Summary */}
          {report.summary && (
            <div className="mb-6 bg-gray-700 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-3">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className={`font-semibold text-lg ${report.summary.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {report.summary.passed ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Tests</p>
                  <p className="font-medium text-lg">{report.summary.totalTests}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Passed</p>
                  <p className="font-medium text-lg text-green-400">{report.summary.passedTests}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Failed</p>
                  <p className="font-medium text-lg text-red-400">{report.summary.failedTests}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="font-medium text-lg">{((report.summary.duration || 0) / 1000).toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Start Time</p>
                  <p className="font-medium text-lg">{new Date(report.summary.startTime).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Details */}
          {report.details && typeof report.details === 'object' && report.details.suites && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Test Details</h3>
              {report.details.suites.map((suite, i) => (
                <div key={`suite-${i}`} className="mb-4 bg-gray-700 p-4 rounded-md">
                  <h4 className="font-semibold text-md mb-2">{suite.title || 'Unnamed Suite'}</h4>
                  {suite.specs?.map((spec, j) => (
                    <div key={`spec-${i}-${j}`} className="mt-3 pl-4 border-l-2 border-gray-600">
                      <p className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${spec.ok ? 'text-green-400' : 'text-red-400'}`}>
                          {spec.ok ? <FiCheck className="inline"/> : <FiX className="inline"/>}
                        </span>
                        <span>{spec.title || 'Unnamed Spec'}</span>
                      </p>
                      {spec.tests?.map((test, k) => (
                        <div key={`test-${i}-${j}-${k}`} className="mt-2 pl-4 text-sm">
                          {test.results?.map((result, l) => (
                            <div key={`result-${i}-${j}-${k}-${l}`} className="mb-2 p-2 bg-gray-750 rounded">
                              <p className="text-gray-300">
                                Status: <span className={
                                  result.status === 'passed' ? 'text-green-400 font-semibold' :
                                  result.status === 'failed' ? 'text-red-400 font-semibold' :
                                  'text-yellow-400 font-semibold'
                                }>{result.status.toUpperCase()}</span>
                              </p>
                              {result.stdout && result.stdout.length > 0 && (
                                <details className="mt-1">
                                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-cyan-300">View Output</summary>
                                  <div className="mt-1 bg-gray-850 p-2 rounded text-xs font-mono overflow-x-auto max-h-40">
                                    {result.stdout.map((out, m) => (
                                      <div key={`stdout-${i}-${j}-${k}-${l}-${m}`}>{out.text}</div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Errors */}
          {report.error && (
            <div className="mb-6 bg-red-900 bg-opacity-40 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2 text-red-300">Error</h3>
              <pre className="font-mono text-sm whitespace-pre-wrap break-all">{report.error}</pre>
              {report.details && typeof report.details === 'string' && (
                <pre className="font-mono text-sm mt-2 whitespace-pre-wrap break-all">{report.details}</pre>
              )}
            </div>
          )}

          {/* Raw Data */}
          <div className="mb-4">
            <details className="text-sm">
              <summary className="cursor-pointer hover:text-cyan-400">View Raw JSON Data</summary>
              <pre className="mt-2 bg-gray-900 p-4 rounded-md overflow-x-auto text-xs max-h-60">
                {JSON.stringify(report, null, 2)}
              </pre>
            </details>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end sticky bottom-0 bg-gray-800 z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            Close
          </button>
          {report.playwrightReportUrl && (
            <a
              href={report.playwrightReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <FiExternalLink className="h-4 w-4" />
              View Full Playwright Report
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function for rendering a test card
function renderTestCard(
  test: TestFile,
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
          className="mr-3 h-4 w-4 mt-1 rounded border-gray-600 text-cyan-500 focus:ring-cyan-400 bg-gray-700"
          checked={selectedTests.includes(test.id)}
          onChange={() => toggleTestSelection(test.id)}
          aria-labelledby={`test-name-${test.id}`}
        />
        <div className="flex-1">
          <h3 id={`test-name-${test.id}`} className="text-lg font-medium mb-1 text-gray-100">{test.name}</h3>
          <p className="text-sm text-gray-400 mb-1">Path: {test.path}</p>
          {test.isEmpty && (
            <p className="text-xs text-amber-400 mb-1">Empty file - needs implementation</p>
          )}
          {test.tags && test.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {test.tags.map((tag, i) => (
                <span key={`${test.id}-tag-${i}`} className="text-xs bg-gray-700 px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {test.testCases && test.testCases.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium mb-1 text-gray-300">Test Cases:</p>
          <ul className="text-sm text-gray-400 list-disc list-inside pl-1">
            {test.testCases.slice(0, 3).map((tc, i) => (
              <li key={`${test.id}-tc-${i}`}>{tc.name}</li>
            ))}
            {test.testCases.length > 3 && (
              <li>...and {test.testCases.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
      {test.summary && (
        <div className="mb-3 bg-gray-750 p-3 rounded-md">
          <p className="text-sm font-medium mb-2 text-gray-200">Last Run Results:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-400">Status:</span>
              <span className={`font-semibold ${test.summary.passed ? 'text-green-400' : 'text-red-400'}`}>
                {test.summary.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-400">Total:</span>
              <span className="text-gray-200">{test.summary.totalTests}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-400">Passed:</span>
              <span className="text-green-400">{test.summary.passedTests}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-400">Failed:</span>
              <span className="text-red-400">{test.summary.failedTests}</span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <span className="font-medium text-gray-400">Duration:</span>
              <span className="text-gray-200">{((test.summary.duration || 0) / 1000).toFixed(2)}s</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-end mt-auto pt-2">
        <button
          className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${runningTests.includes(test.path)
              ? 'bg-gray-600 cursor-wait text-gray-400'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400'
            }`}
          onClick={() => runTest(test.path)}
          disabled={runningTests.includes(test.path)}
        >
          {runningTests.includes(test.path) ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
              Running...
            </>
          ) : (
            <>
              <FiPlay className="h-4 w-4" />
              Run Test
            </>
          )}
        </button>
      </div>
    </>
  );
}

function TestFilesPage() {
  const [tests, setTests] = useState<TestFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [runningTests, setRunningTests] = useState<string[]>([]); // Stores test paths
  const [testResults, setTestResults] = useState<Record<string, TestReport>>({}); // Stores reports by test path
  const [showReportModal, setShowReportModal] = useState(false);
  const [latestReport, setLatestReport] = useState<TestReport | null>(null);

  const searchParams = useSearchParams();
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';

  useEffect(() => {
    async function fetchTests() {
      setLoading(true);
      console.log('Fetching tests from /api/tests...');
      try {
        const res = await fetch('/api/tests');
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }
        const data = await res.json();
        console.log('Raw API response data:', data);

        if (!data.tests || !Array.isArray(data.tests)) {
          console.warn('No tests array returned from API or invalid format', data);
          setTests([]);
          setLoading(false);
          return;
        }

        const typeLower = type.toLowerCase();
        const categoryLower = category.toLowerCase();
        console.log('Filtering tests with category:', categoryLower, 'and type:', typeLower);

        const filtered = data.tests.filter((t: TestFile) => {
          const testCategory = (t.category || '').toLowerCase();
          const testTags = (t.tags || []).map((tag: string) => tag.toLowerCase());

          if (category && type) {
            return (
              testCategory === `${categoryLower}/${typeLower}` ||
              (testTags.includes(categoryLower) && testTags.includes(typeLower)) ||
              (t.path.toLowerCase().includes(categoryLower) && t.path.toLowerCase().includes(typeLower)) ||
              (t.name.toLowerCase().includes(typeLower) && testTags.includes(categoryLower))
            );
          } else if (category) {
            return (
              testCategory.startsWith(categoryLower) ||
              testTags.includes(categoryLower) ||
              t.path.toLowerCase().includes(categoryLower) ||
              t.name.toLowerCase().includes(categoryLower)
            );
          }
          return true; // No filters, return all
        });

        console.log(`Found ${filtered.length} tests matching filters out of ${data.tests.length} total tests`);
        setTests(filtered);
      } catch (error) {
        console.error('Error fetching tests:', error);
        setTests([]); // Set to empty on error
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, [category, type]);

  const runTest = async (testPath: string) => {
    if (runningTests.includes(testPath)) return;

    setRunningTests(prev => [...prev, testPath]);
    try {
      const normalizedPath = testPath.replace(/\\/g, '/');
      console.log(`Running test: ${testPath} (Normalized: ${normalizedPath})`);

      const response = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPath: normalizedPath, env: 'qa' }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Test run API failed with status ${response.status}: ${errorData}`);
      }
      
      const result: TestReport = await response.json();
      console.log('Test result received:', result);
      console.log('[DEBUG] Setting latestReport in runTest:', result);

      setLatestReport(result); // Save as the latest report for the modal

      setTests(prevTests =>
        prevTests.map(test =>
          test.path === testPath && result.summary
            ? { ...test, summary: result.summary, lastRun: { status: result.summary.passed ? 'passed' : 'failed', timestamp: new Date().toISOString() } }
            : test
        )
      );
      
      setTestResults(prev => ({ ...prev, [testPath]: result }));

    } catch (error: any) {
      console.error('Error running test:', error.message || error);
      const errorReport: TestReport = {
        testPath,
        error: error.message || 'Failed to run test and parse error.',
        details: error.stack || (typeof error === 'string' ? error : JSON.stringify(error))
      };
      setLatestReport(errorReport);
      console.log('[DEBUG] Setting latestReport (error) in runTest:', errorReport);
      setTestResults(prev => ({ ...prev, [testPath]: errorReport }));
      // Update test summary to show error state if possible
      setTests(prevTests =>
        prevTests.map(test =>
          test.path === testPath
            ? { ...test, summary: { passed: false, totalTests: 0, passedTests: 0, failedTests: 0, duration:0, startTime: new Date().toISOString() }, lastRun: { status: 'failed', timestamp: new Date().toISOString() } }
            : test
        )
      );
    } finally {
      setRunningTests(prev => prev.filter(path => path !== testPath));
    }
  };

  const runSelectedTests = async () => {
    if (selectedTests.length === 0) return;
    for (const testId of selectedTests) {
      const test = tests.find(t => t.id === testId);
      if (test) {
        await runTest(test.path);
      }
    }
  };

  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTests.length === tests.length && tests.length > 0) {
      setSelectedTests([]);
    } else {
      setSelectedTests(tests.map(test => test.id));
    }
  };
  
  const memoizedRenderTestCard = React.useCallback(renderTestCard, []);

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
      <NewNavbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Test Dashboard
            </h1>
            {(category || type) && (
                <p className="text-gray-400 text-sm">
                    Filtered by: {category && <span>Category: <b className="text-gray-300">{category}</b></span>}{category && type && " & "}{type && <span>Type: <b className="text-gray-300">{type}</b></span>}
                </p>
            )}
          </div>

          {tests.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${selectedTests.length === 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                onClick={runSelectedTests}
                disabled={selectedTests.length === 0 || runningTests.length > 0}
              >
                <FiPlay className="h-4 w-4" />
                Run Selected ({selectedTests.length})
              </button>
              <button
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${tests.length === 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : (selectedTests.length === tests.length ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300')}`}
                onClick={toggleSelectAll}
                disabled={tests.length === 0}
              >
                {selectedTests.length === tests.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${!latestReport ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                onClick={() => {
                  console.log('[DEBUG] View Latest Report button clicked. Current latestReport:', latestReport);
                  setShowReportModal(true);
                }}
                disabled={!latestReport}
              >
                <FiCheck className="h-4 w-4" />
                View Latest Report
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            <p className="ml-4 text-lg text-gray-300">Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center text-red-400 p-8 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">No Test Files Found</h2>
            <p>No tests matched your criteria: {category && <span>Category: <b>{category}</b></span>}{category && type && " & "}{type && <span>Type: <b>{type}</b></span>}.</p>
            <p>Please check the API or adjust your filters.</p>
          </div>
        ) : (
          <>
            {/* This console.log is for debugging modal rendering conditions */}
            {console.log('[DEBUG] Checking modal render conditions: showReportModal:', showReportModal, 'latestReport:', latestReport)}
            {type === 'project-management' && category === 'ai' ? (
              <Tabs defaultValue="sprint-planning" className="w-full">
                <TabsList className="mb-4 bg-gray-800 border border-gray-700 rounded-md p-1 flex-wrap justify-start">
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
        {(() => {
          console.log('[DEBUG] Checking modal render conditions: showReportModal:', showReportModal, 'latestReport:', latestReport);
          if (showReportModal && latestReport) {
            return <TestReportModal report={latestReport} onClose={() => {
              console.log('[DEBUG] TestReportModal onClose called.');
              setShowReportModal(false);
            }} />;
          }
          return null;
        })()}
      </main>
    </div>
  );
}

export default TestFilesPage;
