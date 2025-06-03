import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Path to the tests directory (relative to the project root)
const TESTS_DIR = path.join(process.cwd(), '..', 'backend', 'tests');

export async function POST(request: NextRequest) {
  try {
    const { testPath, env = 'qa' } = await request.json();
    
    if (!testPath) {
      return NextResponse.json({ error: 'Test path is required' }, { status: 400 });
    }

    console.log(`[POST] Running test: ${testPath} in environment: ${env}`);
    
    // Normalize the test path if needed
    let normalizedPath = testPath;
    if (!normalizedPath.startsWith('tests/')) {
      normalizedPath = `tests/${normalizedPath}`;
    }
    
    console.log(`Normalized test path: ${normalizedPath}`);
    
    // Resolve the full path to the test file
    const fullTestPath = path.join(process.cwd(), '..', normalizedPath);
    console.log(`Full test path: ${fullTestPath}`);
    
    // Try multiple possible locations for the test file
    const possibleTestPaths = [
      fullTestPath,
      path.join(process.cwd(), '..', 'backend', 'tests', testPath.replace(/^tests\//, '')),
      path.join(process.cwd(), '..', testPath),
      path.join(process.cwd(), '..', 'backend', testPath)
    ];
    
    console.log('Checking possible test paths:', possibleTestPaths);
    
    // Check if the test file exists in any of the possible locations
    let actualTestPath = null;
    for (const testPath of possibleTestPaths) {
      try {
        await fs.access(testPath);
        actualTestPath = testPath;
        console.log(`Found test file at: ${actualTestPath}`);
        break;
      } catch (error) {
        console.log(`Test file not found at: ${testPath}`);
      }
    }
    
    if (!actualTestPath) {
      console.error(`Test file not found in any of the possible locations`);
      return NextResponse.json({ 
        error: 'Test file not found',
        details: `Test file not found in any of the possible locations`,
        normalizedPath,
        checkedPaths: possibleTestPaths
      }, { status: 404 });
    }
    
    // Determine the test runner based on the file content
    const fileContent = await fs.readFile(actualTestPath, 'utf-8');
    const isPlaywrightTest = fileContent.includes('@playwright/test');
    
    // Use the appropriate test runner
    let testCommand;
    if (isPlaywrightTest) {
      testCommand = `cd "${path.dirname(actualTestPath)}" && npx playwright test "${path.basename(actualTestPath)}" --reporter=json`;
    } else {
      testCommand = `cd "${path.dirname(actualTestPath)}" && npx jest "${path.basename(actualTestPath)}" --json`;
    }
    
    // Store the environment in the results
    console.log(`Executing command: ${testCommand}`);
    
    const { stdout, stderr } = await execAsync(testCommand);
    console.log('Test execution completed');
    
    // Parse the test results
    let results;
    try {
      // Try to parse the output as JSON
      results = JSON.parse(stdout);
      
      // Format the results based on the test runner
      if (isPlaywrightTest) {
        // Playwright JSON reporter format
        // Check if all specs are ok and all tests have passed status
        const success = results.stats?.unexpected === 0 && 
                      results.suites?.every((s: any) => 
                        s.specs?.every((spec: any) => 
                          spec.ok === true && 
                          spec.tests?.every((t: any) => 
                            t.results?.every((r: any) => r.status === 'passed')
                          )
                        )
                      ) || false;
        
        results = {
          success,
          testPath: normalizedPath,
          runner: 'playwright',
          details: results,
          summary: {
            passed: success,
            duration: results.stats?.duration || 0,
            tests: results.suites?.flatMap((s: any) => s.specs) || [],
            startTime: results.stats?.startTime,
            totalTests: results.stats?.expected || 0,
            passedTests: success ? (results.stats?.expected || 0) : 0,
            failedTests: results.stats?.unexpected || 0
          }
        };
      } else {
        // Jest format
        results = {
          ...results,
          success: results.success || results.numPassedTests === results.numTotalTests,
          testPath: normalizedPath,
          runner: 'jest'
        };
      }
    } catch (error) {
      console.warn('Failed to parse test results as JSON, returning raw output');
      // Determine success based on output content
      const success = !stderr && 
                    (stdout.includes('PASS') || 
                     stdout.includes('All tests passed') || 
                     !stdout.includes('FAIL'));
      
      results = {
        rawOutput: stdout,
        rawError: stderr,
        timestamp: new Date().toISOString(),
        success,
        testPath: normalizedPath,
        runner: isPlaywrightTest ? 'playwright' : 'jest'
      };
    }
    
    // Add timestamp to the results
    const response = {
      ...results,
      timestamp: new Date().toISOString(),
      testPath: normalizedPath
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error running test:', error);
    return NextResponse.json({ 
      error: 'Failed to run test',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
