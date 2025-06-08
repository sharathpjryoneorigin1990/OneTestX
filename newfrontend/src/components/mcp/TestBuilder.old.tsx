'use client';

import React from 'react';
import { useTestBuilder } from './hooks/useTestBuilder';
import { TestHeader } from './components/TestHeader';
import { TestSteps } from './components/TestSteps';
import { ChatInterface } from './components/ChatInterface';
import { FiMessageCircle } from 'react-icons/fi';

export const TestBuilder = () => {
  const {
    testName,
    testDescription,
    websiteUrl,
    activeStep,
    isSaving,
    isRunning,
    isRecording,
    chatInput,
    chatMessages,
    isProcessingCommand,
    currentTest,
    setTestName,
    setTestDescription,
    setWebsiteUrl,
    setActiveStep,
    setChatInput,
    handleStartRecording,
    handleStopRecording,
    handleSaveTest,
    handleRunTest,
    handleClearTest,
    handleClearChat,
    handleChatCommand
  } = useTestBuilder();
  const {
    testName,
    testDescription,
    websiteUrl,
    activeStep,
    isSaving,
    isRunning,
    isRecording,
    chatInput,
    chatMessages,
    isProcessingCommand,
    currentTest,
    setTestName,
    setTestDescription,
    setWebsiteUrl,
    setActiveStep,
    setChatInput,
    handleStartRecording,
    handleStopRecording,
    handleSaveTest,
    handleRunTest,
    handleClearTest,
    handleClearChat,
    handleChatCommand
  } = useTestBuilder();

  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Chat interface state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'system', text: string}>>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
  
  // Scroll chat to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && chatMessages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Initialize form with current test data and create a new test if none exists
  useEffect(() => {
    console.log('Current test changed:', currentTest);
    
    if (currentTest) {
      setTestName(currentTest.name);
      setTestDescription(currentTest.description);
      setWebsiteUrl(currentTest.websiteUrl || '');
    } else {
      // Create a new test if none exists
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
      // Use the MCPClient to set the current test
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
    }
  }, [currentTest, clearCurrentTest, saveTest]);

  // Handle start recording
  const handleStartRecording = useCallback(() => {
    try {
      if (!websiteUrl) {
        toast.error('Please enter a website URL');
        return;
      }

      // Start recording
      const success = startRecording(websiteUrl);
      if (success) {
        // Try to inject the script into the iframe
        try {
          const iframeWindow = iframeRef.current?.contentWindow;
          if (iframeWindow) {
            // Get the iframe's origin for secure messaging
            const iframeOrigin = iframeRef.current?.src ? new URL(iframeRef.current.src).origin : window.location.origin;
            
            iframeWindow.postMessage({ type: 'MCP_START_RECORDING' }, iframeOrigin);
            console.log('MCP: Start recording message sent to iframe with origin:', iframeOrigin);
          }
        } catch (error) {
          console.error('MCP: Failed to send start recording message:', error);
          return false;
        }
        
        setIsRecording(true);
        toast.success('Recording started');
      } else {
        toast.error('Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error starting recording');
    }
  }, [startRecording, websiteUrl]);

  // Handle stop recording
  const handleStopRecording = useCallback(() => {
    try {
      // Send stop recording message to iframe
      try {
        const iframeWindow = iframeRef.current?.contentWindow;
        if (iframeWindow) {
          // Get the iframe's origin for secure messaging
          const iframeOrigin = iframeRef.current?.src ? new URL(iframeRef.current.src).origin : window.location.origin;
          
          iframeWindow.postMessage({ type: 'MCP_STOP_RECORDING' }, iframeOrigin);
          console.log('MCP: Stop recording message sent to iframe with origin:', iframeOrigin);
        }
      } catch (error) {
        console.error('MCP: Failed to send stop recording message:', error);
      }
      
      stopRecording();
      setIsRecording(false);
      toast.success('Recording stopped');
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Error stopping recording');
    }
  }, [stopRecording]);

  // Set up event listeners for iframe messages
  useEffect(() => {
    console.log('Setting up message event listeners');
    
    // Use the setupEventListeners from MCPClient context to handle window messages
    const cleanup = setupEventListeners ? setupEventListeners(window) : null;
    if (cleanup) {
      console.log('Event listeners set up with MCPClient.setupEventListeners');
    }
    
    // Also set up our own handler for additional processing
    const handleMessage = (event: MessageEvent) => {
      console.group('=== Message Received in TestBuilder ===');
      console.log('Message origin:', event.origin);
      console.log('Message data:', event.data);
      
      // Accept messages from any origin when in test builder mode
      // This is necessary because the iframe might load content from different origins
      
      try {
        if (event.data?.type) {
          console.log(`Processing message type: ${event.data.type}`);
          
          if (event.data.type === 'MCP_EVENT') {
            if (!isRecording) {
              console.log('Ignoring MCP_EVENT: not in recording mode');
              return;
            }
            
            console.log('Processing MCP_EVENT:', event.data.payload);
            const { action, selector, value } = event.data.payload;
            
            if (!action || !selector) {
              console.warn('Invalid MCP_EVENT: missing action or selector', event.data);
              return;
            }
            
            console.log('Calling addTestStep with:', { action, selector, value });
            addTestStep({
              action,
              selector,
              value: value || '',
              description: `Performed ${action} on ${selector}`,
            });
            console.log('addTestStep called successfully');
          } 
          else if (event.data.type === 'MCP_SCRIPT_READY') {
            console.log('MCP script is ready in iframe');
            toast.success('Ready to record interactions');
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      } finally {
        console.groupEnd();
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('Window message listener added');

    return () => {
      console.log('Cleaning up message event listener');
      window.removeEventListener('message', handleMessage);
      if (cleanup) {
        cleanup();
      }
    };
  }, [addTestStep, isRecording, setupEventListeners]);

  // Inject script into iframe to capture events
  const injectScript = useCallback((iframe: HTMLIFrameElement, attempt = 1) => {
    if (!iframe) {
      console.log('No iframe reference provided');
      return;
    }

    console.log(`Attempting to inject script (attempt ${attempt})`);
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY = 500; // ms

    // Create a script element
    const script = document.createElement('script');
    script.setAttribute('data-mcp-injected', 'true');
    
    // Set script src to the pre-built MCP script
    script.src = '/mcp-script.js';

    // Handle script load/error events
    script.onload = () => {
      console.log('MCP: Script loaded successfully');
    };

    script.onerror = (error) => {
      console.error('MCP: Failed to load script:', error);
      
      // Retry if we haven't exceeded max attempts
      if (attempt < MAX_ATTEMPTS) {
        console.log(`Retrying injection (${attempt + 1}/${MAX_ATTEMPTS})...`);
        setTimeout(() => injectScript(iframe, attempt + 1), RETRY_DELAY * attempt);
      } else {
        console.error('MCP: Max injection attempts reached');
        toast.error('Failed to initialize recording script');
      }
    };

    // Try to inject the script into the iframe
    try {
      // First try to access the iframe document directly (same-origin)
      try {
        const iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
        if (iframeDoc && iframeDoc.documentElement) {
          if (!iframeDoc.querySelector('script[data-mcp-injected]')) {
            iframeDoc.documentElement.appendChild(script);
            console.log('MCP: Script injected directly into iframe');
            return; // Successfully injected, no need for fallback
          }
        }
      } catch (accessError) {
        console.log('MCP: Cannot access iframe document directly (likely cross-origin):', accessError);
        // Continue to fallback
      }
      
      // Fallback: Use postMessage to communicate with the iframe
      if (iframe.contentWindow) {
        // Determine the correct target origin
        const targetOrigin = iframe.src.startsWith(window.location.origin) 
          ? window.location.origin 
          : new URL(iframe.src).origin;
          
        console.log('MCP: Using target origin for postMessage:', targetOrigin);
        
        // Send the script injection message via postMessage
        iframe.contentWindow.postMessage({
          type: 'MCP_INJECT_SCRIPT',
          scriptSrc: '/mcp-script.js'
        }, targetOrigin);
        console.log('MCP: Script injection message sent to iframe');
      }
    } catch (error) {
      console.error('MCP: Error during script injection process:', error);
    }
  }, []);

  // Use a ref callback to handle the iframe reference
  const setIframeRef = useCallback((node: HTMLIFrameElement | null) => {
    // When the ref is first set or changes
    if (node) {
      console.log('Iframe ref set, injecting script...');
      
      // Store the node in the ref
      if (iframeRef) {
        // Use Object.defineProperty to work around the read-only limitation
        Object.defineProperty(iframeRef, 'current', {
          value: node,
          writable: true
        });
      }
      
      // Check if already loaded
      if (node.contentDocument && node.contentDocument.readyState === 'complete') {
        console.log('Iframe already loaded, injecting script');
        injectScript(node);
      } else {
        // Add load event listener for when iframe loads
        const onLoad = () => {
          console.log('Iframe loaded, attempting to inject script');
          injectScript(node);
          node.removeEventListener('load', onLoad);
        };
        
        node.addEventListener('load', onLoad);
      }
    }
  }, [injectScript]);

  // Enable/disable buttons based on state
  const isStartButtonDisabled = !websiteUrl || isRecording;
  const isStopButtonDisabled = !isRecording;
  const isSaveButtonDisabled = !currentTest?.steps?.length || isRecording || isSaving;
  const isRunButtonDisabled = !currentTest?.steps?.length || isRunning;
  const isClearButtonDisabled = !currentTest?.steps?.length || isRecording || isRunning;

  const handleSaveTest = async () => {
    if (!testName.trim()) {
      alert('Please enter a test name');
      return;
    }

    if (!websiteUrl.trim()) {
      alert('Please enter a website URL');
      return;
    }

    setIsSaving(true);
    try {
      await saveTest({
        name: testName,
        description: testDescription,
        websiteUrl: websiteUrl,
        steps: currentTest?.steps || []
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTest = async () => {
    if (!websiteUrl) {
      alert('Please enter a website URL first');
      return;
    }
    
    if (!currentTest?.id) {
      alert('No test to run. Please save the test first.');
      return;
    }
    
    setIsRunning(true);
    try {
      await runTest(currentTest.id);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearTest = () => {
    if (window.confirm('Are you sure you want to clear the current test?')) {
      clearCurrentTest();
    }
  };

  // Clear chat messages
  const handleClearChat = () => {
    setChatMessages([]);
  };

  const handleChatCommand = async (command: string) => {
    if (!isRecording) {
      toast.error('Start recording first to use commands');
      return;
    }
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { type: 'user', text: command }]);
    setIsProcessingCommand(true);
    
    // Clear the input field
    setChatInput('');
    
    try {
      // First, try to send the command to the MCP server
      try {
        const response = await fetch('/api/mcp/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Command was successfully processed by MCP
            setChatMessages(prev => [...prev, { 
              type: 'system', 
              text: result.message || 'Command executed successfully' 
            }]);
            
            // Add the step to our test
            if (result.step) {
              addTestStep(result.step);
            }
            
            setIsProcessingCommand(false);
            return;
          }
        }
      } catch (mcpError) {
        console.error('Error sending command to MCP server:', mcpError);
        // Continue with fallback processing
      }
      
      // Fallback: Process the command locally if MCP server fails
      console.log('Falling back to local command processing');
      
      // Process the command
      if (command.toLowerCase().startsWith('navigate to') || command.toLowerCase().startsWith('go to')) {
        const url = command.split(/navigate to|go to/i)[1].trim();
        if (url) {
          // Update the website URL in the TestBuilder
          setWebsiteUrl(url.startsWith('http') ? url : `https://${url}`);
          
          // Add system response
          setChatMessages(prev => [...prev, { type: 'system', text: `Navigating to ${url}...` }]);
          
          // Add this as a test step
          addTestStep({
            action: 'navigate',
            value: url.startsWith('http') ? url : `https://${url}`,
            description: `Navigate to ${url}`
          });
          
          // Try to navigate the iframe
          try {
            if (iframeRef.current) {
              iframeRef.current.src = url.startsWith('http') ? url : `https://${url}`;
            }
          } catch (navError) {
            console.error('Error navigating iframe:', navError);
          }
        }
      } else if (command.toLowerCase().includes('click') || command.toLowerCase().includes('press')) {
        // Extract the element to click on
        const match = command.match(/click(?:\s+on)?\s+(?:the\s+)?(.*?)(?:\s+button|\s+link|\s+element|$)/i);
        const element = match ? match[1].trim() : null;
        
        if (element) {
          // Add system response
          setChatMessages(prev => [...prev, { type: 'system', text: `Clicking on "${element}"...` }]);
          
          // Add this as a test step
          addTestStep({
            action: 'click',
            selector: element,
            description: `Click on ${element}`
          });
          
          // Try to send click command to iframe
          try {
            if (iframeRef.current?.contentWindow) {
              const iframeOrigin = iframeRef.current?.src ? new URL(iframeRef.current.src).origin : window.location.origin;
              iframeRef.current.contentWindow.postMessage({
                type: 'MCP_EXECUTE_COMMAND',
                action: 'click',
                selector: element
              }, iframeOrigin);
            }
          } catch (clickError) {
            console.error('Error sending click command to iframe:', clickError);
          }
        } else {
          setChatMessages(prev => [...prev, { type: 'system', text: 'Please specify what to click on.' }]);
        }
      } else if (command.toLowerCase().includes('type') || command.toLowerCase().includes('enter') || command.toLowerCase().includes('input') || command.toLowerCase().includes('fill')) {
        // Extract what to type and where
        const typeMatch = command.match(/(?:type|enter|input|fill)\s+(?:"([^"]*)"|'([^']*)'|([^\s]+))(?:\s+(?:in|into|on)\s+(?:the\s+)?(.*?)(?:\s+field|\s+input|\s+box|$))?/i);
        
        if (typeMatch) {
          const textToType = typeMatch[1] || typeMatch[2] || typeMatch[3];
          let fieldElement = typeMatch[4] ? typeMatch[4].trim() : 'active field';
          
          // Generate better selectors based on the field description
          let selectors = [];
          
          // Try to create a more specific selector
          if (fieldElement !== 'active field') {
            // Common input types
            if (fieldElement.includes('email')) {
              selectors.push('input[type="email"]');
              selectors.push('input[name*="email"]');
              selectors.push('input[placeholder*="email" i]');
              selectors.push('input[id*="email" i]');
            } else if (fieldElement.includes('password')) {
              selectors.push('input[type="password"]');
            } else if (fieldElement.includes('search')) {
              selectors.push('input[type="search"]');
              selectors.push('input[name*="search" i]');
              selectors.push('input[placeholder*="search" i]');
            } else if (fieldElement.includes('name')) {
              selectors.push('input[name*="name" i]');
              selectors.push('input[placeholder*="name" i]');
              selectors.push('input[id*="name" i]');
            } else {
              // Generic selectors based on the field description
              selectors.push(`input[placeholder*="${fieldElement}" i]`);
              selectors.push(`input[name*="${fieldElement}" i]`);
              selectors.push(`input[id*="${fieldElement}" i]`);
              selectors.push(`textarea[placeholder*="${fieldElement}" i]`);
              selectors.push(`textarea[name*="${fieldElement}" i]`);
              selectors.push(`textarea[id*="${fieldElement}" i]`);
              selectors.push(`label:contains("${fieldElement}") + input`);
              selectors.push(`label:contains("${fieldElement}") + textarea`);
            }
            
            // Also add the original field element as a fallback
            selectors.push(fieldElement);
          } else {
            // If no specific field was mentioned, try common input selectors
            selectors.push('input:focus');
            selectors.push('textarea:focus');
            selectors.push('input:not([type="hidden"])');
          }
          
          // Add system response
          setChatMessages(prev => [...prev, { type: 'system', text: `Typing "${textToType}" in ${fieldElement}...` }]);
          
          // Add this as a test step with the first selector for recording purposes
          addTestStep({
            action: 'type',
            selector: selectors[0],
            value: textToType,
            description: `Type "${textToType}" in ${fieldElement}`
          });
          
          // Try to send type command to iframe with all possible selectors
          try {
            if (iframeRef.current?.contentWindow) {
              const iframeOrigin = iframeRef.current?.src ? new URL(iframeRef.current.src).origin : window.location.origin;
              iframeRef.current.contentWindow.postMessage({
                type: 'MCP_EXECUTE_COMMAND',
                action: 'type',
                selectors: selectors, // Send all possible selectors
                value: textToType
              }, iframeOrigin);
            }
          } catch (typeError) {
            console.error('Error sending type command to iframe:', typeError);
          }
        } else {
          setChatMessages(prev => [...prev, { type: 'system', text: 'Please specify what to type and where.' }]);
        }
      } else if (command.toLowerCase().includes('wait') || command.toLowerCase().includes('pause')) {
        // Extract time to wait
        const waitMatch = command.match(/(\d+)\s*(?:seconds|second|s|ms|milliseconds)/i);
        const waitTime = waitMatch ? parseInt(waitMatch[1]) : 1;
        
        // Add system response
        setChatMessages(prev => [...prev, { type: 'system', text: `Waiting for ${waitTime} second(s)...` }]);
        
        // Add this as a test step
        addTestStep({
          action: 'wait',
          value: `${waitTime * 1000}`, // Convert to milliseconds
          description: `Wait for ${waitTime} second(s)`
        });
      } else if (command.toLowerCase().includes('select') || command.toLowerCase().includes('choose')) {
        // Extract what to select and from where
        const selectMatch = command.match(/(?:select|choose)\s+(?:"([^"]*)"|'([^']*)'|([^\s]+))(?:\s+(?:from|in|on)\s+(?:the\s+)?(.*?)(?:\s+dropdown|\s+select|\s+menu|$))?/i);
        
        if (selectMatch) {
          const optionToSelect = selectMatch[1] || selectMatch[2] || selectMatch[3];
          const dropdownElement = selectMatch[4] ? selectMatch[4].trim() : 'dropdown';
          
          // Add system response
          setChatMessages(prev => [...prev, { type: 'system', text: `Selecting "${optionToSelect}" from ${dropdownElement}...` }]);
          
          // Add this as a test step
          addTestStep({
            action: 'select',
            selector: dropdownElement,
            value: optionToSelect,
            description: `Select "${optionToSelect}" from ${dropdownElement}`
          });
          
          // Try to send select command to iframe
          try {
            if (iframeRef.current?.contentWindow) {
              const iframeOrigin = iframeRef.current?.src ? new URL(iframeRef.current.src).origin : window.location.origin;
              iframeRef.current.contentWindow.postMessage({
                type: 'MCP_EXECUTE_COMMAND',
                action: 'select',
                selector: dropdownElement,
                value: optionToSelect
              }, iframeOrigin);
            }
          } catch (selectError) {
            console.error('Error sending select command to iframe:', selectError);
          }
        } else {
          setChatMessages(prev => [...prev, { type: 'system', text: 'Please specify what to select and from where.' }]);
        }
      } else {
        // Unknown command
        setChatMessages(prev => [...prev, { 
          type: 'system', 
          text: 'I didn\'t understand that command. Try commands like "click on login button", "type email@example.com in email field", or "navigate to https://example.com".' 
        }]);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      setChatMessages(prev => [...prev, { 
        type: 'system', 
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error processing command'}` 
      }]);
    } finally {
      setIsProcessingCommand(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Website URL Input */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="website-url" className="block text-sm font-medium text-gray-300 mb-1">
              Website URL
            </label>
            <div className="flex rounded-md shadow-sm">
              <input
                type="url"
                id="website-url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={isRecording}
              />
              <button
                onClick={() => window.open(websiteUrl, '_blank', 'noopener,noreferrer')}
                disabled={!websiteUrl || isRecording}
                className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Open in new tab"
              >
                <FiExternalLink className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="relative h-[600px] bg-black">
            <iframe
              ref={setIframeRef}
              src={websiteUrl}
              className={`w-full h-full border-0 ${isRecording ? 'z-10' : ''}`}
              title="Website Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
              allow="clipboard-read; clipboard-write; accelerometer; autoplay; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; xr-spatial-tracking"
              onLoad={(e) => {
                console.log('Iframe load event fired');
                setIsIframeLoaded(true);
                // Add a small delay to ensure the iframe is fully ready
                setTimeout(() => {
                  if (iframeRef.current) {
                    injectScript(iframeRef.current);
                  }
                }, 500);
              }}
              onError={(e) => {
                console.error('Iframe error:', e);
                toast.error('Failed to load the website');
              }}
              style={{ 
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
            />
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-xl pointer-events-auto">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white mb-2">
                    <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
                    Recording
                  onClick={() => window.open(websiteUrl, '_blank', 'noopener,noreferrer')}
                  disabled={!websiteUrl}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <FiExternalLink className="mr-1 h-3 w-3" /> Open in new tab
                </button>
              </div>
            </div>
            <div className="relative h-[600px] bg-black">
              <iframe
                ref={setIframeRef}
                src={websiteUrl}
                className={`w-full h-full border-0 ${isRecording ? 'z-10' : ''}`}
                title="Website Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
                allow="clipboard-read; clipboard-write; accelerometer; autoplay; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; xr-spatial-tracking"
                onLoad={(e) => {
                  console.log('Iframe load event fired');
                  setIsIframeLoaded(true);
                  // Add a small delay to ensure the iframe is fully ready
                  setTimeout(() => {
                    if (iframeRef.current) {
                      injectScript(iframeRef.current);
                    }
                  }, 500);
                }}
                onError={(e) => {
                  console.error('Iframe error:', e);
                  toast.error('Failed to load the website');
                }}
                style={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
              />
              {isRecording && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-xl pointer-events-auto">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white mb-2">
                      <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
                      Recording
                    </div>
                    <p className="text-white">Interact with the page to record actions</p>
                    <p className="text-gray-400 text-sm mt-1">Click "Stop Recording" when done</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Interface - Right Side */}
          <div className="bg-gray-800 rounded-lg overflow-hidden lg:w-1/3 flex flex-col">
            <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white flex items-center">
                <FiMessageCircle className="mr-2" /> Chat Assistant
              </h3>
              {isProcessingCommand && (
                <span className="text-xs text-yellow-400 animate-pulse">Processing command...</span>
              )}
            </div>
            <div className="p-4 flex-grow overflow-y-auto h-[450px]" ref={chatContainerRef}>
              {chatMessages.length > 0 ? (
                <div className="space-y-3">
                  {chatMessages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-3/4 rounded-lg px-4 py-2 ${message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-200'}`}
                      >
                        {message.text}
                      </div>
        </div>
      </div>

      {/* Chat Interface - Right Side */}
      <div className="bg-gray-800 rounded-lg overflow-hidden lg:w-1/3 flex flex-col">
        <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white flex items-center">
            <FiMessageCircle className="mr-2" /> Chat Assistant
          </h3>
          {isProcessingCommand && (
            <span className="text-xs text-yellow-400 animate-pulse">Processing command...</span>
          )}
        </div>
        <ChatInterface
          messages={chatMessages}
          inputValue={chatInput}
          isProcessing={isProcessingCommand}
          isRecording={isRecording}
          onInputChange={setChatInput}
          onSendMessage={() => handleChatCommand(chatInput)}
          onClearChat={handleClearChat}
        />
      </div>

      {/* Test Steps */}
      <TestSteps
        steps={currentTest?.steps || []}
        activeStep={activeStep}
        isRecording={isRecording}
        onStepClick={setActiveStep}
      />
    </div>
  );
};

export default TestBuilder;
