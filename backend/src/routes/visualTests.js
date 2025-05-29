import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const execAsync = promisify(exec);

// Enable CORS for all visual test routes
router.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
router.options('*', cors());

// Directory for storing visual test assets
const VISUAL_TEST_DIR = path.join(__dirname, '../../visual-tests');
const BASELINE_DIR = path.join(VISUAL_TEST_DIR, 'baseline');
const ACTUAL_DIR = path.join(VISUAL_TEST_DIR, 'actual');
const DIFF_DIR = path.join(VISUAL_TEST_DIR, 'diffs');

// Ensure directories exist
[VISUAL_TEST_DIR, BASELINE_DIR, ACTUAL_DIR, DIFF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Capture a screenshot of a URL
 */
router.post('/capture', async (req, res) => {
  try {
    const { url, testName } = req.body;
    
    if (!url || !testName) {
      return res.status(400).json({
        success: false,
        error: 'URL and testName are required'
      });
    }

    // Clean up test name for filename
    const safeTestName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${safeTestName}_${timestamp}.png`;
    const outputPath = path.join(ACTUAL_DIR, filename);

    // Use Playwright to take a screenshot
    // Properly escape the output path for Windows
    const escapedOutputPath = outputPath.replace(/\//g, '\\');
    const { stdout, stderr } = await execAsync(
      `npx playwright screenshot "${url}" "${escapedOutputPath}" --full-page`
    );
    
    console.log('Screenshot captured successfully:', { stdout, stderr });

    res.json({
      success: true,
      path: outputPath,
      filename,
      message: 'Screenshot captured successfully'
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to capture screenshot',
      details: error.message
    });
  }
});

/**
 * Compare a screenshot with baseline
 */
router.post('/compare', async (req, res) => {
  try {
    const { testName, actualPath } = req.body;
    
    if (!testName || !actualPath) {
      return res.status(400).json({
        success: false,
        error: 'testName and actualPath are required'
      });
    }

    // Find the most recent baseline for this test
    const safeTestName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const baselineFiles = fs.readdirSync(BASELINE_DIR)
      .filter(file => file.startsWith(safeTestName) && file.endsWith('.png'));
    
    if (baselineFiles.length === 0) {
      // No baseline exists, save current as baseline
      const baselinePath = path.join(BASELINE_DIR, `${safeTestName}_baseline.png`);
      await fs.copy(actualPath, baselinePath);
      
      return res.json({
        success: true,
        isNewBaseline: true,
        baselinePath,
        message: 'No baseline found. Created new baseline.'
      });
    }

    // Use the most recent baseline
    const baselineFile = baselineFiles.sort().reverse()[0];
    const baselinePath = path.join(BASELINE_DIR, baselineFile);
    const diffPath = path.join(DIFF_DIR, `${safeTestName}_diff_${Date.now()}.png`);

    // Compare images using pixelmatch
    const { compareImages } = await import('../utils/imageComparison.js');
    const result = await compareImages(baselinePath, actualPath, diffPath);

    res.json({
      success: true,
      isNewBaseline: false,
      match: result.match,
      diffPercentage: result.diffPercentage,
      diffPath: result.match ? null : diffPath,
      baselinePath,
      actualPath
    });
  } catch (error) {
    console.error('Error comparing images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare images',
      details: error.message
    });
  }
});

/**
 * Get all visual tests
 */
router.get('/', (req, res) => {
  try {
    const tests = [];
    
    // Get all baseline images
    const baselineFiles = fs.readdirSync(BASELINE_DIR)
      .filter(file => file.endsWith('.png') && file !== '.gitkeep');
    
    // Group by test name
    const testMap = new Map();
    
    baselineFiles.forEach(file => {
      let testName, timestamp;
      
      // Check for both formats:
      // 1. testname_timestamp.png
      // 2. testname_baseline.png
      const timestampMatch = file.match(/^(.+?)_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.png$/);
      const baselineMatch = file.match(/^(.+?)_baseline\.png$/);
      
      if (timestampMatch) {
        [, testName, timestamp] = timestampMatch;
        timestamp = new Date(timestamp.replace(/-/g, ':').replace('T', ' ').replace(/(\d{2})-(\d{2})Z$/, '$1:$2'));
      } else if (baselineMatch) {
        testName = baselineMatch[1];
        const filePath = path.join(BASELINE_DIR, file);
        const stats = fs.statSync(filePath);
        timestamp = stats.mtime; // Use file modification time
      } else {
        return; // Skip files that don't match either pattern
      }
      
      if (!testMap.has(testName)) {
        testMap.set(testName, []);
      }
      testMap.get(testName).push({
        name: testName,
        timestamp: timestamp,
        path: path.join(BASELINE_DIR, file)
      });
    });
    
    // Convert to array and sort by test name
    testMap.forEach((runs, testName) => {
      tests.push({
        name: testName,
        runs: runs.sort((a, b) => b.timestamp - a.timestamp),
        lastRun: runs[0].timestamp,
        baselineCount: runs.length
      });
    });
    
    res.json({
      success: true,
      tests: tests.sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('Error listing visual tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list visual tests',
      details: error.message
    });
  }
});

/**
 * Update a baseline image
 */
router.post('/update-baseline', async (req, res) => {
  try {
    const { testName, actualPath } = req.body;
    
    if (!testName || !actualPath) {
      return res.status(400).json({
        success: false,
        error: 'testName and actualPath are required'
      });
    }

    // Clean up test name for filename
    const safeTestName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const baselinePath = path.join(BASELINE_DIR, `${safeTestName}_baseline.png`);

    // Copy the actual image to be the new baseline
    await fs.copy(actualPath, baselinePath);

    res.json({
      success: true,
      baselinePath,
      message: 'Baseline image updated successfully'
    });
  } catch (error) {
    console.error('Error updating baseline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update baseline',
      details: error.message
    });
  }
});

export default router;
