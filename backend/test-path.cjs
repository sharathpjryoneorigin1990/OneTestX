const path = require('path');
const fs = require('fs');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const testPath = path.join(process.cwd(), 'tests/ui/smoke/login.smoke.test.js');
console.log('Looking for test file at:', testPath);
console.log('Test file exists:', fs.existsSync(testPath));

// Check parent directories
let currentDir = process.cwd();
for (let i = 0; i < 3; i++) {
  console.log(`\nChecking directory: ${currentDir}`);
  console.log('Contents:', fs.readdirSync(currentDir));
  currentDir = path.dirname(currentDir);
}
