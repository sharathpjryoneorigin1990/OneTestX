import fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

/**
 * Compare two images and generate a diff image
 * @param {string} img1Path - Path to the first image (baseline)
 * @param {string} img2Path - Path to the second image (actual)
 * @param {string} diffPath - Path to save the diff image
 * @param {Object} options - Comparison options
 * @returns {Promise<{match: boolean, diffPercentage: number}>} - Comparison result
 */
export async function compareImages(img1Path, img2Path, diffPath, options = {}) {
  try {
    // Default options
    const {
      threshold = 0.1, // Matching threshold (0 to 1)
      maxDiffPixelRatio = 0.1, // Maximum allowed difference ratio (0 to 1)
    } = options;

    // Read images
    const [img1, img2] = await Promise.all([
      readImage(img1Path),
      readImage(img2Path)
    ]);

    // Ensure images have the same dimensions
    if (img1.width !== img2.width || img1.height !== img2.height) {
      throw new Error('Images must have the same dimensions');
    }

    const { width, height } = img1;
    
    // Create diff image
    const diff = new PNG({ width, height });
    
    // Compare images
    const numDiffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      width,
      height,
      { threshold }
    );

    // Calculate difference percentage
    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;
    const match = diffPercentage <= (maxDiffPixelRatio * 100);

    // Save diff image if there are differences
    if (!match && diffPath) {
      await new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(diffPath);
        diff.pack().pipe(stream);
        
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
    }

    return {
      match,
      diffPercentage,
      diffPath: !match ? diffPath : null,
      width,
      height,
      diffPixels: numDiffPixels,
      totalPixels,
      threshold,
      maxDiffPixelRatio: maxDiffPixelRatio * 100
    };
  } catch (error) {
    console.error('Error comparing images:', error);
    throw error;
  }
}

/**
 * Read and parse a PNG image
 * @param {string} path - Path to the image file
 * @returns {Promise<Object>} - Parsed image data
 */
async function readImage(path) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(path)
      .pipe(new PNG())
      .on('parsed', function() {
        resolve(this);
      })
      .on('error', (error) => {
        reject(new Error(`Failed to read image at ${path}: ${error.message}`));
      });
  });
}

export default {
  compareImages
};
