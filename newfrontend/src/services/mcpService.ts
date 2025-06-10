/**
 * MCP Service - API client for communicating with MCP backend
 * Handles browser automation session management and command execution
 */

// Types
export interface BrowserSession {
  sessionId: string;
  browserType: string;
  status: string;
  timestamp?: string;
}

export interface CommandResult {
  success: boolean;
  sessionId: string;
  commandId: string;
  message: string;
  result: any;
}

export interface NavigateResult {
  success: boolean;
  url: string;
  status?: number;
  sessionId: string;
}

// Service implementation
const API_BASE = '/api/mcp';

/**
 * Create a new browser automation session
 */
export const createBrowserSession = async (options: {
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: { width: number; height: number };
}): Promise<BrowserSession> => {
  const response = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create browser session');
  }
  
  return response.json();
};

/**
 * Close a browser session
 */
export const closeBrowserSession = async (sessionId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to close browser session');
  }
  
  return response.json();
};

/**
 * Navigate to a URL in the browser session
 */
export const navigateToUrl = async (
  sessionId: string,
  url: string
): Promise<NavigateResult> => {
  const response = await fetch(`${API_BASE}/session/${sessionId}/navigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to navigate');
  }
  
  return response.json();
};

/**
 * Execute a command in the browser session
 */
export const executeCommand = async (
  sessionId: string,
  action: string,
  selector: string,
  value?: string,
  options?: any
): Promise<CommandResult> => {
  const response = await fetch(`${API_BASE}/session/${sessionId}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, selector, value, options })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to execute command');
  }
  
  return response.json();
};

/**
 * Take a screenshot of the current page
 */
export const takeScreenshot = async (
  sessionId: string,
  options?: { fullPage?: boolean; type?: 'png' | 'jpeg' }
): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/session/${sessionId}/screenshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to take screenshot');
  }
  
  return response.blob();
};

/**
 * Get the page HTML content
 */
export const getPageContent = async (sessionId: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/session/${sessionId}/content`, {
    method: 'GET'
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to get page content');
  }
  
  return response.text();
};

/**
 * Get page metadata (title, URL)
 */
export const getPageMetadata = async (sessionId: string): Promise<{ url: string; title: string; sessionId: string }> => {
  const response = await fetch(`${API_BASE}/session/${sessionId}/metadata`, {
    method: 'GET'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get page metadata');
  }
  
  return response.json();
};

/**
 * Check MCP service status
 */
export const checkStatus = async (): Promise<{ status: string; version: string }> => {
  const response = await fetch(`${API_BASE}/status`);
  
  if (!response.ok) {
    throw new Error('MCP service is unavailable');
  }
  
  return response.json();
};
