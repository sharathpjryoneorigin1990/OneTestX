import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const execAsync = promisify(exec);

// Directory for storing screen reader test results
const RESULTS_DIR = path.join(__dirname, '../../results/accessibility');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Run screen reader test for a specific screen
router.post('/run', async (req, res) => {
  try {
    const { screenName, url, viewport = 'desktop' } = req.body;
    
    if (!screenName || !url) {
      return res.status(400).json({
        success: false,
        error: 'screenName and url are required parameters'
      });
    }

    const testId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFile = path.join(RESULTS_DIR, `${screenName}-${timestamp}-${testId}.json`);

    // Command to run the screen reader test using axe-playwright
    const command = `npx playwright test ${path.join(__dirname, '../utils/runScreenReaderTest.ts')} \
      --url="${url}" \
      --output="${resultFile}" \
      --screenName="${screenName}" \
      --viewport="${viewport}"`;

    console.log(`Running screen reader test for ${screenName} at ${url}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (fs.existsSync(resultFile)) {
      const results = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
      return res.json({
        success: true,
        testId,
        results,
        timestamp,
        screenName,
        url
      });
    } else {
      console.error('Screen reader test failed to generate results');
      console.error('STDOUT:', stdout);
      console.error('STDERR:', stderr);
      return res.status(500).json({
        success: false,
        error: 'Screen reader test failed',
        details: stderr || 'No results file generated'
      });
    }
  } catch (error) {
    console.error('Error running screen reader test:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to run screen reader test',
      details: error.message
    });
  }
});

// Get screen reader test results by ID
router.get('/results/:testId', (req, res) => {
  try {
    const { testId } = req.params;
    const resultsFile = fs.readdirSync(RESULTS_DIR).find(file => file.includes(testId));
    
    if (!resultsFile) {
      return res.status(404).json({
        success: false,
        error: 'Test results not found'
      });
    }
    
    const results = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, resultsFile), 'utf8'));
    return res.json({
      success: true,
      testId,
      results,
      timestamp: results.timestamp,
      screenName: results.screenName,
      url: results.url
    });
  } catch (error) {
    console.error('Error retrieving test results:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve test results',
      details: error.message
    });
  }
});

// List all screen reader tests
router.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(RESULTS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(RESULTS_DIR, file);
        const stats = fs.statSync(filePath);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        return {
          id: content.testId || file.replace('.json', ''),
          screenName: content.screenName,
          url: content.url,
          timestamp: content.timestamp || stats.mtime.toISOString(),
          violations: content.results?.violations?.length || 0,
          passes: content.results?.passes?.length || 0,
          incomplete: content.results?.incomplete?.length || 0,
          inapplicable: content.results?.inapplicable?.length || 0
        };
      });
    
    return res.json({
      success: true,
      count: files.length,
      tests: files
    });
  } catch (error) {
    console.error('Error listing screen reader tests:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list screen reader tests',
      details: error.message
    });
  }
});

export default router;
