import { useState, useEffect, useCallback } from 'react';
import { useMCP } from '../MCPClient';
import toast from 'react-hot-toast';

interface TestStep {
  id: string;
  action: string;
  selector?: string;
  value?: string;
  timestamp?: number;
}

interface MCPTest {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  steps: TestStep[];
  createdAt: number;
  updatedAt: number;
}

export const useTestBuilder = () => {
  const {
    currentTest,
    startRecording,
    stopRecording,
    saveTest,
    runTest,
    clearCurrentTest,
    addTestStep,
    connect,
    isConnected,
    setupEventListeners
  } = useMCP();

  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'system', text: string}>>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  // Initialize MCP client on mount
  useEffect(() => {
    console.log('Initializing MCP client...');
    const init = async () => {
      try {
        const connected = await connect();
        console.log('MCP client connected:', connected);
      } catch (error) {
        console.error('Failed to initialize MCP client:', error);
        toast.error('Failed to initialize MCP client');
      }
    };

    init();
  }, [connect]);

  // Initialize form with current test data and create a new test if none exists
  useEffect(() => {
    console.log('Current test changed:', currentTest);
    
    if (currentTest) {
      setTestName(currentTest.name);
      setTestDescription(currentTest.description);
      setWebsiteUrl(currentTest.websiteUrl || '');
    } else {
      createNewTest();
    }
  }, [currentTest]);

  const createNewTest = useCallback(() => {
    const newTest = {
      id: `test-${Date.now()}`,
      name: 'New Test',
      description: 'Test created with TestBuilder',
      websiteUrl: '',
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    console.log('Creating new test:', newTest);
    if (typeof clearCurrentTest === 'function') {
      clearCurrentTest();
      setTimeout(() => {
        if (typeof saveTest === 'function') {
          saveTest(newTest).then(savedTest => {
            console.log('New test saved:', savedTest);
          }).catch(error => {
            console.error('Error saving new test:', error);
          });
        }
      }, 100);
    }
  }, [clearCurrentTest, saveTest]);

  const handleStartRecording = useCallback(() => {
    if (!websiteUrl) {
      toast.error('Please enter a website URL');
      return;
    }

    try {
      // Validate URL format
      const url = new URL(websiteUrl);
      if (!url.protocol.startsWith('http')) {
        toast.error('Please enter a valid http:// or https:// URL');
        return;
      }

      if (!isIframeLoaded) {
        toast.error('Please wait for the website to load');
        return;
      }

      const success = startRecording(websiteUrl);
      if (success) {
        setIsRecording(true);
        toast.success('Recording started');
      }
    } catch (error) {
      toast.error('Please enter a valid URL');
    }
  }, [websiteUrl, isIframeLoaded, startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setIsRecording(false);
    toast.success('Recording stopped');
  }, [stopRecording]);

  const handleSaveTest = useCallback(async () => {
    if (!testName) {
      toast.error('Please enter a test name');
      return;
    }

    setIsSaving(true);
    try {
      const testData = {
        name: testName,
        description: testDescription,
        websiteUrl,
        steps: currentTest?.steps || []
      };
      await saveTest(testData);
      toast.success('Test saved successfully');
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error('Failed to save test');
    } finally {
      setIsSaving(false);
    }
  }, [currentTest, testName, testDescription, websiteUrl, saveTest]);

  const handleRunTest = useCallback(async () => {
    if (!currentTest?.id) {
      toast.error('No test selected to run');
      return;
    }
    
    setIsRunning(true);
    try {
      await runTest(currentTest.id);
      toast.success('Test completed successfully');
    } catch (error) {
      console.error('Error running test:', error);
      toast.error('Failed to run test');
    } finally {
      setIsRunning(false);
    }
  }, [currentTest, runTest]);

  const handleClearTest = useCallback(() => {
    clearCurrentTest();
    createNewTest();
    toast.success('Test cleared');
  }, [clearCurrentTest, createNewTest]);

  const handleClearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  const handleChatCommand = useCallback(async (command: string) => {
    if (!websiteUrl) {
      toast.error('Please enter a website URL first');
      return;
    }

    if (!isIframeLoaded) {
      toast.error('Please wait for the website to load');
      return;
    }

    setChatMessages(prev => [...prev, { type: 'user', text: command }]);
    setIsProcessingCommand(true);
    setChatInput('');

    try {
      // Parse the command
      let action = 'click';
      let value = command;
      let target = '';
      
      if (command.toLowerCase().startsWith('click ')) {
        action = 'click';
        target = command.substring(6).trim();
        value = target;
        console.log(`Parsed click command: target="${target}"`);
      } else if (command.toLowerCase().startsWith('type ')) {
        action = 'type';
        
        // Try to parse "type value in field" pattern
        const typeMatch = command.match(/^type\s+(["']?)(.+?)\1\s+(?:in|into|to)\s+(["']?)(.+?)\3$/);
        
        if (typeMatch) {
          value = typeMatch[2];
          target = typeMatch[4];
          console.log(`Parsed type command with regex: value="${value}", target="${target}"`);
        } else {
          // Simpler pattern: "type value in field"
          const parts = command.substring(5).trim().split(/\s+(?:in|into|to)\s+/);
          if (parts.length === 2) {
            value = parts[0].trim();
            target = parts[1].trim();
            console.log(`Parsed type command with split: value="${value}", target="${target}"`);
          } else {
            value = command.substring(5).trim();
            console.log(`Parsed simple type command: value="${value}", no target specified`);
          }
        }
      } else if (command.toLowerCase().startsWith('select ')) {
        action = 'select';
        
        // Try to parse "select option from dropdown" pattern
        const selectMatch = command.match(/^select\s+(["']?)(.+?)\1\s+(?:from|in)\s+(["']?)(.+?)\3$/);
        
        if (selectMatch) {
          value = selectMatch[2];
          target = selectMatch[4];
          console.log(`Parsed select command with regex: value="${value}", target="${target}"`);
        } else {
          // Simpler pattern: "select option from dropdown"
          const parts = command.substring(7).trim().split(/\s+(?:from|in)\s+/);
          if (parts.length === 2) {
            value = parts[0].trim();
            target = parts[1].trim();
            console.log(`Parsed select command with split: value="${value}", target="${target}"`);
          } else {
            value = command.substring(7).trim();
            console.log(`Parsed simple select command: value="${value}", no target specified`);
          }
        }
      }
      
      console.log(`Parsed command: action=${action}, target=${target}, value=${value}`);
      
      // Create a unique message ID for this command
      const messageId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a promise that will resolve when we get a response from the iframe
      const resultPromise = new Promise((resolve, reject) => {
        // Set up message listener for this specific command
        const messageHandler = (event: MessageEvent) => {
          console.log('Received message in handler:', event.data?.type, event.data);
          
          // Handle command acknowledgment
          if (event.data?.type === 'MCP_COMMAND_RECEIVED' && event.data?.messageId === messageId) {
            console.log('Command received by iframe:', messageId);
            // Don't remove listener yet, wait for the result
          }
          
          // Handle command result
          if (event.data?.type === 'MCP_COMMAND_RESULT' && event.data?.messageId === messageId) {
            console.log('Command result received:', event.data);
            window.removeEventListener('message', messageHandler);
            if (event.data.success) {
              resolve(event.data);
            } else {
              reject(new Error(event.data.error || 'Command failed'));
            }
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Set timeout to reject the promise if no response is received
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          console.error('Command timed out:', messageId);
          reject(new Error('Command timed out after 30 seconds'));
        }, 30000);
      });
      
      // Send the command to the iframe
      console.log('Looking for iframe to send command to...');
      const iframe = document.querySelector('iframe');
      
      if (!iframe) {
        console.error('No iframe found in the document');
        throw new Error('Cannot find iframe in the document');
      }
      
      if (!iframe.contentWindow) {
        console.error('Cannot access iframe contentWindow');
        throw new Error('Cannot access iframe content');
      }
      
      // First, check if the MCP script is loaded in the iframe
      console.log('Checking if MCP script is loaded in iframe...');
      
      // Set up a listener for script status check
      const scriptCheckPromise = new Promise<boolean>((resolve) => {
        const scriptCheckHandler = (event: MessageEvent) => {
          if (event.data?.type === 'MCP_SCRIPT_STATUS') {
            window.removeEventListener('message', scriptCheckHandler);
            console.log('Received script status:', event.data.loaded);
            resolve(!!event.data.loaded);
          }
        };
        
        window.addEventListener('message', scriptCheckHandler);
        
        // Set timeout for script check
        setTimeout(() => {
          window.removeEventListener('message', scriptCheckHandler);
          console.log('Script check timed out, assuming not loaded');
          resolve(false);
        }, 2000);
        
        // Send script check request
        iframe.contentWindow?.postMessage({
          type: 'MCP_CHECK_SCRIPT'
        }, '*');
      });
      
      // Wait for script check result
      const isScriptLoaded = await scriptCheckPromise;
      
      if (!isScriptLoaded) {
        console.warn('MCP script may not be loaded in iframe, attempting to reinject...');
        // Try to inject the script again
        const scriptContent = `
          (function() {
            if (!window.__MCP_LOADED__) {
              const script = document.createElement('script');
              script.src = '${window.location.origin}/mcp-script.js';
              script.onload = function() {
                console.log('MCP script loaded via emergency injection');
              };
              document.head.appendChild(script);
            }
          })();
        `;
        
        // Create a blob URL for the script
        const blob = new Blob([scriptContent], { type: 'text/javascript' });
        const scriptUrl = URL.createObjectURL(blob);
        
        // Send the script URL to the iframe
        iframe.contentWindow.postMessage({
          type: 'MCP_INJECT_SCRIPT',
          scriptUrl
        }, '*');
        
        // Wait a bit for the script to load
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('Sending command to iframe:', {
        type: 'MCP_EXECUTE_COMMAND',
        messageId,
        command: { action, target, value }
      });
      
      // Add global message listener for debugging that will stay active longer
      const debugMessageListener = (event: MessageEvent) => {
        if (event.data?.messageId === messageId) {
          console.log(`Received message for command ${messageId}:`, event.data);
        }
      };
      window.addEventListener('message', debugMessageListener);
      
      // Send the command
      iframe.contentWindow.postMessage({
        type: 'MCP_EXECUTE_COMMAND',
        messageId,
        command: {
          action,
          target,
          value,
        }
      }, '*');
      
      console.log('Message sent to iframe');
      
      // Remove debug listener after 30 seconds (matching the command timeout)
      setTimeout(() => {
        window.removeEventListener('message', debugMessageListener);
        console.log(`Removed debug listener for command ${messageId}`);
      }, 30000);
      
      // Wait for the result
      const iframeResult = await resultPromise as any;
      
      // Add the result to chat messages
      setChatMessages(prev => [...prev, { 
        type: 'system', 
        text: iframeResult.message || 'Command executed successfully'
      }]);
      
      // Add as a test step if successful
      if (iframeResult.success) {
        const newStep = {
          id: `step_${Date.now()}`,
          action,
          value,
          selector: iframeResult.selector || '',
          description: `Execute chat command: ${command}`
        };
        addTestStep(newStep);
      }
    } catch (error) {
      // Handle different error types
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setChatMessages(prev => [...prev, { type: 'system', text: errorMessage }]);
      toast.error(errorMessage);
    } finally {
      setIsProcessingCommand(false);
    }
  }, [websiteUrl, isIframeLoaded, currentTest?.id, addTestStep]);

  return {
    // State
    testName,
    testDescription,
    websiteUrl,
    activeStep,
    isSaving,
    isRunning,
    isIframeLoaded,
    isRecording,
    chatInput,
    chatMessages,
    isProcessingCommand,
    currentTest,

    // Setters
    setTestName,
    setTestDescription,
    setWebsiteUrl,
    setActiveStep,
    setIsIframeLoaded,
    setChatInput,

    // Handlers
    handleStartRecording,
    handleStopRecording,
    handleSaveTest,
    handleRunTest,
    handleClearTest,
    handleClearChat,
    handleChatCommand
  };
};
