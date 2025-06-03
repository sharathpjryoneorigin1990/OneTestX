'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

interface MCPEvent {
  type: string;
  data: any;
  timestamp: number;
}

interface MCPTestStep {
  id: string;
  action: string;
  selector?: string;
  value?: any;
  assertion?: string;
  description: string;
  timestamp?: number;
}

interface MCPTest {
  id: string;
  name: string;
  description: string;
  websiteUrl?: string;
  steps: MCPTestStep[];
  createdAt: number;
  updatedAt: number;
}

interface MCPClientContextType {
  isConnected: boolean;
  tests: MCPTest[];
  currentTest: MCPTest | null;
  isRecording: boolean;
  connect: () => Promise<boolean>;
  startRecording: (initialUrl: string) => boolean;
  stopRecording: () => void;
  saveTest: (test: Omit<MCPTest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MCPTest>;
  runTest: (testId: string) => Promise<{ success: boolean; message: string }>;
  getTest: (testId: string) => Promise<MCPTest | null>;
  clearCurrentTest: () => void;
  setupEventListeners: (targetWindow: Window) => () => void;
  addTestStep: (step: Omit<MCPTestStep, 'id' | 'timestamp'>) => void;
}

const MCPClientContext = createContext<MCPClientContextType | null>(null);

const MOCK_TESTS: MCPTest[] = [
  {
    id: '1',
    name: 'Login Flow Test',
    description: 'Tests the login functionality',
    websiteUrl: 'https://example.com',
    steps: [
      {
        id: 'step1',
        action: 'navigate',
        value: '/login',
        description: 'Navigate to login page',
        timestamp: Date.now()
      },
      {
        id: 'step2',
        action: 'type',
        selector: 'input[type="email"]',
        value: 'test@example.com',
        description: 'Enter email',
        timestamp: Date.now()
      },
      {
        id: 'step3',
        action: 'type',
        selector: 'input[type="password"]',
        value: 'password123',
        description: 'Enter password',
        timestamp: Date.now()
      },
      {
        id: 'step4',
        action: 'click',
        selector: 'button[type="submit"]',
        description: 'Click login button',
        timestamp: Date.now()
      },
      {
        id: 'step5',
        action: 'assert',
        selector: '.welcome-message',
        assertion: 'visible',
        description: 'Verify welcome message is visible',
        timestamp: Date.now()
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24
  }
];

export const MCPClientProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [tests, setTests] = useState<MCPTest[]>(MOCK_TESTS);
  const [currentTest, setCurrentTest] = useState<MCPTest | null>(null);
  const [eventQueue, setEventQueue] = useState<MCPEvent[]>([]);

  // Connect to MCP server
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Connecting to MCP server...');
      // TODO: Replace with actual MCP server connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(true);
      console.log('Successfully connected to MCP server');
      toast.success('Connected to MCP server');
      return true;
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      toast.error('Failed to connect to MCP server');
      return false;
    }
  }, []);

  // Start recording test steps
  const startRecording = useCallback((initialUrl: string = ''): boolean => {
    console.log('Starting recording with URL:', initialUrl);
    console.log('Current connection status:', isConnected);
    
    try {
      if (!isConnected) {
        console.error('Cannot start recording: Not connected to MCP server');
        toast.error('Not connected to MCP server');
        return false;
      }
      
      console.log('Creating new test...');
      const newTest: MCPTest = {
        id: `test-${Date.now()}`,
        name: `Test ${tests.length + 1}`,
        description: 'New test created with MCP',
        websiteUrl: initialUrl,
        steps: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      console.log('Setting current test:', newTest);
      setCurrentTest(newTest);
      setIsRecording(true);
      
      console.log('Recording started successfully');
      toast.success('Started recording test steps');
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
      return false;
    }
  }, [isConnected, tests.length]);

  // Add a step to the current test
  const addTestStep = useCallback((step: Omit<MCPTestStep, 'id' | 'timestamp'>) => {
    console.group('=== addTestStep ===');
    console.log('Current state - isRecording:', isRecording, 'currentTest:', currentTest?.id);
    console.log('Step to add:', step);
    
    if (!isRecording) {
      console.warn('Cannot add test step: Not currently recording');
      console.groupEnd();
      return;
    }
    
    if (!currentTest) {
      console.warn('Cannot add test step: No current test');
      console.groupEnd();
      return;
    }
    
    try {
      const newStep: MCPTestStep = {
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      console.log('Created new step:', newStep);

      // Use functional update to ensure we have the latest state
      setCurrentTest(prev => {
        if (!prev) {
          console.log('No previous test state');
          return prev;
        }
        
        const updatedTest = {
          ...prev,
          steps: [...prev.steps, newStep],
          updatedAt: Date.now(),
        };
        
        console.log('Updated current test with new step. New steps count:', updatedTest.steps.length);
        return updatedTest;
      });
      
      // Also update the tests array to keep it in sync
      setTests(prev => {
        const testIndex = prev.findIndex(t => t.id === currentTest.id);
        if (testIndex === -1) {
          console.log('Test not found in tests array');
          return prev;
        }
        
        const updatedTests = [...prev];
        updatedTests[testIndex] = {
          ...updatedTests[testIndex],
          steps: [...updatedTests[testIndex].steps, newStep],
          updatedAt: Date.now(),
        };
        
        console.log('Updated tests array. New test steps:', updatedTests[testIndex].steps.length);
        return updatedTests;
      });
      
      console.log('Successfully added test step');
    } catch (error) {
      console.error('Error in addTestStep:', error);
      toast.error('Failed to add test step');
    } finally {
      console.groupEnd();
    }
  }, [isRecording, currentTest]);

  // Stop recording test steps
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    try {
      setIsRecording(false);
      toast.success('Stopped recording test steps');
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
    }
  }, [isRecording]);

  // Save test
  const saveTest = async (testData: Omit<MCPTest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTest: MCPTest = {
        ...testData,
        id: `test-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      setTests(prev => [...prev, newTest]);
      setCurrentTest(newTest);
      toast.success('Test saved successfully');
      return newTest;
    } catch (error) {
      console.error('Failed to save test:', error);
      toast.error('Failed to save test');
      throw error;
    }
  };

  // Run test
  const runTest = async (testId: string) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, message: 'Test executed successfully' };
    } catch (error) {
      console.error('Failed to run test:', error);
      return { success: false, message: 'Failed to run test' };
    }
  };

  // Get test by ID
  const getTest = async (testId: string): Promise<MCPTest | null> => {
    // TODO: Replace with actual API call
    return tests.find(test => test.id === testId) || null;
  };

  // Clear current test
  const clearCurrentTest = () => {
    setCurrentTest(null);
  };

  // Set up event listeners for MCP browser
  const setupEventListeners = useCallback((targetWindow: Window) => {
    if (!targetWindow) {
      console.warn('Cannot set up event listeners: No target window provided');
      return () => {};
    }
    
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from our own origin for security
      if (event.origin !== window.location.origin) {
        console.log('Ignoring message from different origin:', event.origin);
        return;
      }

      try {
        const data = event.data;
        console.log('MCP: Received message:', data);

        if (data?.type === 'MCP_EVENT') {
          const { action, selector, value } = data.payload;
          
          if (!action || !selector) {
            console.warn('Invalid MCP_EVENT: missing action or selector', data);
            return;
          }
          
          console.log('Processing MCP_EVENT:', { action, selector, value });
          
          addTestStep({
            action,
            selector,
            value: value || '',
            description: `Performed ${action} on ${selector}`
          });
        } else if (data?.type === 'MCP_SCRIPT_READY') {
          console.log('MCP script is ready in iframe');
          toast.success('Ready to record interactions');
        }
      } catch (error) {
        console.error('Error handling MCP event:', error);
      }
    };

    console.log('Adding message event listener for MCP');
    targetWindow.addEventListener('message', handleMessage);
    
    return () => {
      console.log('Removing message event listener for MCP');
      targetWindow.removeEventListener('message', handleMessage);
    };
  }, [addTestStep]);

  // Initialize MCP client
  useEffect(() => {
    connect();
  }, []);

  const contextValue = {
    isConnected,
    tests,
    currentTest,
    isRecording,
    connect,
    startRecording,
    stopRecording,
    saveTest,
    runTest,
    getTest,
    clearCurrentTest,
    setupEventListeners,
    addTestStep
  };

  return (
    <MCPClientContext.Provider value={contextValue}>
      {children}
    </MCPClientContext.Provider>
  );
};

export const useMCP = (): MCPClientContextType => {
  const context = useContext(MCPClientContext);
  if (!context) {
    throw new Error('useMCP must be used within an MCPClientProvider');
  }
  return context;
};

export default MCPClientProvider;
