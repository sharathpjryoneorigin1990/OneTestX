// MCP Script for Browser Automation
// This script will be injected into the browser page by Playwright
// It listens for commands via window.postMessage and executes them
export const MCP_SCRIPT = `(() => {
  interface MessageEvent extends Event {
    origin: string;
    source: Window;
    data: {
      type: 'command' | 'response' | 'error';
      id?: string;
      command?: Command;
      result?: any;
      error?: string;
    };
  }

  interface Command {
    action: 'type' | 'click';
    selectors: string[];
    text?: string;
    id?: string;
  }

  interface ElementWithFocus extends Element {
    focus?: () => void;
    value?: string;
  }

  interface ElementWithClick extends Element {
    click?: () => void;
  }

  console.log('MCP SCRIPT: Initializing...');
  
  // Store the origin that is allowed to send commands
  const ALLOWED_ORIGIN = window.location.origin;
  
  // Listen for commands from the parent window
  window.addEventListener('message', (event: MessageEvent) => {
    try {
      // Validate origin
      if (event.origin !== ALLOWED_ORIGIN) {
        console.warn('MCP SCRIPT: Command from unauthorized origin:', event.origin);
        return;
      }
      
      const command = event.data?.command as Command;
      
      if (event.data?.type === 'command' && command) {
        console.log('MCP SCRIPT: Received command:', command);
        
        // Execute the command
        const result = executeCommand(command);
        
        // Send response back
        event.source?.postMessage({
          type: 'response',
          id: command.id,
          result
        }, event.origin);
      }
    } catch (error) {
      console.error('MCP SCRIPT: Error processing command:', error);
      event.source?.postMessage({
        type: 'error',
        id: command?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, event.origin);
    }
  });
  
  // Execute a command
  function executeCommand(command: Command): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const { action, selectors, text } = command;
        
        switch (action) {
          case 'type':
            if (!selectors || !text) {
              reject(new Error('Missing required parameters for type action'));
              return;
            }
            
            const element = findElement(selectors);
            if (!element) {
              reject(new Error('Element not found'));
              return;
            }
            
            if (element && 'focus' in element) {
              element.focus();
            }
            if (element && 'value' in element) {
              element.value = text;
            }
            resolve({ success: true });
            
          case 'click':
            if (!selectors) {
              reject(new Error('Missing required parameters for click action'));
              return;
            }
            
            const clickable = findElement(selectors);
            if (!clickable) {
              reject(new Error('Element not found'));
              return;
            }
            
            if (clickable && 'click' in clickable) {
              clickable.click();
            }
            resolve({ success: true });
            
          default:
            reject(new Error('Unknown action type'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Find an element using multiple selectors
  function findElement(selectors: string[]): ElementWithFocus | ElementWithClick | null {
    if (!selectors || !Array.isArray(selectors) || selectors.length === 0) {
      return null;
    }
    
    for (const selector of selectors) {
      const element = document.querySelector(selector) as ElementWithFocus | ElementWithClick | null;
      if (element) {
        return element;
      }
    }
    return null;
  }
  
  console.log('MCP SCRIPT: Initialized and listening for commands');
})();`;
