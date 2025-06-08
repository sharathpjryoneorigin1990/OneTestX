// == MCP SCRIPT FOR IFRAME ==
(function () {
  // Already loaded guard
  if (window.__MCP_LOADED__) {
    console.log('MCP script already loaded, sending ready message');
    try {
      window.parent.postMessage({
        type: 'MCP_SCRIPT_READY',
        info: { url: window.location.href }
      }, '*');
    } catch (e) {
      console.error('Error sending ready message:', e);
    }
    return;
  }
  
  console.log('MCP script initializing...');
  window.__MCP_LOADED__ = true;

  // Helper: Generate a robust selector for Playwright
  function getSelector(el) {
    if (!el) return '';
    if (el.getAttribute && el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
    if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
    if (el.id) return `#${el.id}`;
    if (el.type === 'email') return 'input[type="email"]';
    if (el.type === 'password') return 'input[type="password"]';
    let path = el.tagName.toLowerCase();
    let parent = el.parentNode;
    if (!parent) return path;
    let siblings = Array.from(parent.children).filter(child => child.tagName === el.tagName);
    if (siblings.length > 1) {
      path += `:nth-child(${Array.prototype.indexOf.call(parent.children, el) + 1})`;
    }
    return path;
  }

  // Post event to parent
  function sendMessageToParent(message) {
    try {
      window.parent.postMessage(message, '*');
      console.log('Message sent to parent:', message.type);
    } catch (e) {
      console.error('Error sending message to parent:', e);
    }
  }

  // Find an element by text content or other attributes
  function findElementByText(text) {
    console.log(`Finding element with text: "${text}"`);
    
    // Normalize the search text
    const searchText = text.toLowerCase().trim();
    
    // Special handling for common input types
    if (searchText.includes('email') || searchText === 'email field' || searchText === 'email input') {
      console.log('Looking for email field');
      const emailInputs = document.querySelectorAll('input[type="email"]');
      if (emailInputs.length > 0) {
        console.log('Found email input:', emailInputs[0]);
        return emailInputs[0];
      }
    }
    
    if (searchText.includes('password') || searchText === 'password field' || searchText === 'password input') {
      console.log('Looking for password field');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      if (passwordInputs.length > 0) {
        console.log('Found password input:', passwordInputs[0]);
        return passwordInputs[0];
      }
    }
    
    // Strategy 1: Find elements with exact text content
    console.log('Strategy 1: Looking for exact text match');
    const allElements = document.querySelectorAll('a, button, input, select, textarea, label, h1, h2, h3, h4, h5, h6, p, span, div');
    
    for (const el of allElements) {
      const content = el.textContent || el.value || el.placeholder || '';
      if (content.toLowerCase().trim() === searchText) {
        console.log('Found exact text match:', el);
        return el;
      }
    }
    
    // Strategy 2: Find elements containing the text
    console.log('Strategy 2: Looking for elements containing the text');
    for (const el of allElements) {
      const content = el.textContent || el.value || el.placeholder || '';
      if (content.toLowerCase().includes(searchText)) {
        console.log('Found element containing text:', el);
        return el;
      }
    }
    
    // Strategy 3: Find elements with matching attributes
    console.log('Strategy 3: Looking for elements with matching attributes');
    for (const el of allElements) {
      if (el.name && el.name.toLowerCase().includes(searchText)) {
        console.log('Found element with matching name attribute:', el);
        return el;
      }
      
      if (el.id && el.id.toLowerCase().includes(searchText)) {
        console.log('Found element with matching id attribute:', el);
        return el;
      }
      
      if (el.placeholder && el.placeholder.toLowerCase().includes(searchText)) {
        console.log('Found element with matching placeholder:', el);
        return el;
      }
      
      if (el.ariaLabel && el.ariaLabel.toLowerCase().includes(searchText)) {
        console.log('Found element with matching aria-label:', el);
        return el;
      }
    }
    
    // Strategy 4: Find labels and their associated inputs
    console.log('Strategy 4: Looking for labels and their associated inputs');
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      if (label.textContent && label.textContent.toLowerCase().includes(searchText)) {
        if (label.htmlFor) {
          const input = document.getElementById(label.htmlFor);
          if (input) {
            console.log('Found input through label:', input);
            return input;
          }
        }
        // If no htmlFor, return the label itself
        console.log('Found label with matching text:', label);
        return label;
      }
    }
    
    console.log(`No element found with text: "${text}"`);
    throw new Error(`Could not find element with text: ${text}`);
  }

  // Handle click command
  function handleClickCommand(target) {
    console.log(`Handling click command for target: "${target}"`);
    
    const element = findElementByText(target);
    if (!element) {
      throw new Error(`Could not find element with text: ${target}`);
    }
    
    console.log('Found element to click:', element);
    
    // Simulate click
    element.click();
    console.log('Click simulated on element');
    
    return {
      success: true,
      message: `Clicked on "${target}"`,
      selector: getSelector(element)
    };
  }

  // Handle type command
  function handleTypeCommand(target, value) {
    console.log(`Handling type command for target: "${target}" with value: "${value}"`);
    
    const element = findElementByText(target);
    if (!element) {
      throw new Error(`Could not find element with text: ${target}`);
    }
    
    if (!element.tagName || !['INPUT', 'TEXTAREA'].includes(element.tagName)) {
      throw new Error(`Element with text "${target}" is not an input or textarea`);
    }
    
    console.log('Found element to type into:', element);
    
    // Clear the field first
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Type character by character to simulate real typing
    const typeCharByChar = (text, index = 0) => {
      if (index >= text.length) {
        console.log('Finished typing all characters');
        return;
      }
      
      element.value += text[index];
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => typeCharByChar(text, index + 1), 10);
    };
    
    typeCharByChar(value);
    
    // Also dispatch change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('Text entered into element');
    
    return {
      success: true,
      message: `Typed "${value}" into "${target}"`,
      selector: getSelector(element)
    };
  }

  // Handle select command
  function handleSelectCommand(target, value) {
    console.log(`Handling select command for target: "${target}" with value: "${value}"`);
    
    const element = findElementByText(target);
    if (!element) {
      throw new Error(`Could not find select element with text: ${target}`);
    }
    
    if (element.tagName !== 'SELECT') {
      throw new Error(`Element with text "${target}" is not a select element`);
    }
    
    console.log('Found select element:', element);
    
    // Find the option
    let optionFound = false;
    for (const option of element.options) {
      if (option.text.toLowerCase().includes(value.toLowerCase())) {
        element.value = option.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        optionFound = true;
        break;
      }
    }
    
    if (!optionFound) {
      throw new Error(`Could not find option "${value}" in dropdown "${target}"`);
    }
    
    console.log('Option selected in dropdown');
    
    return {
      success: true,
      message: `Selected "${value}" in dropdown "${target}"`,
      selector: getSelector(element)
    };
  }

  // Execute a command received from the parent window
  function executeCommand(command, messageId) {
    console.log('Executing command:', command, 'with messageId:', messageId);
    
    // First, send an acknowledgment that we received the command
    try {
      sendMessageToParent({
        type: 'MCP_COMMAND_RECEIVED',
        messageId,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error sending command acknowledgment:', e);
    }
    
    try {
      const { action, target, value } = command;
      let result;

      // Log more details about the command
      console.log(`Executing ${action} command with target: "${target}" and value: "${value}"`);
      console.log('Current page URL:', window.location.href);
      
      switch (action.toLowerCase()) {
        case 'click':
          result = handleClickCommand(target);
          break;
        case 'type':
          result = handleTypeCommand(target, value);
          break;
        case 'select':
          result = handleSelectCommand(target, value);
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Log the successful result
      console.log('Command executed successfully:', result);
      
      // Send success response
      sendMessageToParent({
        type: 'MCP_COMMAND_RESULT',
        messageId,
        success: true,
        message: result.message || `Successfully executed ${action} command`,
        data: result.data,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error executing command:', error);
      
      // Send error response
      sendMessageToParent({
        type: 'MCP_COMMAND_RESULT',
        messageId,
        success: false,
        error: error.message || 'Unknown error executing command',
        timestamp: new Date().toISOString()
      });

      return false;
    }
  }

  // Handle messages from the parent window
  function handleMessage(event) {
    try {
      console.log('MCP script received message event');
      
      const message = event.data;
      if (!message) {
        console.log('Received empty message event');
        return;
      }
      
      if (!message.type) {
        console.log('Received message without type:', message);
        return;
      }

      console.log('MCP script received message:', message.type, message);

      switch (message.type) {
        case 'MCP_START_RECORDING':
          console.log('Starting recording in iframe');
          // Send confirmation back to parent
          sendMessageToParent({
            type: 'MCP_RECORDING_STARTED'
          });
          break;
          
        case 'MCP_STOP_RECORDING':
          console.log('Stopping recording in iframe');
          // Send confirmation back to parent
          sendMessageToParent({
            type: 'MCP_RECORDING_STOPPED'
          });
          break;
          
        case 'MCP_EXECUTE_COMMAND':
          if (!message.command) {
            console.error('No command specified in message:', message);
            // Send error back to parent
            sendMessageToParent({
              type: 'MCP_COMMAND_RESULT',
              messageId: message.messageId,
              success: false,
              error: 'No command specified'
            });
            return;
          }
          
          console.log('Executing command in iframe:', message.command, 'with ID:', message.messageId);
          
          // Debug the command structure
          console.log('Command details:', {
            action: message.command.action,
            target: message.command.target,
            value: message.command.value
          });
          
          // Execute the command
          executeCommand(message.command, message.messageId);
          break;
          
        case 'MCP_CHECK_SCRIPT':
          console.log('Received script check request');
          sendMessageToParent({
            type: 'MCP_SCRIPT_STATUS',
            loaded: true,
            url: window.location.href
          });
          break;
          
        default:
          console.log('Unknown message type:', message.type);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      // Send error back to parent if there's a messageId
      if (event.data?.messageId) {
        sendMessageToParent({
          type: 'MCP_COMMAND_RESULT',
          messageId: event.data.messageId,
          success: false,
          error: error.message || 'Unknown error handling message'
        });
      }
    }
  }

  // Initialize the script
  function initialize() {
    // Set up message listener
    window.addEventListener('message', handleMessage);
    
    // Send ready message to parent with debug info
    console.log('MCP script initialized, sending ready message to parent');
    try {
      sendMessageToParent({ 
        type: 'MCP_SCRIPT_READY',
        info: {
          url: window.location.href,
          time: new Date().toISOString()
        }
      });
      
      // Test message to verify communication
      setTimeout(() => {
        console.log('Sending test event to parent');
        sendMessageToParent({
          type: 'MCP_EVENT',
          payload: {
            action: 'test',
            selector: 'body',
            value: 'test-value',
            description: 'Test event from iframe'
          }
        });
      }, 2000);
    } catch (e) {
      console.error('Error sending message to parent:', e);
    }
  }

  // Start the script
  initialize();
})();
