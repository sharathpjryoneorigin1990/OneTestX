'use client';

import React, { useState } from 'react';
import { FiPlay, FiPlus, FiTrash2, FiBarChart2, FiUsers, FiClock, FiZap, FiAlertTriangle } from 'react-icons/fi';

export interface PerformanceTestConfig {
  virtualUsers: number;
  duration: number; // in seconds
  rampUpPeriod: number; // in seconds
  targetRps: number | null; // requests per second
}

export interface PerformanceTestResult {
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestsPerSecond: number;
  errorRate: number; // percentage
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface PerformanceTest {
  id: string;
  name: string;
  requestId: string; // ID of the APIRequest to test
  config: PerformanceTestConfig;
  lastRun?: Date;
  status?: 'idle' | 'running' | 'completed' | 'error';
  results?: PerformanceTestResult;
}

interface PerformanceTestPanelProps {
  performanceTests: PerformanceTest[];
  setPerformanceTests: (tests: PerformanceTest[]) => void;
  apiRequests: any[]; // Using 'any' for now, replace with APIRequest type
}

export default function PerformanceTestPanel({
  performanceTests,
  setPerformanceTests,
  apiRequests
}: PerformanceTestPanelProps) {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(
    performanceTests.length > 0 ? performanceTests[0].id : null
  );
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [selectedApiRequest, setSelectedApiRequest] = useState<string>(
    apiRequests.length > 0 ? apiRequests[0].id : ''
  );

  const selectedTest = performanceTests.find(test => test.id === selectedTestId);

  const handleAddTest = () => {
    if (!newTestName.trim() || !selectedApiRequest) return;

    const newTest: PerformanceTest = {
      id: `perftest_${Date.now()}`,
      name: newTestName.trim(),
      requestId: selectedApiRequest,
      config: {
        virtualUsers: 10,
        duration: 60,
        rampUpPeriod: 10,
        targetRps: null,
      },
      status: 'idle',
    };

    setPerformanceTests([...performanceTests, newTest]);
    setSelectedTestId(newTest.id);
    setIsAddingTest(false);
    setNewTestName('');
    setSelectedApiRequest(apiRequests.length > 0 ? apiRequests[0].id : '');
  };

  const handleDeleteTest = (testId: string) => {
    const updatedTests = performanceTests.filter(test => test.id !== testId);
    setPerformanceTests(updatedTests);
    if (selectedTestId === testId) {
      setSelectedTestId(updatedTests.length > 0 ? updatedTests[0].id : null);
    }
  };

  const handleRunTest = (testId: string) => {
    const testToRun = performanceTests.find(t => t.id === testId);
    if (!testToRun) return;

    // Simulate test run start
    const updatedTests = performanceTests.map((t: PerformanceTest) => {
      if (t.id === testId) {
        return {
          ...t,
          status: 'running' as 'idle' | 'running' | 'completed' | 'error',
          results: undefined,
        };
      }
      return t;
    });
    setPerformanceTests(updatedTests);

    // Simulate test completion after a delay
    setTimeout(() => {
      const mockResults: PerformanceTestResult = {
        avgResponseTime: Math.random() * 200 + 50, // 50-250ms
        minResponseTime: Math.random() * 50 + 20,   // 20-70ms
        maxResponseTime: Math.random() * 500 + 300, // 300-800ms
        totalRequests: testToRun.config.virtualUsers * testToRun.config.duration,
        successfulRequests: Math.floor((testToRun.config.virtualUsers * testToRun.config.duration) * (0.9 + Math.random() * 0.1)),
        failedRequests: 0,
        requestsPerSecond: testToRun.config.virtualUsers * (1 + Math.random() * 0.5),
        errorRate: Math.random() * 5, // 0-5%
        percentiles: {
          p50: Math.random() * 100 + 70,
          p90: Math.random() * 150 + 100,
          p95: Math.random() * 200 + 150,
          p99: Math.random() * 300 + 200,
        },
      };
      mockResults.failedRequests = mockResults.totalRequests - mockResults.successfulRequests;

      const completedTests = performanceTests.map((t: PerformanceTest) => {
        if (t.id === testId) {
          return {
            ...t,
            status: 'completed' as 'idle' | 'running' | 'completed' | 'error',
            lastRun: new Date(),
            results: mockResults,
          };
        }
        return t;
      });
      setPerformanceTests(completedTests);
    }, 5000); // Simulate 5 second test run
  };
  
  const handleUpdateConfig = (testId: string, newConfig: Partial<PerformanceTestConfig>) => {
    const updatedTests = performanceTests.map((t: PerformanceTest) => {
      if (t.id === testId) {
        return {
          ...t,
          config: { ...t.config, ...newConfig },
        };
      }
      return t;
    });
    setPerformanceTests(updatedTests);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Test List */}
      <div className="w-1/3 pr-4 border-r border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Performance Tests</h3>
          <button
            onClick={() => setIsAddingTest(true)}
            className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
          >
            <FiPlus className="mr-1" />
            Add Test
          </button>
        </div>

        {isAddingTest && (
          <div className="bg-gray-800 p-3 rounded-md mb-4">
            <input
              type="text"
              placeholder="Test Name"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
            />
            <select
              value={selectedApiRequest}
              onChange={(e) => setSelectedApiRequest(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
              disabled={apiRequests.length === 0}
            >
              {apiRequests.length === 0 && <option>No API Requests available</option>}
              {apiRequests.map(req => (
                <option key={req.id} value={req.id}>{req.name}</option>
              ))}
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
                disabled={!newTestName.trim() || !selectedApiRequest}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {performanceTests.length === 0 ? (
          <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-md">
            No performance tests yet
          </div>
        ) : (
          <div className="space-y-2">
            {performanceTests.map(test => (
              <div
                key={test.id}
                className={`flex justify-between items-center p-3 rounded-md cursor-pointer ${
                  selectedTestId === test.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-750'
                }`}
                onClick={() => setSelectedTestId(test.id)}
              >
                <div>
                  <div className="font-medium text-white">{test.name}</div>
                  <div className="text-sm text-gray-400">
                    {apiRequests.find(r => r.id === test.requestId)?.name || 'Unknown Request'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRunTest(test.id); }}
                    className="p-1 text-green-400 hover:text-green-300 rounded-md"
                    disabled={test.status === 'running'}
                  >
                    <FiPlay />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTest(test.id); }}
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

      {/* Right Panel - Test Details & Config */}
      <div className="w-2/3 pl-4">
        {selectedTest ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">{selectedTest.name}</h3>
              <button
                onClick={() => handleRunTest(selectedTest.id)}
                className="flex items-center text-sm px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
                disabled={selectedTest.status === 'running'}
              >
                <FiPlay className="mr-1" />
                {selectedTest.status === 'running' ? 'Running...' : 'Run Test'}
              </button>
            </div>

            {/* Configuration */}
            <div className="mb-6 bg-gray-800 p-4 rounded-md">
              <h4 className="text-md font-medium text-white mb-3">Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Virtual Users</label>
                  <input type="number" value={selectedTest.config.virtualUsers} onChange={e => handleUpdateConfig(selectedTest.id, { virtualUsers: parseInt(e.target.value) || 1 })} className="w-full bg-gray-700 text-white px-3 py-2 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration (seconds)</label>
                  <input type="number" value={selectedTest.config.duration} onChange={e => handleUpdateConfig(selectedTest.id, { duration: parseInt(e.target.value) || 1 })} className="w-full bg-gray-700 text-white px-3 py-2 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ramp-up Period (seconds)</label>
                  <input type="number" value={selectedTest.config.rampUpPeriod} onChange={e => handleUpdateConfig(selectedTest.id, { rampUpPeriod: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 text-white px-3 py-2 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Target RPS (optional)</label>
                  <input type="number" placeholder="e.g., 100" value={selectedTest.config.targetRps || ''} onChange={e => handleUpdateConfig(selectedTest.id, { targetRps: e.target.value ? parseInt(e.target.value) : null })} className="w-full bg-gray-700 text-white px-3 py-2 rounded-md" />
                </div>
              </div>
            </div>

            {/* Results */}
            {selectedTest.status === 'running' && (
              <div className="text-center py-8">
                <FiZap className="mx-auto text-blue-500 text-4xl animate-ping mb-4" />
                <p className="text-white text-lg">Test is running...</p>
                <p className="text-gray-400">Results will appear here once completed.</p>
              </div>
            )}
            {selectedTest.status === 'completed' && selectedTest.results && (
              <div className="bg-gray-800 p-4 rounded-md">
                <h4 className="text-md font-medium text-white mb-3">Results (Last Run: {selectedTest.lastRun?.toLocaleString()})</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-white">
                    <div className="bg-gray-700 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Avg. Response Time</p>
                        <p className="text-xl font-semibold">{selectedTest.results.avgResponseTime.toFixed(2)} ms</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Requests/sec</p>
                        <p className="text-xl font-semibold">{selectedTest.results.requestsPerSecond.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Error Rate</p>
                        <p className={`text-xl font-semibold ${selectedTest.results.errorRate > 5 ? 'text-red-500' : 'text-green-500'}`}>{selectedTest.results.errorRate.toFixed(2)}%</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Total Requests</p>
                        <p className="text-xl font-semibold">{selectedTest.results.totalRequests}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Min Response Time</p>
                        <p className="text-xl font-semibold">{selectedTest.results.minResponseTime.toFixed(2)} ms</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Max Response Time</p>
                        <p className="text-xl font-semibold">{selectedTest.results.maxResponseTime.toFixed(2)} ms</p>
                    </div>
                 </div>
                 <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Response Time Percentiles:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-white text-sm">
                        <div className="bg-gray-700 p-2 rounded-md">P50: {selectedTest.results.percentiles.p50.toFixed(2)} ms</div>
                        <div className="bg-gray-700 p-2 rounded-md">P90: {selectedTest.results.percentiles.p90.toFixed(2)} ms</div>
                        <div className="bg-gray-700 p-2 rounded-md">P95: {selectedTest.results.percentiles.p95.toFixed(2)} ms</div>
                        <div className="bg-gray-700 p-2 rounded-md">P99: {selectedTest.results.percentiles.p99.toFixed(2)} ms</div>
                    </div>
                 </div>
              </div>
            )}
            {selectedTest.status === 'error' && (
                <div className="text-center py-8 bg-red-900/30 p-4 rounded-md">
                    <FiAlertTriangle className="mx-auto text-red-500 text-4xl mb-2" />
                    <p className="text-white text-lg">Test Failed</p>
                    <p className="text-red-400">An error occurred during the test run.</p>
                </div>
            )}

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <FiBarChart2 className="text-gray-600 text-5xl mb-4" />
            <p className="text-gray-400 mb-2">No performance test selected</p>
            <p className="text-gray-500">Create or select a performance test to view details and results.</p>
          </div>
        )}
      </div>
    </div>
  );
}
