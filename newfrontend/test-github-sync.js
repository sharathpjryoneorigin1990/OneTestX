// Test script for GitHub sync functionality
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisify fs functions
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Helper function to get the project root directory
function getProjectRoot() {
  // Start with the current working directory
  let dir = process.cwd();
  
  // If we're in the newfrontend directory, go up one level
  if (dir.includes('newfrontend')) {
    dir = dir.split('newfrontend')[0];
  }
  
  return dir;
}

async function testFileSystem() {
  try {
    console.log('Starting file system test...');
    
    // Get the project root directory
    const projectRoot = getProjectRoot();
    console.log('Project root:', projectRoot);
    
    // Test directories
    const testDirs = [
      path.join(projectRoot, 'backend', 'tests', 'ui', 'smoke'),
      path.join(projectRoot, 'backend', 'tests', 'ui', 'e2e')
    ];
    
    // Create test directories if they don't exist
    for (const dir of testDirs) {
      console.log(`Creating/verifying directory: ${dir}`);
      await mkdir(dir, { recursive: true });
      console.log(`Directory exists: ${dir}`);
    }
    
    // Create test files
    const testFiles = [
      {
        path: path.join(testDirs[0], 'test-smoke.js'),
        content: '// Test smoke file\nconsole.log("This is a smoke test");'
      },
      {
        path: path.join(testDirs[1], 'test-e2e.js'),
        content: '// Test e2e file\nconsole.log("This is an e2e test");'
      }
    ];
    
    // Write test files
    for (const file of testFiles) {
      console.log(`Writing file: ${file.path}`);
      await writeFile(file.path, file.content, 'utf8');
      console.log(`File written successfully: ${file.path}`);
    }
    
    // Verify files exist
    for (const file of testFiles) {
      const fileStats = await stat(file.path);
      console.log(`File verified: ${file.path}, size: ${fileStats.size} bytes`);
    }
    
    // List directory contents
    for (const dir of testDirs) {
      const files = await readdir(dir);
      console.log(`Directory ${dir} contains: ${files.join(', ')}`);
    }
    
    return {
      success: true,
      message: 'File system test completed successfully',
      testDirs,
      testFiles: testFiles.map(f => f.path)
    };
  } catch (error) {
    console.error('File system test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    };
  }
}

// Execute the test
testFileSystem().then(result => {
  console.log('Test result:', JSON.stringify(result, null, 2));
});
