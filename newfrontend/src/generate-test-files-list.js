// Script to generate a comprehensive list of test files in the backend directory
const fs = require('fs').promises;
const path = require('path');

// Path to the tests directory - adjust this to the correct location
const TESTS_DIR = path.join(__dirname, '..', '..', 'backend', 'tests');
const OUTPUT_FILE = path.join(__dirname, 'test-files-list.json');

// Function to recursively get all files in a directory
async function getAllFiles(dir, fileList = []) {
  try {
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
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
    return fileList;
  }
}

// Extract test cases from file content (simplified version)
function extractTestCases(content) {
  const testCases = [];
  const testRegex = /test\(['"](.*?)['"]/g;
  const describeRegex = /describe\(['"](.*?)['"]/g;
  
  let match;
  while ((match = testRegex.exec(content)) !== null) {
    testCases.push({
      name: match[1],
      group: null,
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return testCases;
}

// Process test files
async function processTestFiles() {
  try {
    console.log(`Reading test files from: ${TESTS_DIR}`);
    
    // Check if the directory exists
    try {
      await fs.access(TESTS_DIR);
    } catch (err) {
      console.error(`Tests directory ${TESTS_DIR} does not exist:`, err);
      return [];
    }
    
    const allFiles = await getAllFiles(TESTS_DIR);
    console.log(`Found ${allFiles.length} files in total`);
    
    const testFiles = [];
    
    for (const fullPath of allFiles) {
      const fileName = path.basename(fullPath);
      const relativePath = path.relative(TESTS_DIR, fullPath);
      const testPath = relativePath.replace(/\\/g, '/');
      
      // Only include JavaScript/TypeScript files
      if (!fileName.endsWith('.js') && !fileName.endsWith('.ts')) {
        continue;
      }
      
      // Skip config and setup files
      if (fileName.includes('config') || fileName.includes('setup') || fileName.includes('fixture')) {
        continue;
      }
      
      console.log(`Processing file: ${fileName}, path: ${testPath}`);
      
      // Get file stats
      const stats = await fs.stat(fullPath);
      let testCases = [];
      
      if (stats.size > 0) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          testCases = extractTestCases(content);
          console.log(`  Found ${testCases.length} test cases`);
        } catch (err) {
          console.error(`  Error reading file: ${err.message}`);
          testCases = [{ name: 'Error reading file', group: null, line: 1 }];
        }
      } else {
        console.log(`  Empty file`);
        testCases = [{ name: 'Empty test file', group: null, line: 1 }];
      }
      
      // Determine category and tags
      let category = 'other';
      let tags = [];
      
      // Special handling for ui/smoke and ui/e2e paths
      if (testPath.includes('ui/smoke') || testPath.includes('ui\\smoke')) {
        category = 'ui/smoke';
        tags = ['ui', 'smoke'];
      } else if (testPath.includes('ui/e2e') || testPath.includes('ui\\e2e')) {
        category = 'ui/e2e';
        tags = ['ui', 'e2e'];
      } else if (testPath.startsWith('ui/')) {
        category = 'ui/other';
        tags = ['ui'];
      } else {
        // Extract category from path
        const pathParts = testPath.split('/');
        if (pathParts.length > 1) {
          category = pathParts.slice(0, 2).join('/');
          tags = pathParts.slice(0, 2);
        }
      }
      
      testFiles.push({
        id: `test-${testPath.replace(/[\\/.:]/g, '-')}`,
        name: fileName.replace(/\.(test|spec|flow\.test)\.(js|ts)$/, '').replace(/[-_]/g, ' '),
        path: testPath,
        category,
        tags,
        testCases,
        lastRun: {
          status: 'pending',
          timestamp: new Date().toISOString(),
        },
        isEmpty: stats.size === 0
      });
    }
    
    console.log(`Processed ${testFiles.length} test files`);
    return testFiles;
  } catch (err) {
    console.error('Error processing test files:', err);
    return [];
  }
}

// Main function
async function main() {
  try {
    const testFiles = await processTestFiles();
    
    const result = {
      tests: testFiles,
      _meta: {
        source: TESTS_DIR,
        count: testFiles.length,
        timestamp: new Date().toISOString()
      }
    };
    
    // Write the result to a JSON file
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`Test files list written to ${OUTPUT_FILE}`);
    
    // Log summary by category
    const categories = {};
    for (const test of testFiles) {
      categories[test.category] = (categories[test.category] || 0) + 1;
    }
    
    console.log('\nSummary by category:');
    for (const [category, count] of Object.entries(categories)) {
      console.log(`  ${category}: ${count} files`);
    }
    
  } catch (err) {
    console.error('Error in main function:', err);
  }
}

// Run the script
main().catch(console.error);
