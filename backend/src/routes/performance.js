import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// List available performance tests
router.get('/tests', (req, res) => {
  const performanceDir = path.join(__dirname, '../../tests/performance');
  
  console.log(`Looking for performance tests in: ${performanceDir}`);
  
  // Ensure performance directory exists
  if (!fs.existsSync(performanceDir)) {
    const errorMsg = `Performance test directory not found at: ${performanceDir}`;
    console.error(errorMsg);
    return res.status(404).json({ 
      error: 'Performance test directory not found',
      details: errorMsg,
      currentDir: __dirname
    });
  }
  
  try {
    let allTestFiles = [];
    
    // Function to scan a directory for test files
    const scanForTests = (dir, relativePath = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          scanForTests(fullPath, relPath);
        } else if (entry.isFile() && 
                  (entry.name.endsWith('.test.js') || 
                   entry.name.endsWith('.spec.js') ||
                   (entry.name.endsWith('.js') && !entry.name.includes('config')))) {
          // This is a test file
          const testId = relPath.replace(/[\\/]/g, '-').replace(/\.js$/, '');
          const testType = entry.name.includes('load') ? 'load' : 
                          entry.name.includes('stress') ? 'stress' :
                          entry.name.includes('smoke') ? 'smoke' : 'other';
          
          allTestFiles.push({
            id: testId,
            name: entry.name.replace(/\.js$/, '').replace(/-/g, ' '),
            path: `tests/performance/${relPath.replace(/\\/g, '/')}`,
            type: testType,
            category: 'performance'
          });
        }
      }
    };
    
    // Start scanning from the performance directory
    scanForTests(performanceDir);
    
    res.json({ tests: allTestFiles });
    
  } catch (error) {
    console.error('Error reading performance test directories:', error);
    res.status(500).json({ error: 'Failed to read performance test directories' });
  }
});

// Run a specific test
router.post('/run-test', async (req, res) => {
  const { testId } = req.body;
  
  if (!testId) {
    return res.status(400).json({ error: 'Test ID is required' });
  }
  
  // Extract test type and name from the testId
  const [testType, ...testNameParts] = testId.split('-');
  const testName = testNameParts.join('-');
  
  // Log the components being used to build the path
  console.log('Test components:', { testId, testType, testName });
  
  // Build the test path and normalize it
  const testPath = path.resolve(__dirname, `../../tests/performance/${testType}/${testName}.js`);
  const outputFile = path.resolve(__dirname, `../../test-results-${testId}-${Date.now()}.json`);
  
  console.log('Resolved test path:', testPath);
  console.log('Resolved output file:', outputFile);
  
  // Check if test file exists
  let fileExists;
  try {
    await fs.access(testPath);
    fileExists = true;
  } catch (err) {
    fileExists = false;
  }
  
  if (!fileExists) {
    return res.status(404).json({ 
      error: 'Test not found',
      details: `Test file not found at: ${testPath}`
    });
  }
  
  // Check if this is a Playwright test
  const isPlaywrightTest = testPath.endsWith('.test.js') || testPath.endsWith('.spec.js');
  
  let command, isPlaywright = false;
  
  if (isPlaywrightTest) {
    // For Playwright tests
    isPlaywright = true;
    command = `npx playwright test ${testPath} --reporter=json`;
    console.log(`Executing Playwright test: ${command}`);
  } else {
    // For k6 tests
    command = `npx k6 run ${testPath} --out json=${outputFile}`;
    console.log(`Executing k6 test: ${command}`);
  }
  
  try {
    // Execute the test and wait for it to complete
    const { stdout, stderr } = await new Promise((resolve, reject) => {
      exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          return reject({ error, stdout, stderr });
        }
        resolve({ stdout, stdout, stderr });
      });
    });
    
    // Process results based on test type
    try {
      let results;
      
      if (isPlaywright) {
        // For Playwright, the results are in the stdout as JSON
        try {
          results = JSON.parse(stdout);
        } catch (e) {
          console.error('Failed to parse Playwright results:', e);
          results = { error: 'Failed to parse test results', rawOutput: stdout };
        }
      } else {
        // For k6, read from the output file
        results = JSON.parse(await fs.readFile(outputFile, 'utf8'));
        // Clean up the results file for k6 tests
        await fs.unlink(outputFile);
      }
      
      res.json({
        success: true,
        testType: isPlaywright ? 'playwright' : 'k6',
        results,
        stdout,
        stderr
      });
    } catch (parseError) {
      console.error('Error parsing test results:', parseError);
      return res.status(500).json({
        error: 'Failed to parse test results',
        details: parseError.message,
        stdout,
        stderr,
        testPath
      });
    }
  } catch (execError) {
    console.error(`Error executing test: ${execError.error?.message || 'Unknown error'}`);
    console.error(`STDERR: ${execError.stderr}`);
    return res.status(500).json({ 
      error: 'Failed to execute test',
      details: execError.error?.message || 'Unknown error',
      stderr: execError.stderr,
      stdout: execError.stdout,
      testPath,
      command: k6Command
    });
  }
});

export default router;
