// Test script for GitHub sync functionality
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

async function testFileSystem() {
  try {
    console.log('Starting file system test...');
    
    // Get the project root directory
    const currentDir = process.cwd();
    console.log('Current directory:', currentDir);
    
    const projectRoot = currentDir.split('newfrontend')[0];
    console.log('Project root:', projectRoot);
    
    // Test creating directories
    const testDir = path.join(projectRoot, 'backend', 'tests', 'ui', 'test-sync');
    console.log('Creating test directory:', testDir);
    
    await mkdir(testDir, { recursive: true });
    console.log('Directory created successfully');
    
    // Test writing a file
    const testFilePath = path.join(testDir, 'test-file.js');
    console.log('Writing test file to:', testFilePath);
    
    const testContent = `
// Test file created by GitHub sync test
console.log('This is a test file');
`;
    
    await writeFile(testFilePath, testContent);
    console.log('File written successfully');
    
    return {
      success: true,
      message: 'File system test completed successfully',
      testDir,
      testFilePath
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
  console.log('Test result:', result);
});
