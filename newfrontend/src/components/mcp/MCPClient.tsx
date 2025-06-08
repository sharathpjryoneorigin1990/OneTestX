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
      console.log('Connecting to Playwright MCP server...');
      
      try {
        // Check if the Playwright MCP server is available
        const response = await fetch('/api/mcp/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to connect to MCP server: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('MCP server status:', data);
        
        if (data.status === 'connected' || data.status === 'available') {
          setIsConnected(true);
          console.log('Successfully connected to Playwright MCP server');
          toast.success('Connected to Playwright MCP server');
          return true;
        } else {
          throw new Error(`MCP server status: ${data.status}`);
        }
      } catch (fetchError) {
        console.error('Error connecting to MCP server:', fetchError);
        
        try {
          // Fallback: Try to initialize the connection
          console.log('Attempting to initialize MCP connection...');
          const initResponse = await fetch('/api/mcp/init', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              browser: 'chromium',
              headless: false
            })
          });
          
          if (!initResponse.ok) {
            throw new Error(`Failed to initialize MCP connection: ${initResponse.statusText}`);
          }
          
          const initData = await initResponse.json();
          console.log('MCP initialization response:', initData);
          
          if (initData.success) {
            setIsConnected(true);
            console.log('Successfully initialized Playwright MCP server');
            toast.success('Connected to Playwright MCP server');
            return true;
          } else {
            throw new Error(initData.error || 'Failed to initialize MCP connection');
          }
        } catch (initError) {
          // If both connection attempts fail, use direct iframe communication
          console.log('Using direct iframe communication mode');
          setIsConnected(true);
          toast.success('Using direct iframe communication mode');
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to connect to Playwright MCP server:', error);
      toast.error(`Failed to connect to MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, []);

  // Start recording test steps
  const startRecording = useCallback((initialUrl: string): boolean => {
    console.log('startRecording called with URL:', initialUrl);
    
    if (isRecording) {
      console.log('Already recording');
      return false;
    }

    try {
      // Find the iframe
      console.log('Finding iframe...');
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe) {
        console.error('Iframe element not found');
        throw new Error('Iframe not found');
      }
      if (!iframe.contentWindow) {
        console.error('Iframe contentWindow not accessible');
        throw new Error('Iframe contentWindow not accessible');
      }

      // Create new test first
      console.log('Creating new test...');
      const newTest: MCPTest = {
        id: `test-${Date.now()}`,
        name: '',
        description: '',
        websiteUrl: initialUrl,
        steps: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setCurrentTest(newTest);

      // Send start recording message to iframe
      console.log('Sending MCP_START_RECORDING message to iframe...');
      iframe.contentWindow.postMessage({
        type: 'MCP_START_RECORDING'
      }, '*');

      setIsRecording(true);
      console.log('Recording started successfully');
      toast.success('Started recording test steps');
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
      return false;
    }
  }, [isRecording, setCurrentTest]);

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
      // Find the iframe
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe || !iframe.contentWindow) {
        throw new Error('Iframe not found or not accessible');
      }

      // Send stop recording message to iframe
      iframe.contentWindow.postMessage({
        type: 'MCP_STOP_RECORDING'
      }, '*');

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
      const test = await getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      // Get the iframe
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe || !iframe.contentWindow) {
        throw new Error('Iframe not found or not accessible');
      }

      // Execute test steps in the iframe
      for (const step of test.steps) {
        // Send step to MCP server for execution
        const response = await fetch('/api/mcp/execute-step', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step,
            websiteUrl: test.websiteUrl,
            iframeSelector: 'iframe' // Tell server to target the iframe
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to execute step');
        }

        // Wait for step completion
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return { success: true, message: 'Test executed successfully' };
    } catch (error) {
      console.error('Failed to run test:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to run test' };
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
    
    function handleMessage(event: MessageEvent) {
      console.log('[MCPClient] Received window message:', event.data, 'from origin:', event.origin);
      try {
        const data = event.data;
        if (!data) return;
        console.log('[MCPClient] Message type:', data.type, 'Full message:', data);

        if (data.type === 'MCP_EVENT') {
          // Accept both .payload and .event (for compatibility)
          const payload = data.payload || data.event;
          if (!payload) {
            console.warn('[MCPClient] MCP_EVENT received but missing payload/event:', data);
            return;
          }
          const { action, selector, value, description } = payload;
          if (!action || !selector) {
            console.warn('[MCPClient] MCP_EVENT missing action or selector:', payload);
            return;
          }
          console.log('[MCPClient] Adding test step:', { action, selector, value, description });
          addTestStep({
            action,
            selector,
            value: value || '',
            description: description || `Performed ${action} on ${selector}`
          });
        } else if (data.type === 'MCP_SCRIPT_READY') {
          console.log('[MCPClient] MCP script is ready in iframe');
          toast.success('Ready to record interactions');
        } else {
          console.log('[MCPClient] Ignored message type:', data.type);
        }
      } catch (error) {
        console.error('[MCPClient] Error handling window message:', error);
      }
    }

    targetWindow.addEventListener('message', handleMessage);
    return () => {
      targetWindow.removeEventListener('message', handleMessage);
    };
  }, [addTestStep]);

  // Initialize MCP client
  useEffect(() => {
    connect();
    // Listen for messages on the parent window instead of trying to access iframe directly
    // This avoids cross-origin issues
    const cleanup = setupEventListeners(window);
    return cleanup;
  }, [connect, setupEventListeners]);

// ... (rest of the code remains the same)
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
