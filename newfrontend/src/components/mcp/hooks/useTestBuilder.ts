import { useState, useEffect, useCallback, useRef } from 'react';
import { useMCP } from '../MCPClient'; // Assuming MCPClient exports useMCP
import toast from 'react-hot-toast';
import * as mcpService from '../../../services/mcpService';

interface TestStep {
  id: string;
  action: string;
  selector?: string;
  value?: string;
  timestamp?: number;
  description: string; // Made non-optional
}

interface MCPTest {
  id: string;
  name: string;
  description: string;
  websiteUrl?: string; // Made optional to align with mcpCurrentTest type
  steps: TestStep[];
  createdAt: number;
  updatedAt: number;
}

interface ChatMessage {
  type: 'user' | 'system' | 'error';
  text: string;
}

export const useTestBuilder = (iframeRef: React.RefObject<HTMLIFrameElement>) => {
  const {
    currentTest: mcpCurrentTest, // Renamed to avoid conflict
    startRecording: mcpStartRecording,
    stopRecording: mcpStopRecording,
    saveTest: mcpSaveTest,
    runTest: mcpRunTest,
    clearCurrentTest: mcpClearCurrentTest,
    addTestStep: mcpAddTestStep,
    connect,
    // isConnected, // Not directly used, connect() result is used
    // setupEventListeners // Assuming this is handled within MCPClient or not needed here
  } = useMCP();

  const [currentTest, setCurrentTest] = useState<MCPTest | null>(null);
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessagesInternal] = useState<ChatMessage[]>([]); // Renamed for clarity
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  // Browser automation state
  const [browserSession, setBrowserSession] = useState<mcpService.BrowserSession | null>(null);
  const [isAutomatedBrowser, setIsAutomatedBrowser] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const screenshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setChatMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setChatMessagesInternal(updater);
  }, []);

  // Initialize MCP client and check for browser automation service
  const createNewTest = useCallback(() => {
    const newId = `test-${Date.now()}`;
    const newTestObj: MCPTest = { 
      id: newId,
      name: 'New Test',
      description: 'A new test created via TestBuilder',
      websiteUrl: '',
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentTest(newTestObj);
    setTestName(newTestObj.name);
    setTestDescription(newTestObj.description);
    setWebsiteUrl(newTestObj.websiteUrl || ''); // Ensure string for setWebsiteUrl
    if (typeof mcpClearCurrentTest === 'function') mcpClearCurrentTest();
    if (typeof mcpSaveTest === 'function') mcpSaveTest(newTestObj);
    console.log('Created new test:', newTestObj);
  }, [mcpClearCurrentTest, mcpSaveTest, setCurrentTest, setTestName, setTestDescription, setWebsiteUrl]);

  // Initialize MCP client and check for browser automation service
  useEffect(() => {
    const initMcp = async () => {
      try {
        await connect(); // Establish connection
        const status = await mcpService.checkStatus();
        if (status && status.status === 'active') {
          setIsAutomatedBrowser(true);
          toast.success('Browser automation service is available.');
        } else {
          toast.error('Browser automation service not available. Falling back to iframe mode.');
          setIsAutomatedBrowser(false);
        }
      } catch (error) {
        console.error('Failed to initialize MCP client or check service status:', error);
        toast.error('MCP initialization failed. Using iframe mode.');
        setIsAutomatedBrowser(false);
      }
    };
    initMcp();

    return () => { // Cleanup
      if (browserSession?.sessionId) {
        mcpService.closeBrowserSession(browserSession.sessionId)
          .catch(err => console.error('Error closing browser session on unmount:', err));
      }
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }
    };
  }, [connect]); // Only re-run if connect changes

  // Sync with mcpCurrentTest
  useEffect(() => {
    if (mcpCurrentTest) {
      setCurrentTest(mcpCurrentTest);
      setTestName(mcpCurrentTest.name);
      setTestDescription(mcpCurrentTest.description);
      setWebsiteUrl(mcpCurrentTest.websiteUrl || '');
    } else if (!currentTest) { // If no mcpCurrentTest and no local currentTest, create one
      createNewTest();
    }
  }, [mcpCurrentTest, currentTest, createNewTest]); // Added currentTest to dependencies

  const handleStartRecording = useCallback(async () => {
    if (!websiteUrl) {
      toast.error('Please enter a website URL to start recording.');
      return;
    }
    try {
      new URL(websiteUrl); // Validate URL
    } catch (_) {
      toast.error('Invalid URL format.');
      return;
    }

    setIsRecording(true);

    if (isAutomatedBrowser) {
      try {
        toast.loading('Starting browser session...', { id: 'sessionToast' });
        let currentSession = browserSession;
        if (!currentSession || !currentSession.sessionId) {
            currentSession = await mcpService.createBrowserSession({}); // Pass options if any
            setBrowserSession(currentSession);
        }
        
        if (currentSession?.sessionId) {
            await mcpService.navigateToUrl(currentSession.sessionId, websiteUrl);
            toast.success(`Navigated to ${websiteUrl}`, { id: 'sessionToast' });

            if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current);
            screenshotIntervalRef.current = setInterval(async () => {
                try {
                    if (browserSession?.sessionId) { // Re-check session
                        const screenshotResult = await mcpService.takeScreenshot(browserSession.sessionId);
                        if (screenshotResult) {
                            if (typeof (screenshotResult as any).screenshot === 'string') {
                                setLastScreenshot(`data:image/jpeg;base64,${(screenshotResult as any).screenshot}`);
                            } else if (screenshotResult instanceof Blob) {
                                setLastScreenshot(URL.createObjectURL(screenshotResult));
                            } else {
                                console.error('Unexpected screenshot format from mcpService.takeScreenshot:', screenshotResult);
                                setLastScreenshot(null);
                            }
                        } else {
                            console.error('No screenshot data received from mcpService.takeScreenshot');
                            setLastScreenshot(null);
                        }
                    }
                } catch (err) {
                    console.error('Error taking screenshot:', err);
                    // Optionally stop interval if screenshot fails repeatedly
                }
            }, 3000);
        } else {
             throw new Error('Failed to create or retrieve browser session.');
        }
      } catch (error) {
        console.error('Browser automation start error:', error);
        toast.error(`Browser session error: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'sessionToast' });
        setIsAutomatedBrowser(false); // Fallback to iframe if session fails
        toast('Falling back to iframe recording mode.', { icon: 'ℹ️' });
        // Proceed with iframe recording
        if (typeof mcpStartRecording === 'function') mcpStartRecording(websiteUrl);
      }
    } else {
        // Standard iframe recording
        if (typeof mcpStartRecording === 'function') mcpStartRecording(websiteUrl);
    }
    toast.success('Recording started!');
  }, [websiteUrl, isAutomatedBrowser, browserSession, mcpStartRecording, setBrowserSession, setLastScreenshot, screenshotIntervalRef]);

  const handleStopRecording = useCallback(() => {
    if (typeof mcpStopRecording === 'function') mcpStopRecording();
    setIsRecording(false);
    if (screenshotIntervalRef.current) {
      clearInterval(screenshotIntervalRef.current);
      screenshotIntervalRef.current = null;
    }
    if (browserSession?.sessionId && isAutomatedBrowser) { // Only close if it was an automated session
        mcpService.closeBrowserSession(browserSession.sessionId)
            .then(() => {
                toast.success('Browser session closed.');
                setBrowserSession(null); // Clear session state
            })
            .catch(err => toast.error(`Failed to close browser session: ${err.message}`));
    }
    toast.success('Recording stopped.');
  }, [mcpStopRecording, browserSession, isAutomatedBrowser]);

  const handleSaveTest = useCallback(async () => {
    if (!currentTest) {
      toast.error('No test data to save.');
      return;
    }
    setIsSaving(true);
    const testToSave: MCPTest = { 
      ...currentTest,
      name: testName,
      description: testDescription,
      websiteUrl: websiteUrl,
      updatedAt: Date.now(),
    };
    try {
      if (typeof mcpSaveTest === 'function') {
        await mcpSaveTest(testToSave);
        toast.success('Test saved successfully!');
      } else {
        throw new Error("Save function not available.");
      }
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error(`Failed to save test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [currentTest, testName, testDescription, websiteUrl, mcpSaveTest]);

  const handleRunTest = useCallback(async () => {
    if (!currentTest?.id) {
      toast.error('No test selected to run.');
      return;
    }
    setIsRunning(true);
    try {
      if (typeof mcpRunTest === 'function') {
        await mcpRunTest(currentTest.id); // Assumes mcpRunTest handles UI updates or returns status
        toast.success(`Test "${currentTest.name}" run initiated.`);
      } else {
        throw new Error("Run function not available.");
      }
    } catch (error) {
      console.error('Error running test:', error);
      toast.error(`Failed to run test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [currentTest, mcpRunTest]);

  const handleClearTest = useCallback(() => {
    if (typeof mcpClearCurrentTest === 'function') mcpClearCurrentTest();
    createNewTest(); // This will also save the new empty test via useEffect in useMCP
    setChatMessagesInternal([]);
    setLastScreenshot(null);
    if (browserSession?.sessionId) {
        mcpService.closeBrowserSession(browserSession.sessionId)
            .then(() => setBrowserSession(null))
            .catch(err => console.error('Error clearing test session:', err));
    }
    toast.success('Test cleared and new test started.');
  }, [mcpClearCurrentTest, createNewTest, browserSession]);

  const addStepToTest = useCallback((stepData: Omit<TestStep, 'id' | 'timestamp'>) => {
    const newStep: TestStep = {
      ...stepData,
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    if (typeof mcpAddTestStep === 'function') {
        mcpAddTestStep(newStep); // This should update currentTest in useMCP context
        toast.success(`Step added: ${newStep.action} on ${newStep.selector || 'page'}`);
    } else {
        console.error("addTestStep function is not available from useMCP.");
        toast.error("Could not add step: MCP function unavailable.");
    }
  }, [mcpAddTestStep]);

  useEffect(() => {
    const messageHandler = (event: MessageEvent<any>) => { 
      if (event.data && event.data.type === 'MCP_IFRAME_EVENT' && isRecording) {
        const { action, selector, value, description: eventDescription } = event.data.payload;
        const stepDesc = eventDescription || `${action}${selector ? ` on ${selector}` : ''}${value ? ` with value '${value}'` : ''}`;
        
        if (currentTest && currentTest.steps && currentTest.steps.length > 0) {
            const lastStep = currentTest.steps[currentTest.steps.length - 1];
            if (lastStep.action === action && lastStep.selector === selector && lastStep.value === value) {
                console.log("Skipping duplicate step from iframe event:", stepDesc);
                return;
            }
        }

        addStepToTest({
          action: action,
          selector: selector,
          value: value,
          description: stepDesc || `Step ${currentTest && currentTest.steps ? currentTest.steps.length + 1 : 1}: ${action} ${selector || ''} ${value || ''}`.trim(),
        });
        setChatMessagesInternal(prev => [...prev, { type: 'system', text: `IFRAME EVENT: ${stepDesc}` }]);
        toast(`Step from iframe: ${stepDesc}`, { icon: '➡️' });
      } else if (event.data && event.data.type === 'IFRAME_LOADED') {
        setIsIframeLoaded(true);
        toast.success('Iframe content loaded.');
        setChatMessagesInternal(prev => [...prev, { type: 'system', text: 'Iframe content loaded and ready.'}]);
      }
    };

    window.addEventListener('message', messageHandler);
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [isRecording, addStepToTest, currentTest, setChatMessagesInternal, setIsIframeLoaded]);

  const executeIframeCommand = useCallback(async (actionCmd: string, targetSelector?: string, inputValue?: string): Promise<any> => {
    const iframe = iframeRef.current;
    if (!iframe) {
        toast.error('Iframe element not found.');
        setChatMessagesInternal(prev => [...prev, { type: 'error', text: 'Iframe element not found.' }]);
        return Promise.reject(new Error('Iframe element not found.'));
    }
    const contentWin = iframe.contentWindow;
    if (!contentWin) {
        toast.error('Iframe content window not accessible.');
        setChatMessagesInternal(prev => [...prev, { type: 'error', text: 'Iframe content window not accessible.' }]);
        return Promise.reject(new Error('Iframe content window not accessible.'));
    }



    const messageId = `mcp-cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        window.removeEventListener('message', listener);
        const errorMsg = `Iframe command timed out: ${actionCmd}`;
        setChatMessagesInternal(prev => [...prev, { type: 'error', text: errorMsg }]);
        toast.error(errorMsg);
        reject(new Error(errorMsg));
      }, 15000); 

      const listener = (event: MessageEvent<any>) => {
        if (event.data && event.data.type === 'MCP_COMMAND_RESPONSE' && event.data.messageId === messageId) {
          clearTimeout(timeoutId);
          window.removeEventListener('message', listener);
          if (event.data.status === 'success') {
            const successMsg = `Iframe command success: ${event.data.result || actionCmd}`;
            setChatMessagesInternal(prev => [...prev, { type: 'system', text: successMsg }]);
            resolve(event.data.result);
          } else {
            const errorMsg = `Iframe command error: ${event.data.error || 'Unknown error'}`;
            setChatMessagesInternal(prev => [...prev, { type: 'error', text: errorMsg }]);
            toast.error(errorMsg);
            reject(new Error(event.data.error || 'Iframe command failed'));
          }
        }
      };

      window.addEventListener('message', listener);

      console.log('Sending command to iframe:', { type: 'MCP_EXECUTE_COMMAND', messageId, command: { action: actionCmd, target: targetSelector, value: inputValue } });
      contentWin.postMessage({
        type: 'MCP_EXECUTE_COMMAND',
        messageId,
        command: {
          action: actionCmd,
          target: targetSelector,
          value: inputValue
        }
      }, '*'); 
    });
  }, [iframeRef, setChatMessagesInternal]);

  const handleChatCommand = useCallback(async () => {
    console.log("handleChatCommand called (Simplified)"); 
    if (!chatInput.trim()) {
        console.log("handleChatCommand: chatInput was empty or whitespace.");
        return;
    }
    console.log("handleChatCommand: chatInput is: ", chatInput);
  }, [chatInput]);

  const handleClearChat = useCallback(() => {
    setChatMessagesInternal([]);
  }, [setChatMessagesInternal]);

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
    chatMessages: chatMessages, // Expose the state variable
    isProcessingCommand,
    currentTest, 
    browserSession,
    isAutomatedBrowser,
    lastScreenshot,

    // Setters
    setTestName,
    setTestDescription,
    setWebsiteUrl,
    setActiveStep,
    setIsIframeLoaded, 
    setChatInput,
    // setChatMessages is not directly exposed if setChatMessagesInternal is used internally.
    // If TestBuilder needs to directly set messages, expose setChatMessagesInternal as setChatMessages.

    // Handlers
    handleStartRecording,
    handleStopRecording,
    handleSaveTest,
    handleRunTest,
    handleClearTest,
    handleClearChat,
    handleChatCommand,
  };
};