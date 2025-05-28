import { spawn } from 'child_process';
import path from 'path';

async function runTestDirectly() {
  const testPath = path.join(process.cwd(), 'tests', 'ui', 'e2e', 'simple.flow.test.js');
  
  console.log('Running test directly:', testPath);
  
  const env = {
    ...process.env,
    FORCE_COLOR: '1',
    DEBUG: 'pw:api,pw:browser*',
    NODE_ENV: 'test',
    PLAYWRIGHT_TEST_BASE_URL: 'http://127.0.0.1:3000'
  };
  
  delete env.NODE_OPTIONS;
  
  // Use the full path to Node.js to avoid any path resolution issues
  const nodePath = process.execPath;
  console.log('Using Node.js at:', nodePath);
  
  const command = nodePath; // Use Node.js directly
  const npxPath = path.join(path.dirname(nodePath), 'npx.cmd'); // Use npx.cmd on Windows
  console.log('Using npx at:', npxPath);
  
  if (!fs.existsSync(npxPath)) {
    throw new Error(`npx not found at: ${npxPath}`);
  }
  const args = [
    npxPath, // Use the full path to npx
    'playwright',
    'test',
    testPath,
    '--workers=1',
    '--timeout=60000',
    '--reporter=list,html',
    '--output=test-results',
    '--debug'  // Add debug flag for more verbose output
  ];
  
  console.log('Current working directory:', process.cwd());
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    PATH: process.env.PATH
  });
  
  console.log(`Executing: ${command} ${args.join(' ')}`);
  
  const testProcess = spawn(command, args, {
    cwd: process.cwd(),
    env,
    shell: true,
    stdio: 'inherit'  // This will show the output in real-time
  });
  
  return new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Test completed successfully');
        resolve();
      } else {
        console.error(`Test failed with code ${code}`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      console.error('Test process error:', error);
      reject(error);
    });
  });
}

// Run the test
runTestDirectly()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error running test:', error);
    process.exit(1);
  });
