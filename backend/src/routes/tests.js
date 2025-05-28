import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import getPort from 'get-port';
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Enable CORS for all test routes
router.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
router.options('*', cors());

// Run a specific test
router.post('/run', async (req, res) => {
  try {
    const { testPath, env = 'development' } = req.body;
    
    if (!testPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'Test path is required' 
      });
    }

    console.log(`===== Test Execution Requested =====`);
    console.log(`Test Path: ${testPath}`);
    console.log(`Environment: ${env}`);
    
    // Execute the test using the runTests function
    const result = await runTests([testPath], env);
    
    console.log('Test execution completed:', result.success ? 'SUCCESS' : 'FAILED');
    
    // Return the result with appropriate status code
    if (result.success) {
      res.json({
        success: true,
        output: result.stdout,
        message: 'Test executed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Test execution failed',
        output: result.stdout,
        errorOutput: result.stderr
      });
    }
    
  } catch (error) {
    console.error('Error running test:', error);
    
    const errorResponse = {
      success: false,
      error: error.error || error.message || 'Failed to run test',
      ...(error.stdout && { output: error.stdout }),
      ...(error.stderr && { errorOutput: error.stderr })
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  }
});

console.log('Test routes module loaded');

// Function to determine test runner based on file extension and path
const getTestRunner = (testPath) => {
  const lowerPath = testPath.toLowerCase();
  
  // Check for k6 tests
  if (lowerPath.endsWith('.js') && testPath.includes('k6')) {
    return 'k6';
  }
  
  // Check for Playwright tests
  if (lowerPath.endsWith('.spec.js') || lowerPath.endsWith('.test.js')) {
    if (testPath.includes('playwright') || testPath.includes('e2e')) {
      return 'playwright';
    }
  }
  
  // Default to Jest for other JavaScript tests
  if (lowerPath.endsWith('.js') || lowerPath.endsWith('.jsx') || 
      lowerPath.endsWith('.ts') || lowerPath.endsWith('.tsx')) {
    return 'jest';
  }
  
  // Default to Jest if we can't determine the runner
  return 'jest';
};

// Function to run tests with Playwright
const runTests = async (testPaths, env = 'development') => {
  // Get the absolute path to the project root (backend directory)
  const projectRoot = path.resolve(__dirname, '../..');
  console.log('Project root:', projectRoot);
  
  // Ensure test results directory exists
  const resultsDir = path.join(projectRoot, 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Find an available port dynamically
  const port = await getPort({ port: 9323 }); // Start checking from port 9323 (Playwright's default)
  
  return new Promise((resolve, reject) => {
    // Normalize test paths
    const normalizedPaths = testPaths.map(p => {
      // Remove any leading ./ or ../
      const cleanPath = p.replace(/^[.\\/]+/, '');
      // If the path already starts with tests/ or ui/, use it as is
      if (cleanPath.startsWith('tests/') || cleanPath.startsWith('ui/')) {
        return cleanPath;
      }
      // Otherwise, prepend tests/
      return `tests/${cleanPath}`;
    });
    
    // Build the command to run the tests
    const testList = normalizedPaths.join(' ');
    const cmd = `npx playwright test ${testList} --workers=1 --timeout=60000 --reporter=list,json --output=test-results && npx playwright show-report --port ${port} || true`;

    console.log('Project root:', projectRoot);
    console.log('Resolved test paths:', normalizedPaths);
    console.log(`Running tests: ${cmd}`);
    console.log(`Environment: ${env}`);
    
    // Set up environment variables
    const envVars = {
      ...process.env,
      NODE_ENV: 'test',
      PLAYWRIGHT_ENV: env,
      PLAYWRIGHT_TEST_BASE_URL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000',
      // Ensure npm and npx are in the PATH
      PATH: process.env.PATH
    };
    
    // Ensure test results directory exists
    const resultsDir = path.join(projectRoot, 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Execute the command from the project root
    console.log(`Executing from directory: ${projectRoot}`);
    
    // Create a variable to store test status
    let testOutput = '';
    let testError = '';
    
    const testProcess = exec(cmd, { 
      env: envVars,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      cwd: projectRoot,  // Run from project root
      shell: true        // Use shell to ensure PATH is resolved correctly
    });
    
    // Collect stdout and stderr
    testProcess.stdout?.on('data', (data) => {
      testOutput += data.toString();
    });
    
    testProcess.stderr?.on('data', (data) => {
      testError += data.toString();
    });
    
    testProcess.on('close', (code) => {
      const now = new Date().toISOString();
      console.log(`Test run completed at ${now} with code ${code}`);
      
      if (code !== 0) {
        console.error('Test run error:', testError || 'Non-zero exit code');
        return reject({
          success: false,
          error: testError || 'Test failed with non-zero exit code',
          stdout: testOutput,
          stderr: testError,
          status: 'failed',
          timestamp: now
        });
      }
      
      // Parse test results if available
      let testResults = [];
      try {
        const resultsPath = path.join(projectRoot, 'test-results', 'test-results.json');
        if (fs.existsSync(resultsPath)) {
          const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          testResults = resultsData.suites.flatMap(suite => 
            suite.specs.map(spec => ({
              title: spec.title,
              status: spec.tests[0]?.results[0]?.status || 'unknown',
              duration: spec.tests[0]?.results[0]?.duration || 0,
              error: spec.tests[0]?.results[0]?.error?.message || null
            }))
          );
        }
      } catch (err) {
        console.error('Error parsing test results:', err);
      }

      const result = {
        success: true,
        status: 'completed',
        timestamp: now,
        port: port, // Include the dynamic port in the response
        testCount: testResults.length,
        passed: testResults.filter(t => t.status === 'passed').length,
        failed: testResults.filter(t => t.status === 'failed').length,
        skipped: testResults.filter(t => t.status === 'skipped').length,
        results: testResults,
        output: testOutput.split('\n').filter(line => line.trim()),
        error: testError,
        reportUrl: `http://localhost:${port}` // Include the full report URL
      };
      
      console.log(`Test report available at: ${result.reportUrl}`);
      resolve(result);
    });
    
    testProcess.on('error', (error) => {
      console.error('Test process error:', error);
      reject({
        success: false,
        error: error.message,
        stdout: testOutput,
        stderr: testError,
        status: 'error',
        timestamp: new Date().toISOString()
      });
    });
  });
};

// Wrapper function to maintain backward compatibility
const runTest = (testPath, env = 'development') => {
  return runTests([testPath], env);
};

// List all available tests across all test directories
router.get('/', (req, res) => {
  console.log('\n=== Test Listing Request ===');
  console.log('Received request to list tests');
  
  // Get query parameters for filtering
  const { category, type } = req.query;
  console.log('Query parameters:', { category, type });
  
  // Try multiple possible test directory locations
  const possibleTestDirs = [
    path.join(process.cwd(), 'tests'),  // Current directory (backend/tests)
    path.join(process.cwd(), '../tests'), // Parent directory (tests in root)
    path.join(__dirname, '../../tests'),  // Relative to this file
    path.join(process.cwd(), 'backend/tests') // Explicit backend/tests path
  ];
  
  let testsDir = null;
  for (const dir of possibleTestDirs) {
    if (fs.existsSync(dir)) {
      testsDir = dir;
      break;
    }
  }
  
  console.log('Using tests directory:', testsDir);
  console.log('Current working directory:', process.cwd());
  
  if (!testsDir) {
    const errorMsg = `Tests directory not found in any of: ${possibleTestDirs.join('\n- ')}`;
    console.error('\n' + '='.repeat(80));
    console.error('ERROR: Tests directory not found!');
    console.error('='.repeat(80));
    console.error('Searched in:');
    possibleTestDirs.forEach(dir => {
      const exists = fs.existsSync(dir) ? 'EXISTS' : 'NOT FOUND';
      console.error(`- ${dir} (${exists})`);
    });
    
    console.error('\nCurrent working directory:', process.cwd());
    console.error('Current directory contents:');
    try {
      console.error(fs.readdirSync(process.cwd()));
    } catch (e) {
      console.error('Could not read directory:', e.message);
    }
    
    console.error('\n__dirname:', __dirname);
    console.error('__filename:', __filename);
    
    return res.status(404).json({ 
      success: false,
      error: 'Tests directory not found',
      details: errorMsg,
      currentDir: __dirname,
      cwd: process.cwd(),
      possibleDirs: possibleTestDirs,
      dirContents: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : 'Directory does not exist',
      nodeVersion: process.version,
      platform: process.platform,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        TEST_ENV: process.env.TEST_ENV,
        PATH: process.env.PATH
      }
    });
  }
  
  try {
    let allTestFiles = [];
    
    console.log(`\n=== Scanning for test files in: ${testsDir} ===`);
    
    // Function to scan a directory for test files
    const scanForTests = (dir, relativePath = '') => {
      try {
        console.log(`\nScanning directory: ${dir}`);
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        console.log(`Found ${entries.length} entries in ${dir}`);
        
        for (const entry of entries) {
          // Skip node_modules and other non-test directories
          if (['node_modules', '.git', 'coverage', '__snapshots__', '.next', '.vscode'].includes(entry.name)) {
            console.log(`Skipping directory: ${entry.name}`);
            continue;
          }
          
          const fullPath = path.join(dir, entry.name);
          // Normalize path separators to forward slashes for consistent handling
          const normalizedRelPath = relativePath 
            ? `${relativePath}${path.sep}${entry.name}`.replace(/\\/g, '/')
            : entry.name;
          
          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            console.log(`Entering subdirectory: ${fullPath}`);
            scanForTests(fullPath, normalizedRelPath);
          } else {
            const isTestFile = (
              entry.name.endsWith('.test.js') || 
              entry.name.endsWith('.spec.js') ||
              entry.name.endsWith('.test.ts') ||
              entry.name.endsWith('.spec.ts') ||
              (entry.name.endsWith('.js') && 
               !entry.name.includes('config') &&
               !entry.name.endsWith('.d.ts') &&
               (entry.name.includes('.test.') || entry.name.includes('.spec.')))
            );
            
            if (isTestFile) {
              console.log(`Found test file: ${fullPath}`);
              const testId = normalizedRelPath.replace(/[\\/]/g, '-').replace(/\.(js|ts)$/, '');
              const testType = getTestType(entry.name, normalizedRelPath);
              // Get the first directory as category
              const category = normalizedRelPath.split('/')[0]?.toLowerCase() || 'other';
              
              allTestFiles.push({
                id: testId,
                name: entry.name.replace(/\.(js|ts)$/, '').replace(/-/g, ' '),
                path: `tests/${normalizedRelPath}`,
                type: testType,
                category: category,
                fullPath: fullPath,
                size: fs.statSync(fullPath).size,
                modified: fs.statSync(fullPath).mtime
              });
              
              console.log(`Added test file: ${normalizedRelPath} (type: ${testType}, category: ${category})`);
            } else {
              console.log(`Skipping non-test file: ${fullPath}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
      }
    };
    
    // Function to determine test type based on directory structure
    const getTestType = (filename, filePath) => {
      // Convert to lowercase for case-insensitive comparison
      const lowerPath = filePath.toLowerCase().replace(/\\/g, '/');
      const lowerName = filename.toLowerCase();
      
      // Define test type patterns with priority order
      const typePatterns = [
        { type: 'smoke', patterns: ['smoke', 'smoketest', 'smoke-test'] },
        { type: 'e2e', patterns: ['e2e', 'endtoend', 'end-to-end', 'flow'] },
        { type: 'visual', patterns: ['visual', 'screenshot'] },
        { type: 'accessibility', patterns: ['accessibility', 'a11y'] },
        { type: 'unit', patterns: ['unit', 'unittest', 'unit-test'] },
        { type: 'integration', patterns: ['integration', 'integ', 'integtest', 'integ-test'] },
        { type: 'performance', patterns: ['performance', 'perf', 'load', 'stress'] },
        { type: 'security', patterns: ['security', 'sec', 'sast', 'dast'] }
      ];
      
      // Check each directory in the path (from specific to general)
      const pathParts = lowerPath.split('/');
      
      // First, check the immediate parent directory
      if (pathParts.length > 1) {
        const parentDir = pathParts[pathParts.length - 2]; // Get parent directory
        for (const { type, patterns } of typePatterns) {
          if (patterns.some(pattern => parentDir.includes(pattern))) {
            return type;
          }
        }
      }
      
      // Then check all directories in the path
      for (const part of pathParts) {
        for (const { type, patterns } of typePatterns) {
          if (patterns.some(pattern => part.includes(pattern))) {
            return type;
          }
        }
      }
      
      // Finally, check the filename
      for (const { type, patterns } of typePatterns) {
        if (patterns.some(pattern => lowerName.includes(pattern))) {
          return type;
        }
      }
      
      // Default to 'e2e' for any test file we can't categorize
      return 'e2e';
    };
    
    // Start scanning from the tests directory and all its subdirectories
    scanForTests(testsDir);
    
    console.log('\n=== Test Discovery Summary ===');
    console.log(`Total test files found: ${allTestFiles.length}`);
    
    // Log all found test files for debugging
    if (allTestFiles.length > 0) {
      console.log('\nDiscovered test files:');
      allTestFiles.forEach((test, index) => {
        console.log(`${index + 1}. ${test.path} (${test.type})`);
      });
    } else {
      console.log('\nNo test files found. Check the following:');
      console.log(`1. Test files should be in: ${testsDir}`);
      console.log('2. Files should match patterns: *.test.js, *.spec.js, *.test.ts, *.spec.ts');
      console.log('3. Check server logs for any scanning errors');
    }
    
    // Filter tests by category and type query parameters
    const filteredTests = allTestFiles.filter(test => {
      // Normalize the test category and type for comparison
      const testCategory = test.category ? test.category.toLowerCase() : '';
      const testType = test.type ? test.type.toLowerCase() : '';
      const queryCategory = category ? category.toLowerCase() : '';
      const queryType = type ? type.toLowerCase().replace(/\s+/g, '') : '';
      
      // Log filtering for debugging
      console.log(`Filtering test: ${test.path}`);
      console.log(`- Test category: '${testCategory}', type: '${testType}'`);
      console.log(`- Query category: '${queryCategory}', type: '${queryType}'`);
      
      const categoryMatch = !queryCategory || testCategory === queryCategory;
      const typeMatch = !queryType || testType === queryType;
      
      console.log(`- Matches: category=${categoryMatch}, type=${typeMatch}\n`);
      
      return categoryMatch && typeMatch;
    });
    
    // Group filtered tests by category
    const testsByCategory = filteredTests.reduce((acc, test) => {
      if (!acc[test.category]) {
        acc[test.category] = [];
      }
      acc[test.category].push(test);
      return acc;
    }, {});
    
    const response = {
      success: true,
      count: filteredTests.length,
      tests: filteredTests,
      testsByCategory: testsByCategory,
      testsDir: testsDir,
      filters: {
        category: category || 'all',
        type: type || 'all'
      }
    };
    
    if (filteredTests.length === 0) {
      response.warning = 'No test files found';
      response.help = 'Check that test files exist in the expected location and match the required naming patterns';
      
      // If we have a category filter but no tests, check if the category exists
      if (category) {
        const allCategories = [...new Set(allTestFiles.map(t => t.category))];
        if (!allCategories.some(c => c.toLowerCase() === category.toLowerCase())) {
          response.help += `\nCategory '${category}' not found. Available categories: ${allCategories.join(', ')}`;
        }
      }
      
      // If we have a type filter but no tests, check if the type exists
      if (type) {
        const allTypes = [...new Set(allTestFiles.map(t => t.type))];
        if (!allTypes.some(t => t.toLowerCase() === type.toLowerCase().replace(/\s+/g, ''))) {
          response.help += `\nTest type '${type}' not found. Available types: ${allTypes.join(', ')}`;
        }
      }
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error scanning for tests:', error);
    res.status(500).json({ 
      error: 'Failed to scan for tests',
      details: error.message 
    });
  }
});

// Run a specific test file
router.post('/run', async (req, res) => {
  console.log('Received test run request:', req.body);
  
  const { testPath, env = 'qa' } = req.body;
  
  if (!testPath) {
    const errorMsg = 'Test path is required';
    console.error(errorMsg);
    return res.status(400).json({ 
      success: false, 
      error: errorMsg,
      requestBody: req.body
    });
  }
  
  console.log(`Running test: ${testPath} in environment: ${env}`);
  console.log('Current working directory:', process.cwd());
  console.log('Looking for test file:', testPath);
  
  // Log environment variables
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    TEST_ENV: process.env.TEST_ENV,
    BASE_URL: process.env.BASE_URL,
    PATH: process.env.PATH
  });
  
  // Set up environment variables
  const envVars = {
    ...process.env,
    TEST_ENV: env,
    NODE_ENV: 'test',
    BASE_URL: process.env.BASE_URL || `https://${env}.example.com`
  };
  
  console.log('Environment variables for test:', envVars);

  // Simple path resolution function with logging
  const resolveTestPath = (testPath) => {
    console.log('\n=== Starting path resolution ===');
    console.log('Input path:', testPath);
    
    // Normalize path separators and clean up the path
    const normalizePath = (p) => p ? p.replace(/\\/g, '/').replace(/^[\/.]*\//, '') : p;
    const normalizedInput = normalizePath(testPath);
    
    // Try to resolve against the tests directory directly
    const testsDir = path.resolve(process.cwd(), '..', 'tests');
    const fullPath = path.join(testsDir, normalizedInput);
    
    console.log('Looking for test file at:', fullPath);
    
    if (fs.existsSync(fullPath)) {
      console.log('✅ Found test file at:', fullPath);
      return fullPath;
    }
    
    // If not found, try other possible locations
    const possiblePaths = [
      path.resolve(process.cwd(), normalizedInput),
      path.resolve(process.cwd(), '..', 'tests', normalizedInput),
      path.resolve(process.cwd(), '..', normalizedInput)
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log('✅ Found test file at:', possiblePath);
        return possiblePath;
      }
      console.log('❌ Not found:', possiblePath);
    }
    
    console.log('❌ Could not find test file at any location');
    return null;
  };
  
  // Normalize path separators and clean up the test path
  const normalizePath = (p) => p ? p.replace(/\\/g, '/') : p;
  
  // Normalize the test path by removing any leading 'tests/' or './tests/'
  const cleanedTestPath = testPath
    .replace(/^tests[\\\/]/, '')
    .replace(/^\.[\\\/]tests[\\\/]/, '')
    .replace(/^[\\\/]/, '');
  
  // Get the project root and tests directory
  const projectRoot = path.resolve(__dirname, '../..');
  const testsDir = path.join(projectRoot, 'tests');
  
  console.log('\n=== Test File Resolution ===');
  console.log('Input path:', testPath);
  console.log('Cleaned path:', cleanedTestPath);
  console.log('Project root:', projectRoot);
  console.log('Tests directory:', testsDir);
  
  // Define possible paths to check
  const possiblePaths = [
    path.resolve(testPath), // Absolute path as provided
    path.join(projectRoot, cleanedTestPath), // Relative to project root
    path.join(testsDir, cleanedTestPath), // Relative to tests directory
    path.join(testsDir, path.basename(cleanedTestPath)) // Just the filename in tests directory
  ];
  
  // Remove duplicates
  const uniquePaths = [...new Set(possiblePaths)];
  
  // Log all paths being checked
  console.log('\nChecking paths:');
  uniquePaths.forEach((p, i) => {
    const exists = fs.existsSync(p);
    console.log(`  ${i + 1}. ${exists ? '✅' : '❌'} ${p}`);
  });
  
  // Find the first path that exists
  const testFilePath = uniquePaths.find(p => fs.existsSync(p));
  
  if (!testFilePath) {
    console.error('\nError: Test file not found in any of the checked locations');
    return res.status(404).json({
      success: false,
      error: `Test file not found: ${testPath}`,
      searchedLocations: uniquePaths
    });
  }
  
  console.log('\n✅ Found test file:', testFilePath);

  return new Promise((resolve) => {
    const output = [];
    const errors = [];
    let testResults = null;

    // Set environment variables for the test
    const envVars = {
      ...process.env,
      TEST_ENV: env || 'qa',
      NODE_ENV: 'test',
      // Add any other environment variables needed for tests
    };

    try {
    // Get the project root (one level up from src directory)
    const projectRoot = path.resolve(process.cwd(), '..');
    console.log('Project root:', projectRoot);
    console.log('Running test file:', testFilePath);
    
    // Calculate relative path from project root
    const relativeTestPath = path.relative(projectRoot, testFilePath);
    console.log('Relative test path:', relativeTestPath);

    // Create a temporary test file with the test content
    const tempTestDir = path.join(projectRoot, 'temp-tests');
    if (!fs.existsSync(tempTestDir)) {
      fs.mkdirSync(tempTestDir, { recursive: true });
    }
    
    const tempTestFile = path.join(tempTestDir, 'temp.test.js');
    let testContent = fs.readFileSync(testFilePath, 'utf-8');
    
    // Ensure the test uses the correct import syntax
    testContent = testContent.replace(
      /const\s+\{\s*test\s*,\s*expect\s*\}\s*=\s*require\(['"]@playwright\/test['"]\)/g,
      'import { test, expect } from \'@playwright/test\''
    );
    
    // Write the modified test content to a temporary file
    fs.writeFileSync(tempTestFile, testContent, 'utf-8');
    
    console.log('Executing command:', `npx playwright test ${relativeTestPath} --reporter=json`);
    console.log('Working directory:', projectRoot);
    
    // Run the test using npx playwright test
    const child = spawn(
      'npx',
      [
        'playwright',
        'test',
        relativeTestPath,
        '--reporter=json',
        '--workers=1'  // Run tests serially for better logging
      ],
      {
        cwd: projectRoot,
        env: {
          ...envVars,
          PLAYWRIGHT_JSON_OUTPUT_NAME: 'results.json',
          BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
          NODE_OPTIONS: '--experimental-specifier-resolution=node --loader ts-node/esm',
          TS_NODE_PROJECT: path.join(projectRoot, 'tsconfig.json'),
          TS_NODE_ESM: 'true',
          TS_NODE_COMPILER_OPTIONS: JSON.stringify({
            module: 'esnext',
            moduleResolution: 'node',
            esModuleInterop: true,
            target: 'esnext',
            allowJs: true,
            skipLibCheck: true
          })
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        windowsHide: true
      }
      );
      
      // Clean up the temporary file when done
      const cleanup = () => {
        try {
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
            fs.unlinkSync(tempTestFile);
          }
        } catch (e) {
          console.error('Error cleaning up temporary test file:', e);
        }
      };
      
      child.on('close', cleanup);
      process.on('exit', cleanup);

      child.stdout.on('data', (data) => {
        const message = data.toString();
        output.push(message);
        console.log(`[TEST OUTPUT] ${message}`);
      });

      child.stderr.on('data', (data) => {
        const error = data.toString();
        errors.push(error);
        console.error(`[TEST ERROR] ${error}`);
      });

      child.on('close', (code) => {
        const outputStr = output.join('\n');
        const errorStr = errors.join('\n');
        
        // Try to parse test results from the last line of output
        try {
          const lastLine = outputStr.trim().split('\n').pop() || '[]';
          testResults = JSON.parse(lastLine);
        } catch (e) {
          console.error('Error parsing test results:', e);
        }

        if (code === 0) {
          res.json({
            success: true,
            testPath,
            env,
            results: testResults,
            output: outputStr,
            error: errorStr || null
          });
        } else {
          res.status(500).json({
            success: false,
            testPath,
            env,
            error: `Test failed with exit code ${code}`,
            output: outputStr,
            stderr: errorStr
          });
        }
        resolve();
      });

      // Handle request timeout
      req.on('close', () => {
        if (!res.headersSent) {
          child.kill();
          res.status(500).json({
            success: false,
            testPath,
            env,
            error: 'Test execution was aborted by the client',
            output: output.join('\n'),
            stderr: errors.join('\n')
          });
          resolve();
        }
      });

    } catch (error) {
      console.error('Error running test:', error);
      res.status(500).json({
        success: false,
        testPath,
        env,
        error: error.message,
        output: output.join('\n'),
        stderr: errors.join('\n')
      });
      resolve();
    }
  });
});

// Export the test running functions for direct use
export { runTest, runTests, getTestRunner };

export default router;
