import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

// Store the browser and page instances
let browser: any = null;
let page: any = null;

// Reference to the global state for MCP browser status
declare global {
  var mcpBrowserState: {
    isConnected: boolean;
    lastActivity: Date;
  } | null;
}

// Initialize global state if not already initialized
if (!global.mcpBrowserState) {
  global.mcpBrowserState = {
    isConnected: false,
    lastActivity: new Date()
  };
}

// Initialize the browser and page if not already initialized
async function ensureBrowserAndPage() {
  if (!browser) {
    console.log('[API] Starting Playwright browser...');
    browser = await chromium.launch({ headless: false });
    console.log('[API] Browser launched');
  }
  
  if (!page) {
    console.log('[API] Creating new page...');
    page = await browser.newPage();
    console.log('[API] Page created');
    
    // Update global state
    if (global.mcpBrowserState) {
      global.mcpBrowserState.isConnected = true;
      global.mcpBrowserState.lastActivity = new Date();
    }
  }
  
  return { browser, page };
}

// Close the browser and page
async function closeBrowserAndPage() {
  if (page) {
    await page.close();
    page = null;
  }
  
  if (browser) {
    await browser.close();
    browser = null;
  }
  
  // Update global state
  if (global.mcpBrowserState) {
    global.mcpBrowserState.isConnected = false;
    global.mcpBrowserState.lastActivity = new Date();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { command } = body;
    
    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'No command provided'
      }, { status: 400 });
    }
    
    console.log('[API] MCP command received:', command);
    
    // Ensure browser and page are initialized
    try {
      await ensureBrowserAndPage();
    } catch (error) {
      console.error('[API] Failed to initialize browser:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize browser'
      }, { status: 500 });
    }
    
    // Parse the command to determine the action and execute it using Playwright
    let step: any = null;
    let message = 'Command executed successfully';
    
    try {
      if (command.toLowerCase().startsWith('navigate to') || command.toLowerCase().startsWith('go to')) {
        const url = command.split(/navigate to|go to/i)[1].trim();
        if (url) {
          const fullUrl = url.startsWith('http') ? url : `https://${url}`;
          
          // Use Playwright to navigate to the URL
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
          
          step = {
            action: 'navigate',
            value: fullUrl,
            description: `Navigate to ${url}`
          };
          message = `Successfully navigated to ${url}`;
        }
      } else if (command.toLowerCase().includes('click') || command.toLowerCase().includes('press')) {
        const match = command.match(/click(?:\s+on)?\s+(?:the\s+)?(.*?)(?:\s+button|\s+link|\s+element|$)/i);
        const elementText = match ? match[1].trim() : null;
        
        if (elementText) {
          // Try different selector strategies
          try {
            // Try to find by text content
            await page.click(`text=${elementText}`, { timeout: 2000 });
          } catch (error) {
            try {
              // Try to find by button text
              await page.click(`button:has-text("${elementText}")`, { timeout: 2000 });
            } catch (error) {
              try {
                // Try to find by link text
                await page.click(`a:has-text("${elementText}")`, { timeout: 2000 });
              } catch (error) {
                // Try to find by placeholder
                await page.click(`[placeholder*="${elementText}" i]`, { timeout: 2000 });
              }
            }
          }
          
          step = {
            action: 'click',
            selector: `text=${elementText}`,
            description: `Click on ${elementText}`
          };
          message = `Successfully clicked on "${elementText}"`;
        }
      } else if (command.toLowerCase().includes('type') || command.toLowerCase().includes('enter') || command.toLowerCase().includes('input')) {
        const typeMatch = command.match(/(?:type|enter|input)\s+(?:"([^"]*)"|'([^']*)'|([^\s]+))(?:\s+(?:in|into|on)\s+(?:the\s+)?(.*?)(?:\s+field|\s+input|\s+box|$))?/i);
        
        if (typeMatch) {
          const textToType = typeMatch[1] || typeMatch[2] || typeMatch[3];
          const fieldDesc = typeMatch[4] ? typeMatch[4].trim() : 'active field';
          
          // Try different selector strategies
          let filled = false;
          
          if (fieldDesc !== 'active field') {
            try {
              // Try by label text
              await page.fill(`label:has-text("${fieldDesc}") + input, label:has-text("${fieldDesc}") input`, textToType);
              filled = true;
            } catch (error) {
              try {
                // Try by placeholder
                await page.fill(`[placeholder*="${fieldDesc}" i]`, textToType);
                filled = true;
              } catch (error) {
                try {
                  // Try by name attribute
                  await page.fill(`[name*="${fieldDesc}" i]`, textToType);
                  filled = true;
                } catch (error) {
                  // Try common input types
                  if (fieldDesc.includes('email')) {
                    await page.fill('input[type="email"]', textToType);
                    filled = true;
                  } else if (fieldDesc.includes('password')) {
                    await page.fill('input[type="password"]', textToType);
                    filled = true;
                  } else {
                    // Last resort: try to find any visible input
                    await page.fill('input:visible', textToType);
                    filled = true;
                  }
                }
              }
            }
          } else {
            // If no field specified, try to use the focused element
            await page.keyboard.type(textToType);
            filled = true;
          }
          
          if (filled) {
            step = {
              action: 'type',
              selector: fieldDesc,
              value: textToType,
              description: `Type "${textToType}" in ${fieldDesc}`
            };
            message = `Successfully typed "${textToType}" in ${fieldDesc}`;
          }
        }
      } else if (command.toLowerCase().includes('wait') || command.toLowerCase().includes('pause')) {
        const waitMatch = command.match(/(\d+)\s*(?:seconds|second|s|ms|milliseconds)/i);
        const waitTime = waitMatch ? parseInt(waitMatch[1]) : 1;
        
        // Use Playwright to wait
        await page.waitForTimeout(waitTime * 1000);
        
        step = {
          action: 'wait',
          value: `${waitTime * 1000}`, // Convert to milliseconds
          description: `Wait for ${waitTime} second(s)`
        };
        message = `Waited for ${waitTime} second(s)`;
      } else if (command.toLowerCase().includes('select') || command.toLowerCase().includes('choose')) {
        const selectMatch = command.match(/(?:select|choose)\s+(?:"([^"]*)"|'([^']*)'|([^\s]+))(?:\s+(?:from|in|on)\s+(?:the\s+)?(.*?)(?:\s+dropdown|\s+select|\s+menu|$))?/i);
        
        if (selectMatch) {
          const optionToSelect = selectMatch[1] || selectMatch[2] || selectMatch[3];
          const selectDesc = selectMatch[4] ? selectMatch[4].trim() : 'dropdown';
          
          // Try different selector strategies
          try {
            // Try by label
            await page.selectOption(`label:has-text("${selectDesc}") + select, label:has-text("${selectDesc}") select`, optionToSelect);
          } catch (error) {
            try {
              // Try by name
              await page.selectOption(`select[name*="${selectDesc}" i]`, optionToSelect);
            } catch (error) {
              // Try any visible select
              await page.selectOption('select:visible', optionToSelect);
            }
          }
          
          step = {
            action: 'select',
            selector: selectDesc,
            value: optionToSelect,
            description: `Select "${optionToSelect}" from ${selectDesc}`
          };
          message = `Successfully selected "${optionToSelect}" from ${selectDesc}`;
        }
      }
    } catch (error) {
      console.error('[API] Error executing command with Playwright:', error);
      return NextResponse.json({
        success: false,
        error: `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`
      }, { status: 500 });
    }
    
    // Return the results of the Playwright execution
    return NextResponse.json({
      success: true,
      message,
      step
    });
  } catch (error) {
    console.error('[API] Error processing MCP command:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process command', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
