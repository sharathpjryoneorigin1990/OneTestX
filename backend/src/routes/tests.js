import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

console.log('Test routes module loaded');

// List all available tests across all test directories
router.get('/', (req, res) => {
  console.log('\n=== Test Listing Request ===');
  console.log('Received request to list tests');
  
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
          const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          
          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            console.log(`Entering subdirectory: ${fullPath}`);
            scanForTests(fullPath, relPath);
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
              const testId = relPath.replace(/[\\/]/g, '-').replace(/\.(js|ts)$/, '');
              const testType = getTestType(entry.name, relativePath);
              const category = relativePath.split('/')[0] || 'other';
              
              allTestFiles.push({
                id: testId,
                name: entry.name.replace(/\.(js|ts)$/, '').replace(/-/g, ' '),
                path: `tests/${relPath.replace(/\\/g, '/')}`,
                type: testType,
                category: category,
                fullPath: fullPath,
                size: fs.statSync(fullPath).size,
                modified: fs.statSync(fullPath).mtime
              });
            } else {
              console.log(`Skipping non-test file: ${fullPath}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error.message);
      }
    };
    
    // Function to determine test type based on filename and path
    const getTestType = (filename, filePath) => {
      const lowerName = filename.toLowerCase();
      const lowerPath = filePath.toLowerCase();
      
      // Check for visual tests first
      if (lowerName.includes('visual') || lowerPath.includes('visual')) return 'visual';
      
      // Check for accessibility tests
      if (lowerName.includes('accessibility') || lowerName.includes('a11y') || 
          lowerPath.includes('accessibility') || lowerPath.includes('a11y')) {
        return 'accessibility';
      }
      
      // Check for other test types
      if (lowerName.includes('smoke') || lowerPath.includes('smoke')) return 'smoke';
      if (lowerName.includes('e2e') || lowerPath.includes('e2e') || 
          lowerName.includes('end-to-end') || lowerPath.includes('end-to-end')) {
        return 'e2e';
      }
      if (lowerName.includes('unit') || lowerPath.includes('unit')) return 'unit';
      if (lowerName.includes('integration') || lowerPath.includes('integration')) return 'integration';
      if (lowerName.includes('performance') || lowerPath.includes('performance')) return 'performance';
      if (lowerName.includes('security') || lowerPath.includes('security')) return 'security';
      
      // Default to the parent directory name if it matches a test type
      const parentDir = filePath.split('/')[0].toLowerCase();
      const validTypes = ['smoke', 'e2e', 'visual', 'accessibility', 'unit', 'integration', 'performance', 'security'];
      if (validTypes.includes(parentDir)) {
        return parentDir;
      }
      
      return 'other';
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
    
    // Group tests by category
    const testsByCategory = allTestFiles.reduce((acc, test) => {
      if (!acc[test.category]) {
        acc[test.category] = [];
      }
      acc[test.category].push(test);
      return acc;
    }, {});
    
    const response = {
      success: true,
      tests: allTestFiles,
      testsByCategory,
      totalTests: allTestFiles.length,
      categories: Object.keys(testsByCategory),
      scanInfo: {
        scanDir: testsDir,
        timestamp: new Date().toISOString(),
        cwd: process.cwd(),
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    };
    
    if (allTestFiles.length === 0) {
      response.warning = 'No test files found';
      response.help = 'Check that test files exist in the expected location and match the required naming patterns';
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

export default router;
