# OneTestX

A comprehensive testing platform with visual regression testing capabilities.

## Features

- **Visual Regression Testing**: Capture and compare UI screenshots to detect visual regressions
- **AI-Powered Comparison**: Advanced image comparison with configurable thresholds
- **Test Management**: Organize and manage visual tests alongside your existing test suites
- **Interactive Dashboard**: View test results, differences, and manage baselines

## Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- Playwright for end-to-end testing
- (Optional) Docker for containerized testing

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/onetestx.git
   cd onetestx
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../newfrontend
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3005
   FRONTEND_URL=http://localhost:3000
   ```

## Visual Testing

### Running Visual Tests

1. Start the development servers:
   ```bash
   # In one terminal (backend)
   cd backend
   npm run dev
   
   # In another terminal (frontend)
   cd newfrontend
   npm run dev
   ```

2. Access the visual testing interface at:
   ```
   http://localhost:3000/test-files/visual
   ```

3. To run visual tests via the command line:
   ```bash
   cd backend
   npx playwright test tests/ui/visual/ --project=chromium
   ```

### Writing Visual Tests

Create a new visual test file in `backend/tests/ui/visual/` with the following structure:

```javascript
const { test, expect } = require('@playwright/test');

// Test configuration
const SCREENSHOT_DIR = path.join(__dirname, '../../screenshots');
const BASELINE_DIR = path.join(SCREENSHOT_DIR, 'baseline');
const ACTUAL_DIR = path.join(SCREENSHOT_DIR, 'actual');
const DIFF_DIR = path.join(SCREENSHOT_DIR, 'diffs');

test('homepage should match baseline', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:3000');
  
  // Take a screenshot
  const screenshot = await page.screenshot({ fullPage: true });
  
  // Compare with baseline and handle differences
  // ...
});
```

### Visual Testing API

The visual testing API is available at `/api/visual-tests` with the following endpoints:

- `POST /api/visual-tests/capture`: Capture a screenshot of a URL
- `POST /api/visual-tests/compare`: Compare a screenshot with a baseline
- `GET /api/visual-tests`: List all visual tests

### Configuration

Visual testing can be configured using the following environment variables:

```
VISUAL_TEST_THRESHOLD=0.1  # Pixel matching threshold (0-1)
VISUAL_TEST_SCREENSHOT_DIR=./screenshots  # Directory to store screenshots
VISUAL_TEST_VIEWPORT=1280x800  # Default viewport size
```

## License

MIT
