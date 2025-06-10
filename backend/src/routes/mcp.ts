import express, { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { MCP_SCRIPT } from '../mcp-script';
import { Browser, chromium, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
interface MCPMessage {
  type: 'command' | 'response';
  id: string;
  command?: MCPCommand;
  response?: {
    success: boolean;
    error?: string;
  };
  origin?: string;
}

interface MCPCommand {
  id: string;
  action: 'type' | 'click';
  text?: string;
  targetDescription: string;
  selectors: string[];
}

// Create Express router
const router = Router();

// Store active sessions
const activeSessions = new Map<string, {
  browser: Browser;
  page: Page;
  lastActivity: number;
}>();

// Clean up inactive sessions
const cleanUpInactiveSessions = () => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > 300000) { // 5 minutes
      console.log('Cleaning up inactive session:', sessionId);
      session.browser.close().catch(console.error);
      activeSessions.delete(sessionId);
    }
  }
};

// Create new MCP session
router.post('/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Validate URL is allowed
    if (!url.startsWith('http://localhost:3000') && !url.startsWith('https://apply-qa.apps.asu.edu')) {
      res.status(400).json({ error: 'URL not allowed' });
      return;
    }

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    await page.evaluate(MCP_SCRIPT);

    // Handle MCP messages
    page.on('worker', async (msg: any) => {
      const message = msg as MCPMessage;
      if (message.type === 'response') {
        console.log('Received MCP response:', message);
      }
    });

    const sessionId = uuidv4();
    activeSessions.set(sessionId, {
      browser,
      page,
      lastActivity: Date.now()
    });

    // Start cleanup timer
    setInterval(cleanUpInactiveSessions, 30000);

    res.json({ sessionId });
    return;
  } catch (error) {
    console.error('Error creating MCP session:', error);
    next(error);
  }
});

// Execute MCP command
router.post('/session/:sessionId/command', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body as { command: MCPCommand };

    const session = activeSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    session.lastActivity = Date.now();

    // Send command to browser
    await session.page.evaluate((cmd: MCPCommand) => {
      window.postMessage({
        type: 'command',
        id: cmd.id,
        command: cmd
      }, 'http://localhost:3000');
    }, { id: uuidv4(), ...command });

    res.json({ success: true });
    return;
  } catch (error) {
    console.error('Error executing MCP command:', error);
    next(error);
  }
});

// Close MCP session
router.delete('/session/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.browser.close();
    activeSessions.delete(sessionId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error closing MCP session:', error);
    throw error;
  }
});

          const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      const element = elements[0];
      element.focus();
      element.value = command.text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return { typed: true, selector };
    }
  }
  throw new Error('No matching elements found for type command');
}      }
    })();
  `;

  await page.evaluate(mcpScript);
}

const createSessionHandler = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL is allowed
    if (!url.startsWith('http://localhost:3000') && !url.startsWith('https://apply-qa.apps.asu.edu')) {
      return res.status(400).json({ error: 'URL not allowed' });
    }

    const session = await createBrowserSession();
    await session.page.goto(url);
    await injectMCP(session.page);

    const sessionId = uuidv4();
    activeSessions.set(sessionId, session);

    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating MCP session:', error);
    next(error);
  }
}
};

// Create new MCP session
router.post('/session', createSessionHandler);
});

const executeCommandHandler = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body as { command: MCPCommand };

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.lastActivity = Date.now();

    // Send command to browser
    await session.page.evaluate((cmd: MCPCommand) => {
      window.postMessage({
        type: 'command',
        id: cmd.id,
        command: cmd
      }, '*');
    }, { id: uuidv4(), ...command });

    res.json({ success: true });
  } catch (error) {
    console.error('Error executing MCP command:', error);
    next(error);
  }
}
}
};

// Execute MCP command
router.post('/session/:sessionId/command', executeCommandHandler);

const closeSessionHandler = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (session) {
      await session.context.close();
      await session.browser.close();
      activeSessions.delete(sessionId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error closing MCP session:', error);
    next(error);
  }
};

// Close MCP session
router.delete('/session/:sessionId', closeSessionHandler);

// Clean up inactive sessions
setInterval(() => {
  for (const [sessionId, session] of activeSessions) {
    if (Date.now() - session.lastActivity > sessionTimeout) {
      try {
        session.context.close();
        session.browser.close();
        activeSessions.delete(sessionId);
        console.log(`Cleaned up inactive session: ${sessionId}`);
      } catch (error) {
        console.error(`Error cleaning up session ${sessionId}:`, error);
      }
    }
  }
}, 60000); // Check every minute

export default router;
