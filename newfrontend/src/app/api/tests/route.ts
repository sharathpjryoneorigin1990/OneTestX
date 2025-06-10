import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// We'll scan the actual backend directory directly

// Define test file types
interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

interface TestFile {
  id: string;
  name: string;
  path: string;
  category: string;
  tags: string[];
  testCases: TestCase[];
  lastRun: {
    status: string;
    timestamp: string;
  };
  isEmpty?: boolean;
}

// Extract test cases from file content
function extractTestCases(content: string): TestCase[] {
  const testCases: TestCase[] = [];
  const testRegex = /test\(['"](.+?)['"]|it\(['"](.+?)['"]|describe\(['"](.+?)['"]|context\(['"](.+?)['"]|suite\(['"](.+?)['"]|spec\(['"](.+?)['"]|it\.only\(['"](.+?)['"]|test\.only\(['"](.+?)['"]|it\.skip\(['"](.+?)['"]|test\.skip\(['"](.+?)['"]|it\s*`(.+?)`|test\s*`(.+?)`/g;
  
  let match;
  while ((match = testRegex.exec(content)) !== null) {
    // Find the first non-undefined capture group
    const testName = match.slice(1).find(group => group !== undefined) || 'Unnamed test';
    testCases.push({
      name: testName,
      group: null,
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return testCases;
}

export async function GET() {
  try {
    console.log('[GET] Scanning actual backend directory for test files');
    
    // Define the exact path to the backend tests directory
    const backendTestsDir = 'H:\\ASU projects\\new cursor\\backend\\tests';
    console.log(`Using tests directory: ${backendTestsDir}`);
    
    // Check if the directory exists
    try {
      await fs.access(backendTestsDir);
      console.log('Backend tests directory exists');
    } catch (error) {
      console.error('Backend tests directory not found:', error);
      return NextResponse.json({ error: 'Tests directory not found' }, { status: 404 });
    }
    
    // Initialize test files array
    const testFiles: TestFile[] = [];
    
    // Process ui/e2e directory
    try {
      const e2eDir = path.join(backendTestsDir, 'ui', 'e2e');
      console.log(`Checking e2e directory: ${e2eDir}`);
      
      const e2eFiles = await fs.readdir(e2eDir);
      console.log(`Found ${e2eFiles.length} files in e2e directory:`, e2eFiles);
      
      // Process each file in the e2e directory
      for (const fileName of e2eFiles) {
        const filePath = path.join(e2eDir, fileName);
        const stats = await fs.stat(filePath);
        
        if (!stats.isDirectory()) {
          console.log(`Processing e2e file: ${fileName}, size: ${stats.size}`);
          
          // Accept any .js or .ts file
          if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
            let testCases = [];
            
            if (stats.size > 0) {
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                testCases = extractTestCases(content);
                console.log(`Extracted ${testCases.length} test cases from ${fileName}`);
              } catch (err) {
                console.error(`Error reading file ${fileName}:`, err);
                testCases = [{ name: 'Error reading file', group: null, line: 1 }];
              }
            } else {
              console.log(`File ${fileName} is empty`);
              testCases = [{ name: 'Empty test file', group: null, line: 1 }];
            }
            
            const testPath = `ui/e2e/${fileName}`;
            
            testFiles.push({
              id: `test-${testPath.replace(/[\/.:]/g, '-')}`,
              name: fileName.replace(/\.(test|spec|flow\.test)\.(js|ts)$/, '').replace(/[-_]/g, ' '),
              path: testPath,
              category: 'ui/e2e',
              tags: ['ui', 'e2e'],
              testCases,
              lastRun: {
                status: 'pending',
                timestamp: new Date().toISOString(),
              },
              isEmpty: stats.size === 0
            });
            
            console.log(`Added e2e test file: ${fileName}`);
          }
        }
      }
    } catch (err) {
      console.error(`Error accessing ui/e2e directory:`, err);
    }
    
    // Process ui/smoke directory
    try {
      const smokeDir = path.join(backendTestsDir, 'ui', 'smoke');
      console.log(`Checking smoke directory: ${smokeDir}`);
      
      const smokeFiles = await fs.readdir(smokeDir);
      console.log(`Found ${smokeFiles.length} files in smoke directory:`, smokeFiles);
      
      // Process each file in the smoke directory
      for (const fileName of smokeFiles) {
        const filePath = path.join(smokeDir, fileName);
        const stats = await fs.stat(filePath);
        
        if (!stats.isDirectory()) {
          console.log(`Processing smoke file: ${fileName}, size: ${stats.size}`);
          
          // Accept any .js or .ts file
          if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
            let testCases = [];
            
            if (stats.size > 0) {
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                testCases = extractTestCases(content);
                console.log(`Extracted ${testCases.length} test cases from ${fileName}`);
              } catch (err) {
                console.error(`Error reading file ${fileName}:`, err);
                testCases = [{ name: 'Error reading file', group: null, line: 1 }];
              }
            } else {
              console.log(`File ${fileName} is empty`);
              testCases = [{ name: 'Empty test file', group: null, line: 1 }];
            }
            
            const testPath = `ui/smoke/${fileName}`;
            
            testFiles.push({
              id: `test-${testPath.replace(/[\/.:]/g, '-')}`,
              name: fileName.replace(/\.(test|spec|flow\.test)\.(js|ts)$/, '').replace(/[-_]/g, ' '),
              path: testPath,
              category: 'ui/smoke',
              tags: ['ui', 'smoke'],
              testCases,
              lastRun: {
                status: 'pending',
                timestamp: new Date().toISOString(),
              },
              isEmpty: stats.size === 0
            });
            
            console.log(`Added smoke test file: ${fileName}`);
          }
        }
      }
    } catch (err) {
      console.error(`Error accessing ui/smoke directory:`, err);
    }

    // Process performance/load directory (for k6 scripts)
    try {
      const performanceDir = path.join(backendTestsDir, 'performance', 'load');
      console.log(`Checking performance directory: ${performanceDir}`);
      
      const performanceFiles = await fs.readdir(performanceDir);
      console.log(`Found ${performanceFiles.length} files in performance directory:`, performanceFiles);
      
      for (const fileName of performanceFiles) {
        const filePath = path.join(performanceDir, fileName);
        const stats = await fs.stat(filePath);
        
        if (!stats.isDirectory() && fileName.endsWith('.js')) { // k6 scripts are .js files
          console.log(`Processing performance script: ${fileName}, size: ${stats.size}`);
          
          const testPath = `performance/load/${fileName}`;
          const testName = fileName.replace(/\.js$/, '').replace(/[-_]/g, ' '); 

          testFiles.push({
            id: `test-${testPath.replace(/[/.:]/g, '-')}`,
            name: testName,
            path: testPath,
            category: 'performance', // Matches the category in client-page.tsx
            tags: ['performance', 'k6', 'load'], // Add relevant tags
            testCases: [{ name: 'Main load test scenario', group: null, line: 1 }], // Placeholder for k6
            lastRun: {
              status: 'pending',
              timestamp: new Date().toISOString(),
            },
            isEmpty: stats.size === 0
          });
          
          console.log(`Added performance test script: ${fileName}`);
        }
      }
    } catch (err) {
      console.error(`Error accessing performance directory:`, err);
    }
    
    console.log(`Total test files found: ${testFiles.length}`);
    
    return NextResponse.json({
      tests: testFiles,
      _meta: {
        source: backendTestsDir,
        count: testFiles.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error reading tests:', error);
    return NextResponse.json({ error: 'Failed to read tests' }, { status: 500 });
  }
}
