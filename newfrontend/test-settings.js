const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.cwd(), 'jira-settings.json');

console.log('Checking file at path:', settingsPath);
console.log('File exists:', fs.existsSync(settingsPath));

try {
  const data = fs.readFileSync(settingsPath, 'utf8');
  console.log('File content:', data);
  const settings = JSON.parse(data);
  console.log('Parsed settings:', settings);
} catch (error) {
  console.error('Error reading/parsing file:', error);
}
