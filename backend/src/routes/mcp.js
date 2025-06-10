import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCP_SCRIPT } from '../mcp-script.js';
import {
  createBrowserSession,
  closeBrowserSession,
  navigateTo,
  executeAction,
  takeScreenshot,
  getPageContent,
  getActiveSessions,
  getPageMetadata
} from '../utils/browserManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// MCP Routes
// These routes provide API endpoints for the MCP (Model Context Protocol) functionality
// Used for browser automation and test recording/playback

// Check MCP service status
router.get('/status', (req, res) => {
  console.log('[API] MCP status check requested');
  res.json({ status: 'active', version: '1.0' });
});

// Start a new MCP session with actual browser launch
router.post('/session', async (req, res) => {
  try {
    console.log('[API] New MCP session requested', req.body);
    const sessionId = `mcp-${Date.now()}`;
    
    // Extract browser options from request
    const options = {
      browserType: req.body.browserType || 'chromium',
      headless: req.body.headless !== false, // Default to headless unless explicitly set to false
      viewport: req.body.viewport || { width: 1280, height: 720 },
      recordVideo: req.body.recordVideo || false
    };
    
    // Create a real browser session
    const session = await createBrowserSession(sessionId, options);
    
    res.json({
      sessionId,
      message: 'Session created successfully with browser automation',
      status: 'active',
      browserType: options.browserType,
      headless: options.headless
    });
  } catch (error) {
    console.error('[API] Error creating MCP session:', error);
    res.status(500).json({
      error: 'Failed to create browser session',
      message: error.message
    });
  }
});

// Get MCP script for injection
router.get('/script', (req, res) => {
  console.log('[API] MCP script requested');
  res.setHeader('Content-Type', 'application/javascript');
  res.send(MCP_SCRIPT);
});

// Start recording
router.post('/start-recording', (req, res) => {
  console.log('[API] Start recording requested', req.body);
  res.json({ 
    status: 'recording',
    message: 'Recording started'
  });
});

// Stop recording
router.post('/stop-recording', (req, res) => {
  console.log('[API] Stop recording requested');
  res.json({ 
    status: 'stopped',
    message: 'Recording stopped'
  });
});

// Save recorded test
router.post('/save-test', (req, res) => {
  const { name, steps, websiteUrl } = req.body;
  console.log('[API] Save test requested', { name, websiteUrl, stepsCount: steps?.length || 0 });
  
  if (!name || !steps) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const testId = `test-${Date.now()}`;
  res.json({
    testId,
    name,
    message: 'Test saved successfully'
  });
});

// Execute a command (for manual testing)
router.post('/execute', (req, res) => {
  const { action, selector, value } = req.body;
  console.log('[API] Execute command requested', { action, selector, value });
  
  if (!action || !selector) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  res.json({
    success: true,
    message: `Executed ${action} on ${selector}`
  });
});

// Session-specific command execution with real browser automation
router.post('/session/:sessionId/command', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action, selector, value, options } = req.body;
    
    console.log(`[API] Command received for session ${sessionId}:`, { action, selector, value });
    
    // Validate the command
    if (!action || !selector) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Action and selector are required'
      });
    }
    
    // Execute the action in the browser
    const result = await executeAction(sessionId, {
      action,
      selector,
      value,
      options
    });
    
    res.json({
      success: true,
      sessionId,
      commandId: `cmd-${Date.now()}`,
      message: `Command '${action}' executed successfully on '${selector}'`,
      result
    });
  } catch (error) {
    console.error(`[API] Error executing command:`, error);
    res.status(500).json({
      error: 'Failed to execute command',
      message: error.message
    });
  }
});

// Close a browser session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`[API] Request to close session: ${sessionId}`);
    
    const closed = await closeBrowserSession(sessionId);
    
    if (closed) {
      res.json({
        success: true,
        message: `Session ${sessionId} closed successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Session ${sessionId} not found or already closed`
      });
    }
  } catch (error) {
    console.error(`[API] Error closing session:`, error);
    res.status(500).json({
      error: 'Failed to close session',
      message: error.message
    });
  }
});

// Navigate to a URL
router.post('/session/:sessionId/navigate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'Missing URL',
        message: 'URL is required for navigation'
      });
    }
    
    console.log(`[API] Navigating session ${sessionId} to: ${url}`);
    
    const result = await navigateTo(sessionId, url);
    res.json({
      success: true,
      message: `Navigated to ${url}`,
      ...result
    });
  } catch (error) {
    console.error(`[API] Navigation error:`, error);
    res.status(500).json({
      error: 'Failed to navigate',
      message: error.message
    });
  }
});

// Take a screenshot
router.post('/session/:sessionId/screenshot', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const options = req.body || {};
    
    console.log(`[API] Taking screenshot for session ${sessionId}`);
    
    const imageBuffer = await takeScreenshot(sessionId, options);
    
    res.set('Content-Type', `image/${options.type || 'png'}`);
    res.send(imageBuffer);
  } catch (error) {
    console.error(`[API] Screenshot error:`, error);
    res.status(500).json({
      error: 'Failed to take screenshot',
      message: error.message
    });
  }
});

// Get page content
router.get('/session/:sessionId/content', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`[API] Getting page content for session ${sessionId}`);
    
    const content = await getPageContent(sessionId);
    res.send(content);
  } catch (error) {
    console.error(`[API] Error getting page content:`, error);
    res.status(500).json({
      error: 'Failed to get page content',
      message: error.message
    });
  }
});

// Get page metadata
router.get('/session/:sessionId/metadata', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`[API] Getting page metadata for session ${sessionId}`);
    
    const metadata = await getPageMetadata(sessionId);
    res.json(metadata);
  } catch (error) {
    console.error(`[API] Error getting page metadata:`, error);
    res.status(500).json({
      error: 'Failed to get page metadata',
      message: error.message
    });
  }
});

// List active sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = getActiveSessions();
    res.json({
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error(`[API] Error listing sessions:`, error);
    res.status(500).json({
      error: 'Failed to list sessions',
      message: error.message
    });
  }
});

export default router;
