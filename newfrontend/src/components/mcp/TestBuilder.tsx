'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMCP } from './MCPClient';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiStopCircle, FiSave, FiTrash2, FiEdit2, FiX, FiPlus, FiChevronDown, FiChevronUp, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const TestBuilder = () => {
  const {
    currentTest,
    startRecording,
    stopRecording,
    saveTest,
    runTest,
    clearCurrentTest,
    addTestStep,
    connect,
    isConnected
  } = useMCP();

  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Initialize form with current test data
  useEffect(() => {
    if (currentTest) {
      setTestName(currentTest.name);
      setTestDescription(currentTest.description);
      setWebsiteUrl(currentTest.websiteUrl || '');
    }
  }, [currentTest]);

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
      stopRecording();
      setIsRecording(false);
      toast.success('Recording stopped');
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Error stopping recording');
    }
  }, [stopRecording]);

  // Handle iframe messages
  useEffect(() => {
    console.log('Setting up message handler...');
    console.log('Current state - isConnected:', isConnected, 'isRecording:', isRecording, 'addTestStep:', !!addTestStep);

    if (!isConnected) {
      console.log('MCP client not connected, skipping message handler setup');
      return;
    }

    console.log('Adding window message listener...');
    
    const handleMessage = (event: MessageEvent) => {
      console.group('=== Message Received ===');
      console.log('Message origin:', event.origin);
      console.log('Message data:', event.data);
      
      // For security, verify the message is from our own origin
      if (event.origin !== window.location.origin) {
        console.warn('Message received from unexpected origin:', event.origin);
        console.groupEnd();
        return;
      }
      
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
      console.log('Removing window message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [isConnected, isRecording, addTestStep]);

  // Inject script into iframe to capture events
  const injectScript = useCallback((iframe: HTMLIFrameElement, attempt = 1) => {
    if (!iframe) {
      console.log('No iframe reference provided');
      return;
    }

    console.log(`Attempting to inject script (attempt ${attempt})`);
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY = 500; // ms

    // Create a script element in the parent document
    const script = document.createElement('script');
    script.setAttribute('data-mcp-injected', 'true');
    
    // Create a data URL with the script content
    const scriptContent = `
      (function() {
        console.log('MCP: Injected script running in iframe');
        
        // Helper to generate a unique ID for debugging
        const scriptId = 'mcp_' + Math.random().toString(36).substr(2, 9);
        console.log('MCP: Script instance:', scriptId);
        
        function getSelector(element) {
          if (!element) return '';
          
          // Try to get the best selector
          if (element.id) return '#' + element.id;
          
          // Try data-testid
          if (element.getAttribute('data-testid')) {
            return '[data-testid="' + element.getAttribute('data-testid') + '"]';
          }
          
          // Try name
          if (element.getAttribute('name')) {
            return '[name="' + element.getAttribute('name') + '"]';
          }
          
          // Try class
          if (element.className && typeof element.className === 'string') {
            return '.' + element.tagName.toLowerCase() + '.' + element.className.split(/\\s+/).filter(Boolean).join('.');
          }
          
          // Fall back to tag name with index
          if (element.parentNode) {
            const siblings = Array.from(element.parentNode.children);
            const index = siblings.indexOf(element) + 1;
            return element.tagName.toLowerCase() + ':nth-child(' + index + ')';
          }
          
          return element.tagName.toLowerCase();
        }

        function handleElementAction(event) {
          try {
            const target = event.target;
            if (!target || !target.tagName) {
              console.log('MCP: No valid target for event', event.type);
              return;
            }
            
            // Skip events that are already handled
            if (event.type === 'input' && event.inputType === 'insertReplacementText') {
              return;
            }
            
            const action = event.type;
            const selector = getSelector(target);
            let value = '';

            // Get value for form elements
            if (target.value !== undefined) {
              value = target.value;
            }
            
            // Skip if no meaningful selector
            if (!selector || selector === 'html' || selector === 'body') {
              console.log('MCP: Skipping event with invalid selector:', selector);
              return;
            }

            console.group('MCP: Captured action:', scriptId);
            console.log('Action:', action);
            console.log('Selector:', selector);
            console.log('Element:', target);
            console.log('Value:', value);
            
            // Prepare message
            const message = {
              type: 'MCP_EVENT',
              payload: { 
                action, 
                selector, 
                value,
                timestamp: Date.now(),
                href: window.location.href,
                scriptId
              }
            };
            
            console.log('Sending message to parent:', message);
            
            // Send message to parent with target origin
            window.parent.postMessage(message, '${window.location.origin}');
            console.log('Message sent to parent');
            
          } catch (error) {
            console.error('MCP: Error in handleElementAction:', error);
          } finally {
            console.groupEnd();
          }
        }


        // Add event listeners
        function setupEventListeners() {
          console.log('MCP: Setting up event listeners for script:', scriptId);
          
          const events = ['click', 'change', 'input', 'submit', 'keydown'];
          events.forEach(eventType => {
            console.log('MCP: Adding listener for:', eventType);
            document.addEventListener(eventType, handleElementAction, { capture: true, passive: true });
          });

          // Notify parent that script is ready
          try {
            window.parent.postMessage({ 
              type: 'MCP_SCRIPT_READY',
              payload: { 
                scriptId, 
                href: window.location.href,
                timestamp: Date.now()
              }
            }, '${window.location.origin}');
            console.log('MCP: Script initialized and ready:', scriptId);
          } catch (error) {
            console.error('MCP: Failed to send ready message:', error);
          }
          
          return function cleanup() {
            console.log('MCP: Cleaning up event listeners for script:', scriptId);
            events.forEach(eventType => {
              document.removeEventListener(eventType, handleElementAction, { capture: true });
            });
          };
        }

        // Initialize
        const cleanup = setupEventListeners();
        
        // Cleanup function if needed
        window.addEventListener('unload', () => {
          console.log('MCP: Iframe unloaded, cleaning up:', scriptId);
          cleanup();
        });
      })();
    `;

    // Create a Blob with the script content
    const blob = new Blob([scriptContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    script.src = url;

    // Handle script load/error events
    script.onload = () => {
      console.log('MCP: Script loaded successfully');
      URL.revokeObjectURL(url);
      
      // Try to inject the script into the iframe
      try {
        // This will only work if the iframe is same-origin
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          if (!iframeDoc.querySelector('script[data-mcp-injected]')) {
            iframeDoc.documentElement.appendChild(script);
            console.log('MCP: Script injected directly into iframe');
          }
        } else {
          // Fallback: execute script in the iframe's context
          const scriptContent = script.textContent || '';
          if (scriptContent) {
            iframe.contentWindow?.postMessage({
              type: 'MCP_INJECT_SCRIPT',
              script: scriptContent
            }, '*');
            console.log('MCP: Script injection message sent to iframe');
          }
        }
      } catch (error) {
        console.error('MCP: Error injecting script into iframe:', error);
        // Fallback: execute script in the iframe's context
        const scriptContent = script.textContent || '';
        if (scriptContent) {
          iframe.contentWindow?.postMessage({
            type: 'MCP_INJECT_SCRIPT',
            script: scriptContent
          }, '*');
          console.log('MCP: Fallback script injection message sent to iframe');
        }
      }
    };

    script.onerror = (error) => {
      console.error('MCP: Failed to load script:', error);
      URL.revokeObjectURL(url);
      
      // Retry if we haven't exceeded max attempts
      if (attempt < MAX_ATTEMPTS) {
        console.log(`Retrying injection (${attempt + 1}/${MAX_ATTEMPTS})...`);
        setTimeout(() => injectScript(iframe, attempt + 1), RETRY_DELAY * attempt);
      } else {
        console.error('MCP: Max injection attempts reached');
        toast.error('Failed to initialize recording script');
      }
    };

    // Append the script to the parent document to load it
    document.body.appendChild(script);
    
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
        </div>
      </div>

      {/* Website Preview */}
      {websiteUrl && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-gray-700 px-4 py-2">
            <span className="text-sm font-medium text-gray-300">Website Preview</span>
            <div className="flex space-x-2">
              <button
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
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
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
      )}

      {/* Test Controls */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="test-name" className="block text-sm font-medium text-gray-300 mb-1">
                Test Name *
              </label>
              <input
                type="text"
                id="test-name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="My Test Case"
                disabled={isRecording}
              />
            </div>
            <div>
              <label htmlFor="test-description" className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                id="test-description"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="What does this test do?"
                disabled={isRecording}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isStartButtonDisabled}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPlay className="mr-2 h-4 w-4" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                disabled={isStopButtonDisabled}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiStopCircle className="mr-2 h-4 w-4" />
                Stop Recording
              </button>
            )}

            <button
              onClick={handleSaveTest}
              disabled={isSaveButtonDisabled}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave className="mr-2 h-4 w-4" />
              Save Test
            </button>

            <button
              onClick={handleRunTest}
              disabled={isRunButtonDisabled}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlay className="mr-2 h-4 w-4" />
              Run Test
            </button>

            <button
              onClick={handleClearTest}
              disabled={isClearButtonDisabled}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiTrash2 className="mr-2 h-4 w-4" />
              Clear Test
            </button>
          </div>
        </div>
      </div>

      {/* Test Steps */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
          <h3 className="text-lg font-medium text-white">
            Test Steps {currentTest?.steps?.length ? `(${currentTest.steps.length})` : ''}
          </h3>
        </div>
        
        {currentTest?.steps?.length ? (
          <div className="divide-y divide-gray-700">
            <AnimatePresence>
              {currentTest.steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 hover:bg-gray-750">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setActiveStep(activeStep === index ? null : index)}
                    >
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="font-medium text-white">
                          {step.action} {step.selector ? `on ${step.selector}` : ''}
                        </span>
                      </div>
                      {activeStep === index ? (
                        <FiChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    {activeStep === index && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 pl-9 text-sm text-gray-300 space-y-2"
                      >
                        <div>
                          <span className="font-medium">Action:</span> {step.action}
                        </div>
                        {step.selector && (
                          <div>
                            <span className="font-medium">Selector:</span> {step.selector}
                          </div>
                        )}
                        {step.value && (
                          <div>
                            <span className="font-medium">Value:</span> {step.value}
                          </div>
                        )}
                        {step.timestamp && (
                          <div className="text-xs text-gray-500">
                            {new Date(step.timestamp).toLocaleString()}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <FiPlay className="w-8 h-8 text-gray-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-300 mb-1">No steps recorded yet</h4>
            <p className="max-w-xs text-sm">
              {isRecording 
                ? 'Interact with the page to record actions'
                : 'Click "Start Recording" to start recording actions'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestBuilder;
