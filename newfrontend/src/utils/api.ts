"use client";

import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Backend server URL - using Next.js API routes
const BACKEND_URL = typeof window !== 'undefined' ? '' : (process.env.BACKEND_URL || 'http://localhost:3005');

// Create axios instance with default config
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Socket.io connection for real-time updates
let socket: Socket | null = null;

// Initialize socket connection (call this when app starts)
export const initializeSocket = () => {
  if (!socket) {
    // Use the full backend URL for socket connection
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
    socket = io(socketUrl);
    
    socket.on('connect', () => {
      console.log('Connected to backend socket server');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from backend socket server');
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  
  return socket;
};

// Get the socket instance
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Types for API responses and requests
export interface TestFile {
  name: string;
  path: string;
  lastRun?: {
    status: string;
    duration: string;
    timestamp: string;
    tests: {
      passed: number;
      failed: number;
      skipped: number;
    };
  };
}

export interface TestRun {
  id: string;
  name: string;
  status: string;
  duration: string;
  timestamp: string;
  tests: {
    passed: number;
    failed: number;
    skipped: number;
  };
  logs?: string[];
  error?: string;
  env: string;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  tests: string[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    days?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  name: string;
  url: string;
  variables: Record<string, string>;
}

// API service for test runner operations
export const testRunnerApi = {
  // Get available test files
  getTestFiles: async () => {
    try {
      const response = await api.get('/api/tests');
      return response.data;
    } catch (error) {
      console.error('Error fetching test files:', error);
      throw error;
    }
  },

  // Run a specific test file
  runTestFile: async (testFilePath: string, env: string = 'qa') => {
    try {
      // Check if this is a K6 load test
      const isLoadTest = testFilePath.toLowerCase().includes('load') || 
                        testFilePath.toLowerCase().includes('performance');
      
      if (isLoadTest) {
        // Use the K6 test runner endpoint for load tests
        const response = await api.post('/api/k6-tests/run', { 
          testName: testFilePath,
          env 
        });
        return response.data;
      } else {
        // Use the regular test runner for other tests
        const response = await api.post('/api/tests/run', { 
          testPath: testFilePath, 
          env 
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error running test file:', error);
      throw error;
    }
  },

  // Run a test with custom code
  runTestCode: async (code: string, env: string = 'qa') => {
    try {
      const response = await api.post('/run-test', { code, env });
      return response.data;
    } catch (error) {
      console.error('Error running test code:', error);
      throw error;
    }
  },

  // Run all tests
  runAllTests: async () => {
    try {
      const response = await api.post('/api/run-tests');
      return response.data;
    } catch (error) {
      console.error('Error running all tests:', error);
      throw error;
    }
  },

  // Get all flows
  getFlows: async () => {
    try {
      const response = await api.get('/flows');
      return response.data;
    } catch (error) {
      console.error('Error fetching flows:', error);
      throw error;
    }
  },

  // Get a specific flow
  getFlow: async (id: string) => {
    try {
      const response = await api.get(`/flows/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching flow ${id}:`, error);
      throw error;
    }
  },

  // Create a new flow
  createFlow: async (flow: any) => {
    try {
      const response = await api.post('/flows', flow);
      return response.data;
    } catch (error) {
      console.error('Error creating flow:', error);
      throw error;
    }
  },

  // Update a flow
  updateFlow: async (id: string, flow: any) => {
    try {
      const response = await api.put(`/flows/${id}`, flow);
      return response.data;
    } catch (error) {
      console.error(`Error updating flow ${id}:`, error);
      throw error;
    }
  },

  // Delete a flow
  deleteFlow: async (id: string) => {
    try {
      await api.delete(`/flows/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting flow ${id}:`, error);
      throw error;
    }
  },
  
  // Get test history
  getTestHistory: async (testFilePath?: string, limit: number = 10) => {
    try {
      const params = testFilePath ? { testFilePath, limit } : { limit };
      const response = await api.get('/test-history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching test history:', error);
      throw error;
    }
  },
  
  // Get test run details
  getTestRun: async (id: string) => {
    try {
      const response = await api.get(`/test-runs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching test run ${id}:`, error);
      throw error;
    }
  },
  
  // Get environments
  getEnvironments: async () => {
    try {
      const response = await api.get('/environments');
      return response.data;
    } catch (error) {
      console.error('Error fetching environments:', error);
      throw error;
    }
  },
  
  // Get a specific environment
  getEnvironment: async (id: string) => {
    try {
      const response = await api.get(`/environments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching environment ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new environment
  createEnvironment: async (environment: Omit<Environment, 'id'>) => {
    try {
      const response = await api.post('/environments', environment);
      return response.data;
    } catch (error) {
      console.error('Error creating environment:', error);
      throw error;
    }
  },
  
  // Update an environment
  updateEnvironment: async (id: string, environment: Partial<Environment>) => {
    try {
      const response = await api.put(`/environments/${id}`, environment);
      return response.data;
    } catch (error) {
      console.error(`Error updating environment ${id}:`, error);
      throw error;
    }
  },
  
  // Delete an environment
  deleteEnvironment: async (id: string) => {
    try {
      await api.delete(`/environments/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting environment ${id}:`, error);
      throw error;
    }
  },

  // Socket methods for real-time test execution
  socket: {
    // Run a test file with real-time updates
    runTestFileRealtime: (testFilePath: string, env: string = 'qa', callbacks: {
      onLog?: (log: string) => void,
      onStatus?: (status: { status: string, log?: string, error?: string }) => void,
      onTestStart?: (data: { test: string }) => void,
      onTestEnd?: (data: { test: string, status: string, duration: number }) => void,
      onError?: (error: any) => void
    }) => {
      const socket = getSocket();
      
      // Set up event listeners
      if (callbacks.onLog) {
        socket.on('test-log', (data) => callbacks.onLog?.(data.log));
      }
      
      if (callbacks.onStatus) {
        socket.on('test-status', (data) => callbacks.onStatus?.(data));
      }
      
      if (callbacks.onTestStart) {
        socket.on('test-start', (data) => callbacks.onTestStart?.(data));
      }
      
      if (callbacks.onTestEnd) {
        socket.on('test-end', (data) => callbacks.onTestEnd?.(data));
      }
      
      if (callbacks.onError) {
        socket.on('test-error', (data) => callbacks.onError?.(data.error));
      }
      
      // Emit event to run test
      socket.emit('run-playwright-test-file', { testFilePath, env });
      
      // Return cleanup function
      return () => {
        socket.off('test-log');
        socket.off('test-status');
        socket.off('test-start');
        socket.off('test-end');
        socket.off('test-error');
      };
    },
    
    // Run custom test code with real-time updates
    runTestCodeRealtime: (code: string, env: string = 'qa', callbacks: {
      onLog?: (log: string) => void,
      onStatus?: (status: { status: string, log?: string, error?: string }) => void,
      onTestStart?: (data: { test: string }) => void,
      onTestEnd?: (data: { test: string, status: string, duration: number }) => void,
      onError?: (error: any) => void
    }) => {
      const socket = getSocket();
      
      // Set up event listeners
      if (callbacks.onLog) {
        socket.on('test-log', (data) => callbacks.onLog?.(data.log));
      }
      
      if (callbacks.onStatus) {
        socket.on('test-status', (data) => callbacks.onStatus?.(data));
      }
      
      if (callbacks.onTestStart) {
        socket.on('test-start', (data) => callbacks.onTestStart?.(data));
      }
      
      if (callbacks.onTestEnd) {
        socket.on('test-end', (data) => callbacks.onTestEnd?.(data));
      }
      
      if (callbacks.onError) {
        socket.on('test-error', (data) => callbacks.onError?.(data.error));
      }
      
      // Emit event to run test
      socket.emit('run-playwright-test', { code, env });
      
      // Return cleanup function
      return () => {
        socket.off('test-log');
        socket.off('test-status');
        socket.off('test-start');
        socket.off('test-end');
        socket.off('test-error');
      };
    },
    
    // Subscribe to test run updates
    subscribeToTestRun: (testRunId: string, callbacks: {
      onLog?: (log: string) => void,
      onStatus?: (status: { status: string, log?: string, error?: string }) => void,
      onTestStart?: (data: { test: string }) => void,
      onTestEnd?: (data: { test: string, status: string, duration: number }) => void,
      onError?: (error: any) => void
    }) => {
      const socket = getSocket();
      
      // Set up event listeners
      if (callbacks.onLog) {
        socket.on(`test-log:${testRunId}`, (data) => callbacks.onLog?.(data.log));
      }
      
      if (callbacks.onStatus) {
        socket.on(`test-status:${testRunId}`, (data) => callbacks.onStatus?.(data));
      }
      
      if (callbacks.onTestStart) {
        socket.on(`test-start:${testRunId}`, (data) => callbacks.onTestStart?.(data));
      }
      
      if (callbacks.onTestEnd) {
        socket.on(`test-end:${testRunId}`, (data) => callbacks.onTestEnd?.(data));
      }
      
      if (callbacks.onError) {
        socket.on(`test-error:${testRunId}`, (data) => callbacks.onError?.(data.error));
      }
      
      // Subscribe to test run
      socket.emit('subscribe-test-run', { testRunId });
      
      // Return cleanup function
      return () => {
        socket.off(`test-log:${testRunId}`);
        socket.off(`test-status:${testRunId}`);
        socket.off(`test-start:${testRunId}`);
        socket.off(`test-end:${testRunId}`);
        socket.off(`test-error:${testRunId}`);
        socket.emit('unsubscribe-test-run', { testRunId });
      };
    }
  }
};

export default api;
