import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the tests directory (relative to the project root)
const TESTS_DIR = path.join(process.cwd(), '..', '..', 'backend', 'tests');

// Debug function to log directory contents
async function logDirectoryContents() {
  try {
    console.log('Initializing tests API route...');
    console.log('Current working directory:', process.cwd());
    console.log('Looking for tests in:', TESTS_DIR);
    
    const dirContents = await fs.readdir(path.join(process.cwd(), '..'));
    console.log('Parent directory contents:', dirContents);
    
    const backendContents = await fs.readdir(path.join(process.cwd(), '..', 'backend'));
    console.log('Backend directory contents:', backendContents);
    
    const testsDirExists = await fs.access(TESTS_DIR).then(() => true).catch(() => false);
    console.log('Tests directory exists:', testsDirExists);
    
    if (testsDirExists) {
      const testFiles = await fs.readdir(TESTS_DIR);
      console.log('Test files found:', testFiles);
    }
  } catch (err) {
    console.error('Error checking directories:', err);
  }
}

// Log directory contents when the module loads
logDirectoryContents().catch(console.error);

// Helper function to recursively get all files in a directory
async function getAllFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Map of test file paths to their categories and tags
const TEST_CATEGORIES = {
  'performance/stress': ['performance', 'stress'],
  'ui/accessibility': ['ui', 'accessibility', 'a11y'],
  'ui/e2e': ['ui', 'e2e', 'end-to-end'],
  'ui/visual': ['ui', 'visual', 'screenshot', 'ai', 'smart'],
  'ui/smoke': ['ui', 'smoke', 'ai', 'smart']
};

async function getTestFiles(dir: string, baseDir = ''): Promise<any[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let testFiles: any[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await getTestFiles(fullPath, relativePath);
      testFiles = testFiles.concat(subFiles);
    } else if (entry.name.endsWith('.test.js') || entry.name.endsWith('.test.ts')) {
      // Get the relative path without the tests directory
      const testPath = path.relative(TESTS_DIR, fullPath).replace(/\\/g, '/');
      
      // Determine category and tags based on file path
      const category = Object.keys(TEST_CATEGORIES).find(cat => testPath.startsWith(cat)) || 'other';
      const tags = TEST_CATEGORIES[category as keyof typeof TEST_CATEGORIES] || [];
      
      // Read the test file to get test cases
      const content = await fs.readFile(fullPath, 'utf-8');
      const testCases = extractTestCases(content);
      
      testFiles.push({
        id: `test-${testPath.replace(/[\\/.:]/g, '-')}`,
        name: entry.name.replace(/\.test\.(js|ts)$/, '').replace(/[-_]/g, ' '),
        path: testPath,
        category,
        tags,
        testCases,
        lastRun: {
          status: 'pending',
          timestamp: new Date().toISOString(),
        }
      });
    }
  }

  return testFiles;
}

function extractTestCases(content: string): Array<{name: string, group: string | null, line: number}> {
  // Simple regex to find test cases in the file
  // This is a basic implementation and might need adjustments based on your test structure
  const testRegex = /(it|test)\(['"]([^'"]+)['"],/g;
  const describeRegex = /describe\(['"]([^'"]+)['"],/g;
  
  const testCases: Array<{name: string, group: string | null, line: number}> = [];
  let match;
  
  // Find all test cases
  while ((match = testRegex.exec(content)) !== null) {
    const lineNumber = (content.substring(0, match.index).match(/\n/g) || []).length + 1;
    testCases.push({
      name: match[2],
      group: null,
      line: lineNumber
    });
  }
  
  // If no test cases found, add a default one
  if (testCases.length === 0) {
    testCases.push({
      name: 'Default test case',
      group: null,
      line: 1
    });
  }
  
  return testCases;
}

export async function GET() {
  try {
    console.log(`[GET] Reading tests from: ${TESTS_DIR}`);
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    
    // Try multiple possible locations for the tests directory
    const possibleTestDirs = [
      TESTS_DIR,
      path.join(process.cwd(), 'backend', 'tests'),
      path.join(process.cwd(), '..', 'backend', 'tests'),
      path.join(process.cwd(), 'tests'),
      path.join(__dirname, '..', '..', '..', '..', 'tests'),
      path.join(process.cwd(), '..', '..', 'backend', 'tests')
    ];
    
    let foundTestsDir = null;
    
    // Find the first existing tests directory
    for (const testDir of possibleTestDirs) {
      try {
        console.log(`Checking for tests in: ${testDir}`);
        await fs.access(testDir);
        // List directory contents for debugging
        try {
          const contents = await fs.readdir(testDir);
          console.log(`Directory contents of ${testDir}:`, contents);
        } catch (e) {
          console.log(`Could not read directory ${testDir}:`, e);
        }
        foundTestsDir = testDir;
        console.log(`Found tests directory at: ${testDir}`);
        break;
      } catch (err) {
        console.log(`Directory not found: ${testDir}`, err);
      }
    }
    
    if (!foundTestsDir) {
      const errorMsg = `Tests directory not found. Checked: ${possibleTestDirs.join('\n')}`;
      console.error(errorMsg);
      return NextResponse.json(
        { 
          error: 'Tests directory not found',
          details: errorMsg,
          currentWorkingDir: process.cwd(),
          possibleLocations: possibleTestDirs,
          __dirname: __dirname,
          filesInRoot: await fs.readdir(process.cwd()).catch(e => e.toString())
        },
        { status: 404 }
      );
    }
    
    console.log(`Using tests directory: ${foundTestsDir}`);
    const testFiles = await getTestFiles(foundTestsDir);
    console.log(`Found ${testFiles.length} test files`);
    
    if (testFiles.length === 0) {
      console.warn('No test files found in:', foundTestsDir);
      console.log('Attempting to list all files in directory...');
      try {
        const allFiles = await getAllFiles(foundTestsDir);
        console.log('All files in directory:', allFiles);
      } catch (e) {
        console.error('Error listing files:', e);
      }
    }
    
    return NextResponse.json({ 
      tests: testFiles,
      _meta: {
        source: foundTestsDir,
        count: testFiles.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error reading test files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to read test files', 
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
