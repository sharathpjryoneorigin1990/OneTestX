// Script to check test files in the backend directory
const fs = require('fs');
const path = require('path');

// Path to the tests directory
const TESTS_DIR = path.join(__dirname, '..', '..', 'backend', 'tests');
const UI_E2E_DIR = path.join(TESTS_DIR, 'ui', 'e2e');
const UI_SMOKE_DIR = path.join(TESTS_DIR, 'ui', 'smoke');

// Function to list all files in a directory
async function listFiles(dir) {
  try {
    console.log(`\nListing files in: ${dir}`);
    const files = await fs.promises.readdir(dir);
    
    console.log(`Found ${files.length} files/directories:`);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.promises.stat(filePath);
      console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'}, size: ${stats.size} bytes)`);
      
      // Read the first few bytes to check if it's a valid file
      if (!stats.isDirectory()) {
        try {
          const fd = await fs.promises.open(filePath, 'r');
          const buffer = Buffer.alloc(100);
          await fd.read(buffer, 0, 100, 0);
          await fd.close();
          console.log(`  First bytes: ${buffer.toString('utf8', 0, 50).replace(/\n/g, ' ').trim()}...`);
        } catch (err) {
          console.error(`  Error reading file: ${err.message}`);
        }
      }
    }
    return files;
  } catch (err) {
    console.error(`Error listing files in ${dir}:`, err);
    return [];
  }
}

// Main function
async function main() {
  console.log('Checking test files in the backend directory...');
  console.log('Tests directory:', TESTS_DIR);
  
  // Check if the directories exist
  const testsExists = await fs.promises.access(TESTS_DIR).then(() => true).catch(() => false);
  console.log(`Tests directory exists: ${testsExists}`);
  
  if (testsExists) {
    // List the contents of the tests directory
    await listFiles(TESTS_DIR);
    
    // Check UI directory
    const uiDir = path.join(TESTS_DIR, 'ui');
    const uiExists = await fs.promises.access(uiDir).then(() => true).catch(() => false);
    console.log(`\nUI directory exists: ${uiExists}`);
    
    if (uiExists) {
      await listFiles(uiDir);
      
      // Check E2E directory
      const e2eExists = await fs.promises.access(UI_E2E_DIR).then(() => true).catch(() => false);
      console.log(`\nE2E directory exists: ${e2eExists}`);
      
      if (e2eExists) {
        await listFiles(UI_E2E_DIR);
      }
      
      // Check Smoke directory
      const smokeExists = await fs.promises.access(UI_SMOKE_DIR).then(() => true).catch(() => false);
      console.log(`\nSmoke directory exists: ${smokeExists}`);
      
      if (smokeExists) {
        await listFiles(UI_SMOKE_DIR);
      }
    }
  }
}

// Run the script
main().catch(console.error);
