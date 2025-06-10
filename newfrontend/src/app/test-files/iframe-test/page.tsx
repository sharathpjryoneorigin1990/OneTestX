'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  postToIframe, 
  listenForIframeMessages, 
  injectScriptIntoIframe,
  setupIframeMessageChannel
} from '@/lib/iframe-utils';

export default function IframeTestPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [messages, setMessages] = useState<Array<{ type: string; payload: any }>>([]);
  const [targetUrl, setTargetUrl] = useState('https://apply-qa.apps.asu.edu');
  const [isConnected, setIsConnected] = useState(false);
  const sendToIframeRef = useRef<((message: any) => void) | null>(null);

  // Set up message listener when component mounts
  useEffect(() => {
    const cleanup = listenForIframeMessages((event) => {
      // Verify the message is from our iframe
      if (iframeRef.current?.contentWindow !== event.source) return;
      
      console.log('Received from iframe:', event.data);
      
      if (event.data && typeof event.data === 'object') {
        setMessages(prev => [...prev, {
          type: event.data.type,
          payload: event.data.payload,
          timestamp: new Date().toISOString()
        }]);
      }
    });
    
    return cleanup;
  }, []);

  // Initialize message channel when iframe loads
  const handleIframeLoad = () => {
    if (!iframeRef.current) return;
    
    // Set up message channel
    sendToIframeRef.current = setupIframeMessageChannel(
      iframeRef.current,
      (message) => {
        console.log('Message from iframe:', message);
        setMessages(prev => [...prev, {
          ...message,
          timestamp: new Date().toISOString()
        }]);
      },
      new URL(targetUrl).origin
    );
    
    setIsConnected(true);
    
    // Inject a script to handle messages in the iframe
    injectScriptIntoIframe(
      iframeRef.current,
      `
      // This script runs inside the iframe
      console.log('Script injected into iframe');
      
      // Handle messages from parent
      window.addEventListener('message', (event) => {
        console.log('Iframe received message:', event.data);
        
        // Echo the message back to parent
        if (event.data && event.data.type === 'ECHO') {
          window.parent.postMessage({
            type: 'ECHO_RESPONSE',
            payload: event.data.payload
          }, event.origin);
        }
      });
      `,
      new URL(targetUrl).origin
    );
  };

  const sendMessage = () => {
    if (!sendToIframeRef.current) return;
    
    const message = {
      type: 'ECHO',
      payload: `Test message at ${new Date().toLocaleTimeString()}`
    };
    
    sendToIframeRef.current(message);
    setMessages(prev => [...prev, { ...message, timestamp: new Date().toISOString() }]);
  };

  const reloadIframe = () => {
    if (!iframeRef.current) return;
    iframeRef.current.src = targetUrl;
    setMessages([]);
    setIsConnected(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Iframe Communication Test</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h2 className="text-lg font-medium mb-2">Test Configuration</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Target URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                id="targetUrl"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
              <button
                onClick={reloadIframe}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reload Iframe
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`inline-block w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>{isConnected ? 'Connected to iframe' : 'Not connected'}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Iframe</h2>
            <button
              onClick={sendMessage}
              disabled={!isConnected}
              className={`px-4 py-2 rounded-md ${isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}
            >
              Send Message
            </button>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <iframe
              ref={iframeRef}
              src={targetUrl}
              className="w-full h-[600px] border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
              onLoad={handleIframeLoad}
              title="Test Iframe"
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Message Log</h2>
            <button
              onClick={() => setMessages([])}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Log
            </button>
          </div>
          
          <div className="border rounded-md p-4 h-[600px] overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages yet. Send a message to the iframe.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div key={index} className="p-3 bg-white rounded-md shadow-sm border">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm text-gray-700">
                        {msg.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {msg.payload && (
                      <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
                        {typeof msg.payload === 'string' 
                          ? msg.payload 
                          : JSON.stringify(msg.payload, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h3 className="font-medium text-blue-800 mb-2">How to use this test page:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
          <li>Enter the URL of the page you want to test in the iframe</li>
          <li>Click "Reload Iframe" to load the page</li>
          <li>Use the "Send Message" button to test communication with the iframe</li>
          <li>View message logs in the right panel</li>
        </ol>
        
        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-1">Note about cross-origin iframes:</h4>
          <p className="text-sm text-blue-700">
            For security reasons, browsers restrict cross-origin iframe communication. 
            The iframe must explicitly allow communication from your domain by setting the 
            <code className="bg-blue-100 px-1 rounded">document.domain</code> property or 
            using proper CORS headers.
          </p>
        </div>
      </div>
    </div>
  );
}
