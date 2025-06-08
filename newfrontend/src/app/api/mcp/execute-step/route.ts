import { NextRequest, NextResponse } from 'next/server';
import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

// Ensure directory exists
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function executeStepInContext(page: any, command: string, args: string[], isChat = false) {
  console.log(`Executing ${isChat ? 'chat' : 'recorded'} command: ${command} with args:`, args);
  
  // Try in main page first
  try {
    if (isChat) {
      switch (command.toLowerCase()) {
        case 'click':
          const textToClick = args.join(' ');
          console.log(`Trying to click text "${textToClick}" in main page`);
          
          // Try multiple selector strategies for more flexible matching
          const selectors = [
            `text="${textToClick}"`,                     // Exact match
            `text="${textToClick.toLowerCase()}"`,       // Lowercase match
            `text="${textToClick.toUpperCase()}"`,       // Uppercase match
            `text="${textToClick.charAt(0).toUpperCase() + textToClick.slice(1)}"`, // Capitalized
            `text*="${textToClick}"`,                    // Contains text
            `[aria-label*="${textToClick}"]`,           // Aria label contains
            `a:has-text("${textToClick}")`,              // Link with text
            `button:has-text("${textToClick}")`,         // Button with text
            `[role=button]:has-text("${textToClick}")`,  // Role=button with text
            `[role=link]:has-text("${textToClick}")`     // Role=link with text
          ];
          
          // Try each selector strategy in the main page
          for (const selector of selectors) {
            try {
              console.log(`Trying selector: ${selector} in main page`);
              await page.click(selector, { timeout: 2000 });
              console.log(`Successfully clicked with selector: ${selector} in main page`);
              return;
            } catch (error) {
              // Continue to next selector
            }
          }
          
          // If we get here, try the default Playwright getByText approach
          try {
            await page.getByText(textToClick, { exact: false }).click({ timeout: 3000 });
            console.log(`Successfully clicked text "${textToClick}" in main page`);
            return;
          } catch (error) {
            console.log(`Failed to click text "${textToClick}" in main page`);
          }
          break;
          
        case 'type':
          console.log(`Trying to type "${args.join(' ')}" in first textbox in main page`);
          await page.getByRole('textbox').first().fill(args.join(' '), { timeout: 5000 });
          return;
          
        case 'select':
          const [selectText, selectValue] = args;
          console.log(`Trying to select "${selectValue}" in combobox "${selectText}" in main page`);
          await page.getByRole('combobox').getByText(selectText).selectOption(selectValue, { timeout: 5000 });
          return;
          
        default:
          // For unknown commands, try to find and click the text
          console.log(`Unknown command "${command}", trying to click text "${args.join(' ')}" in main page`);
          await page.getByText(args.join(' '), { exact: false }).click({ timeout: 5000 });
          return;
      }
    } else {
      // For recorded commands
      switch (command.toLowerCase()) {
        case 'click':
          console.log(`Trying to click selector "${args[0]}" in main page`);
          await page.locator(args[0]).click({ timeout: 5000 });
          return;
          
        case 'type':
          console.log(`Trying to type "${args[1]}" in selector "${args[0]}" in main page`);
          await page.locator(args[0]).fill(args[1], { timeout: 5000 });
          return;
          
        case 'select':
          console.log(`Trying to select "${args[1]}" in selector "${args[0]}" in main page`);
          await page.locator(args[0]).selectOption(args[1], { timeout: 5000 });
          return;
          
        default:
          console.log(`Unknown recorded command "${command}" with selector "${args[0]}"`);
          break;
      }
    }
  } catch (error) {
    console.log(`Failed to execute in main page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Try each frame
  const frames = page.frames();
  console.log(`Trying ${frames.length} frames...`);
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    try {
      console.log(`Trying frame ${i+1}/${frames.length} with URL: ${frame.url()}`);
      
      if (isChat) {
        switch (command.toLowerCase()) {
          case 'click':
            // For chat commands, try to find element by text
            const textToClick = args.join(' ');
            console.log(`Looking for text to click: "${textToClick}" in frame ${i+1}`);
            
            // Create multiple selector strategies for more flexible matching
            const selectors = [
              `text="${textToClick}"`,                     // Exact match
              `text="${textToClick.toLowerCase()}"`,       // Lowercase match
              `text="${textToClick.toUpperCase()}"`,       // Uppercase match
              `text="${textToClick.charAt(0).toUpperCase() + textToClick.slice(1)}"`, // Capitalized
              `text*="${textToClick}"`,                    // Contains text
              `[aria-label*="${textToClick}"]`,           // Aria label contains
              `a:has-text("${textToClick}")`,              // Link with text
              `button:has-text("${textToClick}")`,         // Button with text
              `[role=button]:has-text("${textToClick}")`,  // Role=button with text
              `[role=link]:has-text("${textToClick}")`     // Role=link with text
            ];
            
            // Try to find and click in frame using multiple strategies
            for (const selector of selectors) {
              try {
                console.log(`Attempting to click in frame ${i} with selector: ${selector}`);
                await frame.click(selector, { timeout: 2000 });
                console.log(`Successfully clicked in frame ${i}`);
                return;
              } catch (selectorError) {
                // Continue to next selector
                console.log(`Selector ${selector} not found in frame ${i}`);
              }
            }
            
            // If selectors didn't work, try getByText as a fallback
            try {
              await frame.getByText(textToClick, { exact: false }).click({ timeout: 3000 });
              console.log(`Successfully clicked text "${textToClick}" in frame ${i}`);
              return;
            } catch (textError) {
              console.log(`Failed to click text "${textToClick}" in frame ${i}`);
            }
            break;
            
          case 'type':
            console.log(`Trying to type "${args.join(' ')}" in first textbox in frame ${i+1}`);
            await frame.getByRole('textbox').first().fill(args.join(' '), { timeout: 5000 });
            console.log('Type successful in frame');
            return;
            
          case 'select':
            const [selectText, selectValue] = args;
            console.log(`Trying to select "${selectValue}" in combobox "${selectText}" in frame ${i+1}`);
            await frame.getByRole('combobox').getByText(selectText).selectOption(selectValue, { timeout: 5000 });
            console.log('Select successful in frame');
            return;
            
          default:
            // For unknown commands, try to find and click the text
            console.log(`Unknown command "${command}", trying to click text "${args.join(' ')}" in frame ${i+1}`);
            await frame.getByText(args.join(' '), { exact: false }).click({ timeout: 5000 });
            console.log('Click successful in frame');
            return;
        }
      } else {
        // For recorded commands
        switch (command.toLowerCase()) {
          case 'click':
            console.log(`Trying to click selector "${args[0]}" in frame ${i+1}`);
            await frame.locator(args[0]).click({ timeout: 5000 });
            console.log('Click successful in frame');
            return;
            
          case 'type':
            console.log(`Trying to type "${args[1]}" in selector "${args[0]}" in frame ${i+1}`);
            await frame.locator(args[0]).fill(args[1], { timeout: 5000 });
            console.log('Type successful in frame');
            return;
          case 'select':
            console.log(`Trying to select "${args[1]}" in selector "${args[0]}" in frame ${i+1}`);
            await frame.locator(args[0]).selectOption(args[1], { timeout: 5000 });
            console.log('Select successful in frame');
            return;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Action failed in frame ${i+1}: ${errorMessage}`);
      // Continue to next frame
      continue;
    }
  }

  // If we get here, we couldn't find the element in any frame
  console.log(`Element not found in any frame: ${args.join(' ')}`);
  throw new Error(`Element not found: ${args.join(' ')}`);
}

export async function POST(request: NextRequest) {
  let browser = null;
  let requestTimeout: NodeJS.Timeout | null = null;
  
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise((_, reject) => {
    requestTimeout = setTimeout(() => {
      reject(new Error('Request timed out after 30 seconds'));
    }, 30000); // 30 second timeout
  });
  
  try {
    console.log('Received execute-step request');
    const data = await request.json();
    const { step, websiteUrl, iframeSelector } = data;
    console.log('Request data:', { step, websiteUrl, iframeSelector });

    if (!step || !websiteUrl) {
      console.error('Missing required fields in request');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // All commands including chat will use Playwright MCP
    const isChatCommand = step.action === 'chat';
    
    // Create debug screenshots directory if it doesn't exist
    const debugDir = path.join(process.cwd(), 'debug-screenshots');
    ensureDirectoryExists(debugDir);
    
    // Launch browser for all commands
    console.log(`Launching browser for ${isChatCommand ? 'chat' : 'recorded'} command...`);
    browser = await chromium.launch({ 
      headless: true,
      timeout: 20000, // 20 second timeout for browser launch
      args: ['--disable-web-security', '--disable-features=IsolateOrigins', '--disable-site-isolation-trials'] // Disable security features that might interfere with iframe access
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    // Navigate to the website
    console.log(`Navigating to ${websiteUrl}...`);
    await Promise.race([
      page.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }),
      timeoutPromise
    ]);
    console.log('Navigation complete');

    // Take a screenshot for debugging
    const screenshotPath = path.join(debugDir, `page_loaded_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to ${screenshotPath}`);

    // Execute the step
    console.log('Executing step:', step);
    let result;

    try {
      // For chat commands, use AI agent to parse and execute
      if (isChatCommand) {
        console.log('Processing chat command with Playwright MCP and AI agent');
        const chatCommand = step.value.toLowerCase();
        
        // Parse the chat command
        let action = '';
        let target = '';
        let value = '';
        
        if (chatCommand.startsWith('click ')) {
          action = 'click';
          target = chatCommand.substring(6).trim();
        } else if (chatCommand.startsWith('type ')) {
          const typeMatch = chatCommand.match(/type\s+(["']?)(.+?)\1\s+(?:in|into|on)\s+(["']?)(.+?)\3/i);
          if (typeMatch) {
            action = 'type';
            value = typeMatch[2];
            target = typeMatch[4];
          } else {
            // Simpler pattern: "type text in field"
            const parts = chatCommand.substring(5).trim().split(/\s+(?:in|into|on)\s+/);
            if (parts.length === 2) {
              action = 'type';
              value = parts[0].trim();
              target = parts[1].trim();
            }
          }
        } else if (chatCommand.startsWith('select ')) {
          const selectMatch = chatCommand.match(/select\s+(["']?)(.+?)\1\s+(?:from|in)\s+(["']?)(.+?)\3/i);
          if (selectMatch) {
            action = 'select';
            value = selectMatch[2];
            target = selectMatch[4];
          } else {
            // Simpler pattern: "select option from dropdown"
            const parts = chatCommand.substring(7).trim().split(/\s+(?:from|in)\s+/);
            if (parts.length === 2) {
              action = 'select';
              value = parts[0].trim();
              target = parts[1].trim();
            }
          }
        }
        
        console.log(`Parsed chat command: action=${action}, target=${target}, value=${value}`);
        
        // Execute the parsed command using Playwright
        if (action === 'click' && target) {
          // Try to click using multiple strategies
          console.log(`Attempting to click on "${target}"`);
          
          // Try text content
          try {
            const element = page.getByText(target, { exact: false }).first();
            await element.click();
            result = { success: true, message: `Clicked on "${target}"` };
          } catch (error) {
            try {
              // Try button with text
              const button = page.getByRole('button', { name: target, exact: false });
              await button.click();
              result = { success: true, message: `Clicked on button "${target}"` };
            } catch (error) {
              try {
                // Try link with text
                const link = page.getByRole('link', { name: target, exact: false });
                await link.click();
                result = { success: true, message: `Clicked on link "${target}"` };
              } catch (error) {
                // Last resort - try CSS selector
                try {
                  await page.click(`text="${target}"`);
                  result = { success: true, message: `Clicked on "${target}" using text selector` };
                } catch (finalError) {
                  throw new Error(`Could not find element to click with text: "${target}"`);
                }
              }
            }
          }
        } else if (action === 'type' && target && value) {
          // Try to type using multiple strategies
          console.log(`Attempting to type "${value}" into "${target}"`);
          
          try {
            // Try by placeholder
            const input = page.getByPlaceholder(target, { exact: false });
            await input.fill(value);
            result = { success: true, message: `Typed "${value}" into field with placeholder "${target}"` };
          } catch (error) {
            try {
              // Try by label
              const input = page.getByLabel(target, { exact: false });
              await input.fill(value);
              result = { success: true, message: `Typed "${value}" into field with label "${target}"` };
            } catch (error) {
              try {
                // Try by text near the input
                await page.fill(`input:near(:text("${target}"))`, value);
                result = { success: true, message: `Typed "${value}" into field near text "${target}"` };
              } catch (finalError) {
                throw new Error(`Could not find input field with text/label: "${target}"`);
              }
            }
          }
        } else if (action === 'select' && target && value) {
          // Try to select using multiple strategies
          console.log(`Attempting to select "${value}" from "${target}"`);
          
          try {
            // Try by label
            const select = page.getByLabel(target, { exact: false });
            await select.selectOption({ label: value });
            result = { success: true, message: `Selected "${value}" from dropdown with label "${target}"` };
          } catch (error) {
            try {
              // Try by text near the select
              await page.selectOption(`select:near(:text("${target}"))`, { label: value });
              result = { success: true, message: `Selected "${value}" from dropdown near text "${target}"` };
            } catch (finalError) {
              throw new Error(`Could not find dropdown with text/label: "${target}"`);
            }
          }
        } else {
          throw new Error(`Could not parse chat command: ${chatCommand}`);
        }
      } else {
        // For regular recorded steps
        console.log(`Processing recorded step: ${step.action} on ${step.selector}`);
        
        switch (step.action) {
          case 'click':
            if (step.selector) {
              await page.click(step.selector);
              result = { success: true, message: `Clicked on element with selector: ${step.selector}` };
            } else {
              throw new Error('No selector provided for click action');
            }
            break;
            
          case 'type':
            if (step.selector && step.value) {
              await page.fill(step.selector, step.value);
              result = { success: true, message: `Typed "${step.value}" into element with selector: ${step.selector}` };
            } else {
              throw new Error('Missing selector or value for type action');
            }
            break;
            
          case 'select':
            if (step.selector && step.value) {
              await page.selectOption(step.selector, step.value);
              result = { success: true, message: `Selected "${step.value}" in dropdown with selector: ${step.selector}` };
            } else {
              throw new Error('Missing selector or value for select action');
            }
            break;
            
          default:
            throw new Error(`Unsupported action: ${step.action}`);
        }
      }
    } catch (innerError) {
      console.error('Error executing step action:', innerError instanceof Error ? innerError.message : 'Unknown error');
      throw innerError;
    }

    // Take a screenshot before closing browser for debugging
    try {
      const screenshotDir = path.join(process.cwd(), 'public', 'debug-screenshots');
      ensureDirectoryExists(screenshotDir);
      const screenshotPath = path.join(screenshotDir, `step-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to ${screenshotPath}`);
    } catch (screenshotError) {
      console.warn('Failed to take screenshot:', screenshotError instanceof Error ? screenshotError.message : 'Unknown error');
    }
    
    console.log('Closing browser...');
    await browser.close();
    browser = null;

    console.log('Step executed successfully');
    return NextResponse.json({
      success: true,
      message: `Successfully executed ${step.action}`,
      step: {
        ...step,
        id: `step-${Date.now()}`,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to execute step';
    console.error('Error executing step:', errorMessage);
    
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed after error');
      } catch (closeError) {
        console.error('Error closing browser:', closeError instanceof Error ? closeError.message : 'Unknown error');
      }
      browser = null;
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : 'No stack trace available'
    }, { status: 500 });
  } finally {
    // Clear the timeout to prevent memory leaks
    if (requestTimeout) {
      clearTimeout(requestTimeout);
    }
    
    // Make absolutely sure the browser is closed
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed in finally block');
      } catch (finalCloseError) {
        console.error('Error closing browser in finally block:', 
          finalCloseError instanceof Error ? finalCloseError.message : 'Unknown error');
      }
    }
  }
}
