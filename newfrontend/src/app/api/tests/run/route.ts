import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Clean up the test path - remove any ID formatting that might have been passed
    normalizedPath = normalizedPath.replace(/^test-/, '');
    normalizedPath = normalizedPath.replace(/-/g, '/');
    
    // Make sure it starts with tests/ if it's not already a full path
    if (!normalizedPath.startsWith('tests/') && !normalizedPath.startsWith('ui/')) {
      normalizedPath = `tests/${normalizedPath}`;
    }
    
    console.log(`Normalized test path: ${normalizedPath}`);
    
    // Resolve the full path to the test file
    const fullTestPath = path.join(process.cwd(), '..', normalizedPath);
    console.log(`Full test path: ${fullTestPath}`);
    
    // Try multiple possible locations for the test file
    const possibleTestPaths = [
      fullTestPath,
      path.join(process.cwd(), '..', 'backend', 'tests', normalizedPath.replace(/^tests\//, '')),
      path.join(process.cwd(), '..', normalizedPath),
      path.join(process.cwd(), '..', 'backend', normalizedPath),
      // Direct paths to the backend test files
      path.join('H:', 'ASU projects', 'new cursor', 'backend', 'tests', normalizedPath.replace(/^tests\//, '')),
      // Try with original path as well
      path.join('H:', 'ASU projects', 'new cursor', 'backend', 'tests', testPath.replace(/^tests\//, ''))
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
    const isK6Test = actualTestPath.includes(path.join('performance')) && actualTestPath.endsWith('.js');

    let results;
    let playwrightReportUrl: string | undefined = undefined;

    if (isK6Test) {
      console.log(`Identified k6 test: ${actualTestPath}`);
      const runId = uuidv4();
      const tempDir = path.join(process.cwd(), 'tmp'); // Temp directory in newfrontend/tmp
      const k6OutputDir = path.join(tempDir, 'k6-output', runId);
      await fs.mkdir(k6OutputDir, { recursive: true });

      const jsonSummaryFileName = 'summary.json';
      const jsonSummaryPath = path.join(k6OutputDir, jsonSummaryFileName);
      const htmlReportFileName = 'report.html';
      const k6HtmlReportPath = path.join(k6OutputDir, htmlReportFileName); // Path where k6-reporter will save the HTML

      // k6 command now only outputs JSON summary directly
      const k6TestCommand = `k6 run "${actualTestPath}" --summary-export="${jsonSummaryPath}"`;
      const commandToExecute = `cd "${path.dirname(actualTestPath)}" && ${k6TestCommand}`;
      
      console.log(`Executing k6 command: ${commandToExecute}`);
      
      try {
        const { stdout: k6Stdout, stderr: k6Stderr } = await execAsync(commandToExecute);
        console.log('k6 execution stdout:', k6Stdout);
        if (k6Stderr && !k6Stderr.includes('some thresholds have failed')) { // Log stderr unless it's just a threshold failure
            console.error('k6 execution stderr:', k6Stderr);
        }
        console.log('k6 execution completed. Generating HTML report from summary...');

        // Generate HTML report using k6-reporter
        // Ensure k6-reporter is installed: npm install k6-reporter
        const k6ReporterCommand = `npx k6-reporter --json "${jsonSummaryPath}" --html "${k6HtmlReportPath}"`;
        console.log(`Executing k6-reporter command: ${k6ReporterCommand}`);
        try {
            await execAsync(k6ReporterCommand);
            console.log(`k6-reporter HTML report generated at: ${k6HtmlReportPath}`);

            // Copy HTML report to public directory
            const publicReportDir = path.join(process.cwd(), 'public', 'performance-reports', runId);
            await fs.mkdir(publicReportDir, { recursive: true });
            const publicHtmlReportPathForServing = path.join(publicReportDir, htmlReportFileName);
            await fs.copyFile(k6HtmlReportPath, publicHtmlReportPathForServing);
            playwrightReportUrl = `/performance-reports/${runId}/${htmlReportFileName}`;
            console.log(`k6 HTML report available for serving at: ${playwrightReportUrl}`);
        } catch (reporterError: any) {
            console.error('Error generating k6 HTML report with k6-reporter:', reporterError);
            // Proceed without HTML report if reporter fails, but log it
            playwrightReportUrl = undefined;
        }

        // Parse k6 summary JSON
        const summaryContent = await fs.readFile(jsonSummaryPath, 'utf-8');
        const k6Summary = JSON.parse(summaryContent);

        const metrics = k6Summary.metrics;
        const checksPassed = metrics.checks?.values?.passes || 0;
        const checksFailed = metrics.checks?.values?.fails || 0;
        const totalChecks = checksPassed + checksFailed;
        // Check for threshold failures in k6Stderr or in the summary itself if available
        const thresholdsFailed = k6Stderr.includes('some thresholds have failed') || 
                                 (k6Summary.metrics.hasOwnProperty('thresholds') && 
                                  Object.values(k6Summary.metrics.thresholds.values).some((val: any) => val.fails > 0));
        const allThresholdsPassed = !thresholdsFailed;

        results = {
          success: allThresholdsPassed && checksFailed === 0,
          testPath: normalizedPath,
          runner: 'k6',
          summary: {
            passed: allThresholdsPassed && checksFailed === 0,
            duration: metrics.iteration_duration?.values?.avg || metrics.vus?.values?.duration_ms || 0,
            vusMax: metrics.vus_max?.values?.value || metrics.vus?.values?.max || 0,
            rps: metrics.http_reqs?.values?.rate || 0,
            p95ResponseTime: metrics.http_req_duration?.values?.['p(95)'] || 0, // Optional chaining for p(95) access
            errorRate: metrics.http_req_failed?.values?.rate || 0,
            totalTests: totalChecks,
            passedTests: checksPassed,
            failedTests: checksFailed,
            startTime: k6Summary.root_group?.start_time || new Date().toISOString(), // k6 summary might not have this directly
          },
          details: k6Summary,
          playwrightReportUrl: playwrightReportUrl
        };

      } catch (k6Error: any) {
        console.error('Error running k6 test:', k6Error);
        results = {
          success: false,
          testPath: normalizedPath,
          runner: 'k6',
          rawOutput: k6Error.stdout,
          rawError: k6Error.stderr || k6Error.message,
          errorDetails: k6Error.message,
          stack: k6Error.stack
        };
      } finally {
        // Cleanup temp k6 output directory
        await fs.rm(k6OutputDir, { recursive: true, force: true }).catch(err => console.error('Failed to cleanup k6 temp dir:', err));
      }
    } else {
      // Existing Playwright or Jest logic
      let testCommand;
      if (isPlaywrightTest) {
        testCommand = `cd "${path.dirname(actualTestPath)}" && npx playwright test "${path.basename(actualTestPath)}" --reporter=json`;
      } else { // Assuming Jest if not Playwright and not k6
        testCommand = `cd "${path.dirname(actualTestPath)}" && npx jest "${path.basename(actualTestPath)}" --json`;
      }
      console.log(`Executing command: ${testCommand}`);
      const { stdout, stderr } = await execAsync(testCommand);
      console.log('Test execution completed');

      try {
        let parsedOutput = JSON.parse(stdout); // Parse into a new variable

        if (isPlaywrightTest) {
          // Playwright JSON reporter format
          const success = parsedOutput.stats?.unexpected === 0 &&
                        parsedOutput.suites?.every((s: any) =>
                          s.specs?.every((spec: any) =>
                            spec.ok === true &&
                            spec.tests?.every((t: any) =>
                              t.results?.every((r: any) => r.status === 'passed')
                            )
                          )
                        ) || false;

          results = { // Assign to the outer 'results' variable
            success,
            testPath: normalizedPath,
            runner: 'playwright',
            details: parsedOutput, // Use parsedOutput
            summary: {
              passed: success,
              duration: parsedOutput.stats?.duration || 0,
              tests: parsedOutput.suites?.flatMap((s: any) => s.specs) || [],
              startTime: parsedOutput.stats?.startTime,
              totalTests: parsedOutput.stats?.expected || 0,
              passedTests: success ? (parsedOutput.stats?.expected || 0) : 0,
              failedTests: parsedOutput.stats?.unexpected || 0
            },
            playwrightReportUrl: undefined // Ensure this field exists for Playwright tests
          };
        } else {
          // Jest format
          results = { // Assign to the outer 'results' variable
            ...parsedOutput, // Spread the parsed Jest output
            success: parsedOutput.success || parsedOutput.numPassedTests === parsedOutput.numTotalTests,
            testPath: normalizedPath,
            runner: 'jest',
            playwrightReportUrl: undefined // Ensure this field exists for Jest tests
          };
        }
      } catch (error) {
        console.warn('Failed to parse test results as JSON, returning raw output');
        const success = !stderr &&
                      (stdout.includes('PASS') ||
                       stdout.includes('All tests passed') ||
                       !stdout.includes('FAIL'));

        results = { // Assign to the outer 'results' variable
          rawOutput: stdout,
          rawError: stderr,
          timestamp: new Date().toISOString(), // This will be overwritten by the final response object's timestamp
          success,
          testPath: normalizedPath,
          runner: isPlaywrightTest ? 'playwright' : 'jest',
          playwrightReportUrl: undefined
        };
      }
    } // Closes the 'else' block for Playwright/Jest tests
    
    // Add timestamp to the results
    const response = {
      ...results, // results already contains runner, testPath, and potentially playwrightReportUrl
      timestamp: new Date().toISOString()
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
