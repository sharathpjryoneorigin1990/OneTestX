import { runTest } from './src/routes/tests.js';
import fs from 'fs';
import path from 'path';

// Set environment variables
process.env.NODE_ENV = 'test';
process.env.DEBUG = 'pw:api,pw:browser*';
process.env.PLAYWRIGHT_TEST_BASE_URL = 'http://127.0.0.1:3000';

// Create test-results directory if it doesn't exist
const testResultsDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

async function runSingleTest(testPath) {
  console.log(`\n=== Running test: ${testPath} ===`);
  
  try {
    // Verify the test file exists
    const fullPath = path.join(process.cwd(), testPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Test file not found: ${fullPath}`);
    }
    
    console.log(`Test file exists: ${fullPath}`);
    
    // Run the test
    const result = await runTest(testPath);
    
    // Log results
    console.log('\n=== Test Completed ===');
    console.log(`Status: ${result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`Runner: ${result.runner}`);
    
    // Save output to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(testResultsDir, `test-output-${timestamp}.log`);
    
    const outputContent = [
      `Test: ${testPath}`,
      `Runner: ${result.runner}`,
      `Status: ${result.success ? 'PASSED' : 'FAILED'}`,
      '\n=== STDOUT ===',
      result.output || '(no output)',
      '\n=== STDERR ===',
      result.errorOutput || '(no errors)'
    ].join('\n');
    
    fs.writeFileSync(outputFile, outputContent);
    console.log(`\nTest output saved to: ${outputFile}`);
    
    // Display output
    if (result.output) {
      console.log('\n=== Test Output (first 1000 chars) ===');
      console.log(result.output.slice(0, 1000) + (result.output.length > 1000 ? '...' : ''));
    }
    
    if (result.errorOutput) {
      console.log('\n=== Error Output ===');
      console.error(result.errorOutput);
    }
    
    return result.success;
    
  } catch (error) {
    console.error('\n=== Test Error ===');
    console.error('Error:', error.message);
    
    if (error.runner) {
      console.log('Runner:', error.runner);
    }
    
    if (error.rawOutput) {
      console.log('\n=== Raw Output (first 1000 chars) ===');
      console.log(error.rawOutput.slice(0, 1000) + (error.rawOutput.length > 1000 ? '...' : ''));
    }
    
    if (error.errorOutput) {
      console.log('\n=== Error Output ===');
      console.error(error.errorOutput);
    } else if (error.stack) {
      console.log('\n=== Stack Trace ===');
      console.error(error.stack);
    }
    
    return false;
  }
}

async function main() {
  try {
    // Run the test
    const testPath = 'tests/smoke-test.js';
    const success = await runSingleTest(testPath);
    
    // Exit with appropriate status code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('Fatal error in test runner:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
