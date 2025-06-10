/**
 * Utility functions for cross-origin iframe communication
 */

interface IframeMessage {
  type: string;
  payload?: any;
  targetOrigin?: string;
}

/**
 * Sends a message to an iframe window
 * @param iframe The iframe element
 * @param message The message to send
 * @param targetOrigin The target origin (defaults to '*' for any origin)
 */
export function postToIframe(
  iframe: HTMLIFrameElement,
  message: IframeMessage,
  targetOrigin: string = '*'
): void {
  if (!iframe?.contentWindow) {
    console.error('Iframe or its contentWindow is not available');
    return;
  }
  
  try {
    iframe.contentWindow.postMessage(message, targetOrigin);
    console.log('Message posted to iframe:', message);
  } catch (error) {
    console.error('Error posting message to iframe:', error);
  }
}

/**
 * Listens for messages from an iframe
 * @param callback Function to handle received messages
 * @returns A function to remove the event listener
 */
export function listenForIframeMessages(
  callback: (event: MessageEvent) => void
): () => void {
  const messageHandler = (event: MessageEvent) => {
    // Verify the origin of the message if needed
    // if (event.origin !== 'https://expected-origin.com') return;
    
    callback(event);
  };
  
  window.addEventListener('message', messageHandler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}

/**
 * Injects a script into an iframe
 * @param iframe The iframe element
 * @param scriptContent The JavaScript code to inject
 * @param targetOrigin The target origin for the message
 */
export function injectScriptIntoIframe(
  iframe: HTMLIFrameElement,
  scriptContent: string,
  targetOrigin: string = '*'
): void {
  const message: IframeMessage = {
    type: 'INJECT_SCRIPT',
    payload: scriptContent,
    targetOrigin
  };
  
  postToIframe(iframe, message, targetOrigin);
}

/**
 * Executes a function in the context of an iframe
 * @param iframe The iframe element
 * @param fn The function to execute
 * @param args Arguments to pass to the function
 * @param targetOrigin The target origin for the message
 */
export function executeInIframeContext<T>(
  iframe: HTMLIFrameElement,
  fn: (...args: any[]) => T,
  args: any[] = [],
  targetOrigin: string = '*'
): void {
  const functionString = `
    (${fn.toString()})\n    (${JSON.stringify(args).slice(1, -1)})
  `;
  
  injectScriptIntoIframe(iframe, `(${functionString})();`, targetOrigin);
}

/**
 * Sets up a message channel between the parent window and an iframe
 * @param iframe The iframe element
 * @param onMessage Callback for received messages
 * @param targetOrigin The target origin for the message
 * @returns A function to post messages to the iframe
 */
export function setupIframeMessageChannel(
  iframe: HTMLIFrameElement,
  onMessage: (data: any) => void,
  targetOrigin: string = '*'
): (message: any) => void {
  // Set up message listener
  const cleanup = listenForIframeMessages((event) => {
    // Verify the message is from our iframe
    // if (event.source !== iframe.contentWindow) return;
    
    if (event.data && typeof event.data === 'object') {
      onMessage(event.data);
    }
  });
  
  // Return a function to post messages to the iframe
  return (message: any) => {
    postToIframe(iframe, message, targetOrigin);
  };
}

// Example usage:
/*
// Parent window code:
const iframe = document.querySelector('iframe');

// Set up message channel
const sendToIframe = setupIframeMessageChannel(
  iframe,
  (message) => {
    console.log('Received from iframe:', message);
  },
  'https://apply-qa.apps.asu.edu'
);

// Send message to iframe
sendToIframe({ type: 'HELLO', payload: 'Hello from parent!' });

// Execute code in iframe
executeInIframeContext(
  iframe,
  (message: string) => {
    // This code runs inside the iframe
    console.log('Running in iframe context:', message);
    
    // Send message back to parent
    window.parent.postMessage(
      { type: 'RESPONSE', payload: 'Hello from iframe!' },
      '*'
    );
  },
  ['Initial message'],
  'https://apply-qa.apps.asu.edu'
);
*/

// Iframe code (if you control the iframe content):
/*
window.addEventListener('message', (event) => {
  // Verify origin if needed
  // if (event.origin !== 'http://parent-window-origin.com') return;
  
  const message = event.data;
  console.log('Received in iframe:', message);
  
  if (message.type === 'INJECT_SCRIPT') {
    try {
      // Execute the injected script
      // eslint-disable-next-line no-eval
      eval(message.payload);
    } catch (error) {
      console.error('Error executing injected script:', error);
    }
  }
  
  // Handle other message types...
});
*/
