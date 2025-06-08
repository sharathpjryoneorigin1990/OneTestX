'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { FiMessageCircle, FiExternalLink } from 'react-icons/fi';
import { useTestBuilder } from './hooks/useTestBuilder';
import { TestHeader } from './components/TestHeader';
import { TestSteps } from './components/TestSteps';
import { ChatInterface } from './components/ChatInterface';
import toast from 'react-hot-toast';

export const TestBuilder = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const injectScript = useCallback((iframe: HTMLIFrameElement) => {
    try {
      if (!iframe.contentWindow) {
        console.error('Unable to access iframe window');
        return;
      }

      console.log('Attempting to inject MCP script into iframe (cross-origin mode)...');
      
      // For cross-origin iframes, we need to use a special approach
      // We'll create a script tag that loads our MCP script via a dynamic script element
      
      // Create a script that will be injected into the iframe
      const scriptContent = `
        (function() {
          console.log('[Loader] Script loader executing in iframe');
          
          // Notify parent that loader is running
          try {
            window.parent.postMessage({ type: 'MCP_LOADER_RUNNING' }, '*');
          } catch (e) {
            console.error('[Loader] Error sending loader running message:', e);
          }
          
          // Set up message listener for script checks
          window.addEventListener('message', function(event) {
            console.log('[Loader] Received message:', event.data?.type);
            
            if (event.data?.type === 'MCP_CHECK_SCRIPT') {
              console.log('[Loader] Received script check request, loaded:', !!window.__MCP_LOADED__);
              try {
                window.parent.postMessage({ 
                  type: 'MCP_SCRIPT_STATUS', 
                  loaded: !!window.__MCP_LOADED__,
                  url: window.location.href
                }, '*');
              } catch (e) {
                console.error('[Loader] Error sending script status:', e);
              }
            }
          });

          // Function to load the MCP script
          function loadMcpScript() {
            if (window.__MCP_LOADED__) {
              console.log('[Loader] MCP script already loaded');
              try {
                window.parent.postMessage({ type: 'MCP_SCRIPT_READY' }, '*');
              } catch (e) {
                console.error('[Loader] Error sending ready message:', e);
              }
              return;
            }
            
            console.log('[Loader] Loading MCP script in iframe');
            var script = document.createElement('script');
            
            // Use absolute URL to ensure it loads correctly
            var baseUrl = window.location.protocol + '//' + '${window.location.host}';
            script.src = baseUrl + '/mcp-script.js';
            script.setAttribute('data-mcp-injected', 'true');
            
            script.onload = function() {
              console.log('[Loader] MCP script loaded successfully');
              try {
                window.parent.postMessage({ 
                  type: 'MCP_SCRIPT_READY',
                  url: window.location.href
                }, '*');
              } catch (e) {
                console.error('[Loader] Error sending ready message:', e);
              }
            };
            
            script.onerror = function(error) {
              console.error('[Loader] Error loading MCP script:', error);
              try {
                window.parent.postMessage({ 
                  type: 'MCP_SCRIPT_ERROR', 
                  error: 'Failed to load script'
                }, '*');
              } catch (e) {
                console.error('[Loader] Error sending error message:', e);
              }
            };
            
            try {
              document.head.appendChild(script);
              console.log('[Loader] Script added to document head');
            } catch (e) {
              console.error('[Loader] Error appending script to head:', e);
              try {
                document.body.appendChild(script);
                console.log('[Loader] Script added to document body (fallback)');
              } catch (e2) {
                console.error('[Loader] Error appending script to body:', e2);
              }
            }
          }
          
          // Try to load immediately
          try {
            loadMcpScript();
          } catch (e) {
            console.error('[Loader] Error in immediate load:', e);
            // Try again when DOM is ready
            if (document.readyState === 'complete') {
              setTimeout(loadMcpScript, 500);
            } else {
              document.addEventListener('DOMContentLoaded', loadMcpScript);
            }
          }
        })();
      `;

      // Create a blob URL for the script loader
      const blob = new Blob([scriptContent], { type: 'text/javascript' });
      const scriptUrl = URL.createObjectURL(blob);

      // Send the script URL to the iframe
      console.log('Sending script injection message to iframe');
      iframe.contentWindow.postMessage({ 
        type: 'MCP_INJECT_SCRIPT', 
        scriptUrl 
      }, '*');

      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(scriptUrl), 1000);

    } catch (error: unknown) {
      console.error('Error injecting script:', error);
    }
  }, []);
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
    setIsIframeLoaded,
    handleStartRecording,
    handleStopRecording,
    handleSaveTest,
    handleRunTest,
    handleClearTest,
    handleClearChat,
    handleChatCommand
  } = useTestBuilder();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-6 space-y-6 overflow-y-auto">
      <TestHeader
        isRecording={isRecording}
        isRunning={isRunning}
        isSaving={isSaving}
        websiteUrl={websiteUrl}
        testName={testName}
        testDescription={testDescription}
        onWebsiteUrlChange={setWebsiteUrl}
        onTestNameChange={setTestName}
        onTestDescriptionChange={setTestDescription}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onSaveTest={handleSaveTest}
        onClearTest={handleClearTest}
        onRunTest={handleRunTest}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Website Preview */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-gray-700 px-4 py-2">
              <span className="text-sm font-medium text-gray-300">Website Preview</span>
              <button
                onClick={() => window.open(websiteUrl, '_blank', 'noopener,noreferrer')}
                disabled={!websiteUrl}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Open in new tab <FiExternalLink className="ml-1" />
              </button>
            </div>
            <div className="relative h-[600px] bg-black">
              {websiteUrl ? (
                <iframe
                  ref={iframeRef}
                  src={websiteUrl}
                  className="w-full h-full border-0"
                  title="Website Preview"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                  allow="clipboard-read; clipboard-write"
                  onLoad={() => {
                    console.log('Iframe loaded, URL:', websiteUrl);
                    try {
                      if (iframeRef.current) {
                        // Wait a bit for the page to stabilize
                        setTimeout(() => {
                          console.log('Injecting MCP script...');
                          injectScript(iframeRef.current!);
                          
                          // Set up a listener to verify script is loaded
                          const checkScriptLoaded = () => {
                            if (iframeRef.current?.contentWindow) {
                              iframeRef.current.contentWindow.postMessage({
                                type: 'MCP_CHECK_SCRIPT'
                              }, '*');
                            }
                          };
                          
                          // Check multiple times to ensure script is loaded
                          const checkInterval = setInterval(checkScriptLoaded, 1000);
                          
                          // Set a timeout to stop checking after 10 seconds
                          setTimeout(() => {
                            clearInterval(checkInterval);
                            setIsIframeLoaded(true);
                            console.log('Iframe fully loaded and script injection completed');
                          }, 10000);
                          
                          // Listen for script ready message
                          const messageHandler = (event: MessageEvent) => {
                            if (event.data?.type === 'MCP_SCRIPT_READY') {
                              console.log('MCP script ready confirmed!');
                              clearInterval(checkInterval);
                              setIsIframeLoaded(true);
                              window.removeEventListener('message', messageHandler);
                            } else if (event.data?.type === 'MCP_SCRIPT_STATUS' && event.data?.loaded) {
                              console.log('MCP script status: loaded');
                              clearInterval(checkInterval);
                              setIsIframeLoaded(true);
                              window.removeEventListener('message', messageHandler);
                            }
                          };
                          
                          window.addEventListener('message', messageHandler);
                        }, 1000);
                      }
                    } catch (error) {
                      console.error('Error injecting script:', error);
                      setIsIframeLoaded(false);
                    }
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
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Enter a website URL to begin
                </div>
              )}
              {isRecording && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white">
                    <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
                    Recording
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Steps */}
          <TestSteps
            steps={currentTest?.steps || []}
            activeStep={activeStep}
            isRecording={isRecording}
            onStepClick={setActiveStep}
          />
        </div>


        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white flex items-center">
                <FiMessageCircle className="mr-2" /> Chat Assistant
              </h3>
              {isProcessingCommand && (
                <span className="text-xs text-yellow-400 animate-pulse">Processing...</span>
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
        </div>
      </div>
    </div>
  );
};

export default TestBuilder;
