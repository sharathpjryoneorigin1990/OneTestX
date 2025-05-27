import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const execAsync = promisify(exec);

// Run a K6 load test
router.post('/run', async (req, res) => {
    const { testName, env = 'qa' } = req.body;
    
    if (!testName) {
        return res.status(400).json({
            success: false,
            output: 'Test name is required',
            status: 'error'
        });
    }
    
    try {
        // Log the current working directory for debugging
        const cwd = process.cwd();
        console.log(`Current working directory: ${cwd}`);
        
        // Try to find the test file in different possible locations
        const possiblePaths = [
            // Relative to project root
            path.resolve(__dirname, '../../tests/performance/load/load-test.js'),
            // Relative to backend directory
            path.resolve(__dirname, '../tests/performance/load/load-test.js'),
            // Try with the provided path
            path.resolve(__dirname, '../../', testName)
        ];
        
        let testPath = null;
        for (const possiblePath of possiblePaths) {
            try {
                await access(possiblePath);
                testPath = possiblePath;
                break;
            } catch (err) {
                console.log(`File not found at: ${possiblePath}`);
            }
        }
        
        if (!testPath) {
            const errorMessage = `Test file not found. Tried:\n${possiblePaths.join('\n')}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
        
        console.log(`Using test file at: ${testPath}`);
        
        // Run K6 test - wrap path in quotes to handle spaces
        const k6Command = `k6 run "${testPath}"`;
        console.log(`Running K6 command: ${k6Command}`);
        
        const { stdout, stderr } = await execAsync(k6Command, {
            env: { 
                ...process.env,
                ENV: env,
                // Add any other required environment variables here
            },
            cwd: path.resolve(__dirname, '../..')
        });
        
        return res.json({
            success: true,
            output: stdout || stderr,
            status: 'completed'
        });
    } catch (error) {
        console.error('Error running K6 test:', error);
        return res.status(500).json({
            success: false,
            output: error.message,
            status: 'error',
            details: error.stderr || ''
        });
    }
});

export default router;
