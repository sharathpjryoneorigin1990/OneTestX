import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import config from '../config.js';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Compare two images and return the difference
 * @param {string} baselinePath - Path to the baseline image
 * @param {string} actualPath - Path to the actual image
 * @param {string} diffPath - Path to save the diff image
 * @param {Object} options - Comparison options
 * @param {number} options.threshold - Matching threshold (0-1)
 * @returns {Promise<{match: boolean, diffPixels: number, diffPercentage: number}>}
 */
async function compareImages(baselinePath, actualPath, diffPath, options = {}) {
  const { threshold = 0.1 } = options;
  
  try {
    // Read images
    const [baselineImg, actualImg] = await Promise.all([
      fs.readFile(baselinePath),
      fs.readFile(actualPath)
    ]);
    
    const baseline = PNG.sync.read(baselineImg);
    const actual = PNG.sync.read(actualImg);
    
    const { width, height } = baseline;
    const diff = new PNG({ width, height });
    
    // Compare images
    const numDiffPixels = pixelmatch(
      baseline.data,
      actual.data,
      diff.data,
      width,
      height,
      { threshold }
    );
    
    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;
    
    // Save diff image if there are differences
    if (numDiffPixels > 0) {
      await fs.writeFile(diffPath, PNG.sync.write(diff));
    }
    
    return {
      match: numDiffPixels === 0,
      diffPixels: numDiffPixels,
      diffPercentage,
      totalPixels,
      diffPath: numDiffPixels > 0 ? diffPath : null
    };
  } catch (error) {
    console.error('Error comparing images:', error);
    throw error;
  }
}

/**
 * Assert that two images match within a threshold
 * @param {string} testName - Name of the test (used for file names)
 * @param {Buffer} screenshot - Screenshot buffer
 * @param {Object} options - Options
 * @param {number} options.threshold - Maximum allowed difference percentage (0-100)
 * @param {string} options.screenshotDir - Base directory for screenshots
 * @returns {Promise<void>}
 */
async function assertVisualMatch(testName, screenshot, options = {}) {
  const {
    threshold = 0.1,
    screenshotDir = path.join(__dirname, '../../../screenshots')
  } = options;
  
  // Ensure directories exist
  const dirs = {
    baseline: path.join(screenshotDir, 'baseline'),
    actual: path.join(screenshotDir, 'actual'),
    diff: path.join(screenshotDir, 'diffs')
  };
  
  await Promise.all(
    Object.values(dirs).map(dir => fs.ensureDir(dir))
  );
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baselinePath = path.join(dirs.baseline, `${testName}.png`);
  const actualPath = path.join(dirs.actual, `${testName}_${timestamp}.png`);
  const diffPath = path.join(dirs.diff, `${testName}_diff_${timestamp}.png`);
  
  // Save the actual screenshot
  await fs.writeFile(actualPath, screenshot);
  
  // Check if baseline exists
  const baselineExists = await fs.pathExists(baselinePath);
  if (!baselineExists) {
    console.log(`No baseline found for ${testName}. Creating baseline...`);
    await fs.copy(actualPath, baselinePath);
    throw new Error(`No baseline found. A new baseline has been created at ${baselinePath}`);
  }
  
  // Compare with baseline
  const result = await compareImages(baselinePath, actualPath, diffPath, { threshold });
  
  // Log the result
  console.log(`Visual difference for ${testName}: ${result.diffPercentage.toFixed(4)}%`);
  
  // Check if the difference is within the threshold
  const isWithinThreshold = result.diffPercentage <= threshold && 
                          result.diffPixels <= config.visual.maxDiffPixelCount;
  
  if (!isWithinThreshold) {
    const error = new Error(
      `Visual difference too large: ${result.diffPercentage.toFixed(2)}% ` +
      `(${result.diffPixels} pixels, threshold: ${threshold}%)`
    );
    
    // Attach additional context to the error
    Object.assign(error, {
      diffPath: result.diffPath,
      baselinePath,
      actualPath,
      diffPercentage: result.diffPercentage,
      diffPixels: result.diffPixels,
      threshold,
      isVisualMismatch: true
    });
    
    throw error;
  }
  
  return {
    ...result,
    baselinePath,
    actualPath,
    diffPath: result.diffPath,
    isWithinThreshold: true
  };
}

export { compareImages, assertVisualMatch };
