const { spawn } = require('child_process');
const child = spawn('dir', [], { shell: true });

console.log('Attempting to spawn "dir" command...');

child.stdout.on('data', (data) => {
  console.log(`[stdout]: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`[stderr]: ${data}`);
});

child.on('error', (err) => {
  console.error('Failed to start child process:', err);
});

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});