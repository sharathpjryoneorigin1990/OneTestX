import { Router } from 'express';
import { MCP_SCRIPT } from '../mcp-script';
import { chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
// Create Express router
const router = Router();
// Store active sessions
const activeSessions = new Map();
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
router.post('/session', async (req, res, next) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        // Validate URL is allowed
        if (!url.startsWith('http://localhost:3000') && !url.startsWith('https://apply-qa.apps.asu.edu')) {
            return res.status(400).json({ error: 'URL not allowed' });
        }
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(url);
        await page.evaluate(MCP_SCRIPT);
        const sessionId = uuidv4();
        activeSessions.set(sessionId, {
            browser,
            page,
            lastActivity: Date.now()
        });
        // Start cleanup timer
        setInterval(cleanUpInactiveSessions, 30000);
        return res.json({ sessionId });
    }
    catch (error) {
        console.error('Error creating MCP session:', error);
        throw error;
    }
});
// Execute MCP command
router.post('/session/:sessionId/command', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { command } = req.body;
        const session = activeSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        session.lastActivity = Date.now();
        // Send command to browser
        await session.page.evaluate((cmd) => {
            window.postMessage({
                type: 'command',
                id: cmd.id,
                command: cmd
            }, '*');
        }, { id: uuidv4(), ...command });
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Error executing MCP command:', error);
        throw error;
    }
});
// Close MCP session
router.delete('/session/:sessionId', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = activeSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        await session.browser.close();
        activeSessions.delete(sessionId);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Error closing MCP session:', error);
        throw error;
    }
});
export default router;
success: true,
    message;
'Command executed successfully',
    data;
result;
event.origin;
;
try { }
catch (error) {
    event.source.postMessage({
        id: event.data.id,
        type: 'command-response',
        result: {
            success: false,
            message: error.message
        }
    }, event.origin);
}
;
function handleCommandClick(command) {
    const selectors = command.selectors || [];
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            elements[0].click();
            return { clicked: true, selector };
        }
    }
    throw new Error('No matching elements found for click command');
}
function handleCommandType(command) {
    const selectors = command.selectors || [];
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            const element = elements[0];
            element.focus();
            element.value = command.text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            return { typed: true, selector, text: command.text };
        }
    }
    throw new Error('No matching elements found for type command');
}
();
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
        console.log(`;
Cleaned;
up;
inactive;
session: $;
{
    sessionId;
}
`);
      } catch (error) {
        console.error(`;
Error;
cleaning;
up;
session;
$;
{
    sessionId;
}
`, error);
      }
    }
  }
}, 60000); // Check every minute

export default router;
;
