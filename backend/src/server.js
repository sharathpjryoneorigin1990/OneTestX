import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs/promises';
import { existsSync, mkdirSync, readdirSync, createWriteStream } from 'fs';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

// Setup logging
const logStream = createWriteStream('server-debug.log', { flags: 'a' });
const originalConsoleLog = console.log;
console.log = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');
    
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] ${message}\n`);
    originalConsoleLog.apply(console, args);
};
import performanceRoutes from './routes/performance.js';
import testRoutes from './routes/tests.js';
import k6TestRoutes from './routes/k6-tests.js';
import visualTestRoutes from './routes/visualTests.js';
import accessibilityTestRoutes from './routes/accessibilityTests.js';
import keyboardTestRoutes from './routes/keyboardTests.js';
import imageRoutes from './routes/imageServer.js';
import behaviorAnalysisRoutes from './routes/behaviorAnalysis.js';
import jiraRoutes from './routes/jira.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting server script...');

// Initialize Express app
const app = express();

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3005',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3005'
    ];
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Add CORS headers to all responses
app.use((req, res, next) => {
  // Allow all origins for development
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log request details
    console.log(`\n[${timestamp}] Incoming request:`, {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body
    });
    
    // Log response when it's finished
    const originalSend = res.send;
    res.send = function(body) {
        const duration = Date.now() - start;
        console.log(`[${timestamp}] Response sent:`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            headers: res.getHeaders()
        });
        return originalSend.call(this, body);
    };
    
    next();
});

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' },
});


// Performance testing routes
app.use('/performance', performanceRoutes);

// In-memory flow storage
let flows = {};
const tempDir = path.join(__dirname, '../temp');
const flowsPath = path.join(tempDir, 'flows.json');

// Ensure temp directory exists
if (!existsSync(tempDir)) {
    console.log('Creating temp directory...');
    mkdirSync(tempDir, { recursive: true });
}

// Load flows from file if it exists
async function loadFlows() {
    try {
        const data = await fs.readFile(flowsPath, 'utf8');
        flows = JSON.parse(data);
        console.log(`Loaded ${Object.keys(flows).length} flows`);
    } catch (err) {
        console.log('No existing flows file found, starting fresh');
    }
}

// Save flows to file
async function saveFlows() {
    try {
        await fs.writeFile(flowsPath, JSON.stringify(flows, null, 2));
    } catch (err) {
        console.error('Error saving flows:', err);
    }
}

// Initialize flows
loadFlows().catch(console.error);

// REST endpoints for flows
app.get('/flows', (req, res) => {
    res.json(Object.values(flows));
});
app.get('/flows/:id', (req, res) => {
    const flow = flows[req.params.id];
    if (!flow)
        return res.status(404).json({ error: 'Not found' });
    res.json(flow);
});
app.post('/flows', (req, res) => {
    const id = Date.now().toString();
    const flow = Object.assign(Object.assign({}, req.body), { id });
    flows[id] = flow;
    saveFlows();
    res.status(201).json(flow);
});
app.put('/flows/:id', (req, res) => {
    if (!flows[req.params.id])
        return res.status(404).json({ error: 'Not found' });
    flows[req.params.id] = Object.assign(Object.assign({}, req.body), { id: req.params.id });
    saveFlows();
    res.json(flows[req.params.id]);
});
app.delete('/flows/:id', (req, res) => {
    if (!flows[req.params.id])
        return res.status(404).json({ error: 'Not found' });
    delete flows[req.params.id];
    saveFlows();
    res.status(204).send();
});
// REST endpoint to run test code snippet
app.post('/run-test', async (req, res) => {
    const { code, name, env = 'qa' } = req.body;
    
    try {
        if (name) {
            // Logic to run existing test file by name
            const testFilePath = path.resolve(__dirname, '../tests', name);
            
            // Check if file exists
            const fs = await import('fs/promises');
            try {
                await fs.access(testFilePath);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    output: `Test file not found: ${name}`,
                    status: 'error'
                });
            }
            
            const command = 'npx';
            const testPathForPlaywright = path.relative(path.resolve(__dirname, '../'), testFilePath);
            const args = ['playwright', 'test', testPathForPlaywright, '--quiet'];
            
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            try {
                const { stdout, stderr } = await execAsync(`${command} ${args.join(' ')}`, {
                    env: { ...process.env, ENV: env },
                    cwd: path.resolve(__dirname, '../')
                });
                
                return res.json({
                    success: true,
                    output: stdout || stderr,
                    status: 'completed'
                });
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    output: error.message,
                    status: 'error'
                });
            }
        } else if (code) {
            // Handle direct code execution if needed
            return res.status(400).json({
                success: false,
                output: 'Direct code execution is not supported',
                status: 'error'
            });
        } else {
            return res.status(400).json({
                success: false,
                output: 'No test name or code provided',
                status: 'error'
            });
        }
    } catch (error) {
        console.error('Error in run-test:', error);
        return res.status(500).json({
            success: false,
            output: error.message,
            status: 'error'
        });
    }
});
// Helper function to get test files
async function getTestFiles(dir) {
    const files = [];
    console.log(`\n--- Scanning directory: ${dir} ---`);
    
    try {
        const entries = readdirSync(dir, { withFileTypes: true });
        console.log(`Found ${entries.length} entries in ${dir}`);
        
        for (const [index, entry] of entries.entries()) {
            const fullPath = path.join(dir, entry.name);
            const entryType = entry.isDirectory() ? 'dir' : 'file';
            console.log(`\n[${index + 1}/${entries.length}] Processing ${entryType}: ${entry.name}`);
            console.log(`Full path: ${fullPath}`);
            
            try {
                if (entry.isDirectory()) {
                    console.log(`Recursing into directory...`);
                    const subFiles = await getTestFiles(fullPath);
                    console.log(`Found ${subFiles.length} test files in ${fullPath}`);
                    files.push(...subFiles);
                } else {
                    const isTestFile = entry.name.endsWith('.test.js') || 
                                     entry.name.endsWith('.spec.js') || 
                                     entry.name.endsWith('-test.js');
                    console.log(`Is test file: ${isTestFile}`);
                    
                    if (isTestFile) {
                        console.log(`Processing test file: ${entry.name}`);
                        console.log(`Full path: ${fullPath}`);
                        console.log(`File exists: ${existsSync(fullPath)}`);
                        
                        // Read the file to get test suites and cases
                        const content = readFileSync(fullPath, 'utf8');
                        
                        // Parse the file to get test suites and cases
                        const testSuites = [];
                        const suiteRegex = /(describe|suite)\(['"]([^'"]+)['"],/g;
                        const testRegex = /(it|test)\(['"]([^'"]+)['"]/g;
                        
                        let match;
                        while ((match = suiteRegex.exec(content)) !== null) {
                            testSuites.push({
                                name: match[2],
                                tests: []
                            });
                        }
                        
                        // If no test suites found, add a default one
                        if (testSuites.length === 0) {
                            testSuites.push({
                                name: path.basename(fullPath, '.js'),
                                tests: []
                            });
                        }
                        
                        // Find all test cases
                        while ((match = testRegex.exec(content)) !== null) {
                            testSuites[testSuites.length - 1].tests.push(match[2]);
                        }
                        
                        // Add the test file to the list
                        files.push({
                            name: entry.name,
                            path: path.relative(path.resolve(__dirname, '..'), fullPath).replace(/\\/g, '/'),
                            category: path.dirname(path.relative(dir, fullPath)).split(path.sep)[0] || 'tests',
                            tags: [],
                            suites: testSuites
                        });
                    }
                }
            } catch (error) {
                console.error(`Error processing ${entry.name}:`, error);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
    }
    
    return files;
}

// Use the test routes
app.use('/api/tests', testRoutes);

// Use the accessibility test routes
app.use('/api/accessibility', accessibilityTestRoutes);

// Use the Jira routes
app.use('/api/jira', jiraRoutes);

// Use the test routes
console.log('Registering test routes...');
try {
  // Add behavior analysis routes
  app.use('/api', behaviorAnalysisRoutes);
  console.log('Successfully registered /api route');
  app.use('/api/tests', testRoutes);
  console.log('Successfully registered /api/tests route');
} catch (err) {
  console.error('Failed to register /api/tests route:', err);
}

try {
  app.use('/api/k6-tests', k6TestRoutes);
  console.log('Successfully registered /api/k6-tests route');
} catch (err) {
  console.error('Failed to register /api/k6-tests route:', err);
}

try {
  app.use('/api/visual-tests', visualTestRoutes);
  console.log('Successfully registered /api/visual-tests route');
} catch (err) {
  console.error('Failed to register /api/visual-tests route:', err);
}

try {
  app.use('/api/keyboard-tests', keyboardTestRoutes);
  console.log('Successfully registered /api/keyboard-tests route');
} catch (err) {
  console.error('Failed to register /api/keyboard-tests route:', err);
}

try {
  app.use('/api', imageRoutes);
  console.log('Successfully registered image server routes');
} catch (err) {
  console.error('Failed to register image server routes:', err);
}

// Legacy endpoint for backward compatibility
app.get('/tests', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3005/api/tests');
        const data = await response.json();
        res.json(data.testsByCategory || {});
    } catch (err) {
        console.error('Error fetching tests:', err);
        res.status(500).json({ 
            error: 'Failed to fetch tests',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Socket.io for real-time test execution
io.on('connection', (socket) => {
    // Run dynamic test code snippet (existing)
    socket.on('run-playwright-test', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const code = data === null || data === void 0 ? void 0 : data.code;
        if (!code) {
            socket.emit('test-status', { status: 'error', error: 'No code provided' });
            return;
        }
        try {
            const fileName = `flow-${Date.now()}.spec.ts`;
            const filePath = path_1.default.join(tempDir, fileName);
            fs_1.default.writeFileSync(filePath, code, 'utf8');
            const emitLog = (msg) => {
                const timestamp = new Date().toISOString();
                socket.emit('test-log', { log: `[${timestamp}] ${msg}` });
            };
            socket.emit('test-status', { status: 'running', log: 'Running Playwright test...' });
            const child = (0, child_process_1.spawn)('npx', ['playwright', 'test', filePath], { shell: true });
            child.stdout.on('data', (data) => emitLog(data.toString()));
            child.stderr.on('data', (data) => emitLog(data.toString()));
            child.on('close', (code) => {
                if (code === 0) {
                    socket.emit('test-status', { status: 'success', log: 'Test passed!' });
                }
                else {
                    socket.emit('test-status', { status: 'error', log: `Test failed with code ${code}` });
                }
            });
        }
        catch (err) {
            socket.emit('test-status', { status: 'error', error: err instanceof Error ? err.message : String(err) });
        }
    }));
    // NEW: Run existing test file by path
    socket.on('run-playwright-test-file', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { testFilePath, env = 'qa' } = data;
        if (!testFilePath) {
            socket.emit('test-status', { status: 'error', error: 'No testFilePath provided' });
            return;
        }
        try {
            const resolvedPath = path_1.default.resolve(testFilePath);
            if (!fs_1.default.existsSync(resolvedPath)) {
                socket.emit('test-status', { status: 'error', error: 'Test file does not exist' });
                return;
            }
            const emitLog = (msg) => {
                const timestamp = new Date().toISOString();
                socket.emit('test-log', { log: `[${timestamp}] ${msg}` });
            };
            socket.emit('test-status', { status: 'running', log: `Running Playwright test file: ${resolvedPath}` });
            const child = (0, child_process_1.spawn)('npx', ['playwright', 'test', resolvedPath], {
                shell: true,
                env: Object.assign(Object.assign({}, process.env), { ENV: env }),
            });
            child.stdout.on('data', (data) => emitLog(data.toString()));
            child.stderr.on('data', (data) => emitLog(data.toString()));
            child.on('close', (code) => {
                if (code === 0) {
                    socket.emit('test-status', { status: 'success', log: 'Test passed!' });
                }
                else {
                    socket.emit('test-status', { status: 'error', log: `Test failed with code ${code}` });
                }
            });
            child.on('error', (error) => {
                socket.emit('test-status', { status: 'error', error: error.message });
            });
        }
        catch (err) {
            socket.emit('test-status', { status: 'error', error: err instanceof Error ? err.message : String(err) });
        }
    }));
});
// Clean up old temp files hourly
function cleanupTempFiles() {
    fs_1.default.readdir(tempDir, (err, files) => {
        files === null || files === void 0 ? void 0 : files.forEach(file => {
            if (file.endsWith('.spec.ts')) {
                const filePath = path_1.default.join(tempDir, file);
                const stats = fs_1.default.statSync(filePath);
                if (Date.now() - stats.mtimeMs > 3600000)
                    fs_1.default.unlinkSync(filePath);
            }
        });
    });
}
setInterval(cleanupTempFiles, 60 * 60 * 1000);
// Start the server
const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Performance testing API available at http://localhost:${PORT}/api/performance`);
});
console.log('Script end');
