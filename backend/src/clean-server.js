import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';
import performanceRoutes from './routes/performance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting server script...');

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' },
});

// Middleware
app.use(cors());
app.use(express.json());

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

// Helper function to get test files
function getTestFiles(dir) {
    const fs = require('fs');
    const path = require('path');
    
    const files = [];
    
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            try {
                try {
                    if (entry.isDirectory()) {
                        files.push(...getTestFiles(fullPath));
                    } else if (entry.isFile()) {
                        const isTestFile = [
                            entry.name.endsWith('.test.js'),
                            entry.name.endsWith('.spec.js'),
                            entry.name.endsWith('.test.ts'),
                            entry.name.endsWith('.spec.ts'),
                            (entry.name.endsWith('.js') && (entry.name.includes('.test.') || entry.name.includes('.spec.')))
                        ].some(Boolean);

                        if (isTestFile) {
                            const relativePath = path.relative(path.join(__dirname, '..'), fullPath);
                            const pathParts = path.dirname(relativePath).split(path.sep);
                            const category = pathParts.length > 0 ? pathParts[0] : 'other';
                            
                            files.push({
                                name: entry.name,
                                path: relativePath.replace(/\\/g, '/'), // Ensure forward slashes for consistency
                                category: category,
                                tags: [category, ...pathParts],
                                fullPath: fullPath.replace(/\\/g, '/')
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error processing ${fullPath}:`, err);
                }
            } catch (err) {
                console.error(`Error processing ${fullPath}:`, err);
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }
    
    return files;
}

// REST endpoint to list test files in tests folder
app.get('/tests', (req, res) => {
    try {
        const testsDir = path.resolve(__dirname, '../tests');
        
        // Check if tests directory exists
        if (!existsSync(testsDir)) {
            console.log(`Tests directory not found at ${testsDir}, creating...`);
            mkdirSync(testsDir, { recursive: true });
            return res.json({});
        }
        
        const testFiles = getTestFiles(testsDir);
        
        // Group tests by category
        const testsByCategory = testFiles.reduce((acc, test) => {
            const category = test.category || 'other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(test);
            return acc;
        }, {});
        
        res.json(testsByCategory);
    } catch (err) {
        console.error('Error reading test files:', err);
        res.status(500).json({ 
            error: 'Failed to read test files',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Socket.io for real-time test execution
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('run-test', async ({ filePath, env = 'development' }) => {
        console.log(`Running test: ${filePath} in ${env} environment`);
        
        const emitLog = (msg) => {
            socket.emit('test-log', { type: 'log', message: msg });
        };
        
        try {
            const resolvedPath = path.resolve(__dirname, '..', filePath);
            
            if (!resolvedPath.startsWith(path.resolve(__dirname, '..'))) {
                throw new Error('Access denied');
            }
            
            emitLog(`Running test: ${resolvedPath}`);
            socket.emit('test-status', { status: 'running', log: `Running Playwright test file: ${resolvedPath}` });
            
            const child = spawn('npx', ['playwright', 'test', resolvedPath], {
                shell: true,
                env: { ...process.env, ENV: env }
            });
            
            child.stdout.on('data', (data) => emitLog(data.toString()));
            child.stderr.on('data', (data) => emitLog(`ERROR: ${data}`));
            
            child.on('close', (code) => {
                const status = code === 0 ? 'passed' : 'failed';
                emitLog(`Test ${status} with code ${code}`);
                socket.emit('test-status', { 
                    status,
                    code,
                    log: `Test ${status}`
                });
            });
            
        } catch (error) {
            console.error('Error running test:', error);
            socket.emit('test-status', { 
                status: 'error', 
                error: error.message,
                log: `Error: ${error.message}`
            });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Clean up old temp files hourly
function cleanupTempFiles() {
    const tempDir = path.join(__dirname, '../temp');
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    fs.readdir(tempDir)
        .then(files => {
            const now = Date.now();
            
            files.forEach(file => {
                if (file.startsWith('temp-') && file.endsWith('.js')) {
                    const filePath = path.join(tempDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (now - stats.mtimeMs > maxAge) {
                        fs.unlink(filePath).catch(console.error);
                    }
                }
            });
        })
        .catch(console.error);
}

// Start cleanup interval
setInterval(cleanupTempFiles, 60 * 60 * 1000);

// Start the server
const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Performance testing API available at http://localhost:${PORT}/api/performance`);
});

console.log('Server started successfully');
