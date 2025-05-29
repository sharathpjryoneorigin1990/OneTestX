import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directories
const ROOT_DIR = path.join(__dirname, '../../../..');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'screenshots');

const config = {
  // Directory configuration
  dirs: {
    root: ROOT_DIR,
    screenshots: SCREENSHOT_DIR,
    baseline: path.join(SCREENSHOT_DIR, 'baseline'),
    actual: path.join(SCREENSHOT_DIR, 'actual'),
    diffs: path.join(SCREENSHOT_DIR, 'diffs'),
  },
  
  // Default test configuration
  defaults: {
    threshold: 0.1, // 0.1% difference allowed by default
    viewport: { width: 1280, height: 800 },
    fullPage: true,
    animations: 'disabled',
  },
  
  // URLs for testing
  urls: {
    homepage: 'http://localhost:3000',
    login: 'http://localhost:3000/login',
    dashboard: 'http://localhost:3000/dashboard',
  },
  
  // Selectors for common elements
  selectors: {
    header: 'header',
    footer: 'footer',
    mainContent: 'main',
    navigation: 'nav',
  },
  
  // Timeouts (in milliseconds)
  timeouts: {
    pageLoad: 30000,
    networkIdle: 5000,
    animation: 500,
  },
  
  // Visual test configuration
  visual: {
    // Maximum allowed difference percentage before failing the test
    maxDiffPercentage: 0.1,
    
    // Maximum allowed pixel difference before failing the test
    maxDiffPixelCount: 100,
    
    // Whether to update baselines automatically when they don't exist
    updateBaselines: process.env.UPDATE_BASELINES === 'true',
    
    // Whether to save the diff image when a test fails
    saveDiffOnFailure: true,
  },
  
  // Browser configuration
  browsers: {
    chromium: {
      name: 'chromium',
      viewport: { width: 1280, height: 800 },
    },
    firefox: {
      name: 'firefox',
      viewport: { width: 1280, height: 800 },
    },
    webkit: {
      name: 'webkit',
      viewport: { width: 1280, height: 800 },
    },
  },
};

export default config;
