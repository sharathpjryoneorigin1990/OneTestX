import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
// Get command line arguments
const url = process.env.URL || 'http://localhost:3000';
const outputFile = process.env.OUTPUT || 'accessibility-results.json';
const screenName = process.env.SCREEN_NAME || 'home';
const viewport = process.env.VIEWPORT || 'desktop';
// Configure test with retries for flaky tests
test.describe.configure({ mode: 'parallel', retries: 1 });
test(`Accessibility test for ${screenName}`, async ({ page }, testInfo) => {
    const viewportSizes = {
        mobile: { width: 375, height: 667 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1280, height: 800 },
        large: { width: 1920, height: 1080 }
    };
    // Default to desktop if viewport type is invalid
    const viewportType = Object.keys(viewportSizes).includes(viewport)
        ? viewport
        : 'desktop';
    const size = viewportSizes[viewportType];
    await page.setViewportSize(size);
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle' });
    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    // Run accessibility scan with axe
    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice', 'section508'])
        .analyze();
    // Add metadata to results
    const testResults = {
        testId: testInfo.testId,
        screenName,
        url,
        viewport,
        timestamp: new Date().toISOString(),
        results
    };
    // Save results to file
    const outputPath = path.resolve(process.cwd(), outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));
    // Log summary
    console.log(`\nAccessibility test completed for ${screenName}`);
    console.log(`- URL: ${url}`);
    console.log(`- Viewport: ${viewport} (${size.width}x${size.height})`);
    console.log(`- Violations: ${results.violations.length}`);
    console.log(`- Passes: ${results.passes.length}`);
    console.log(`- Incomplete: ${results.incomplete.length}`);
    console.log(`- Inapplicable: ${results.inapplicable.length}`);
    // Assert that there are no critical accessibility issues
    expect.soft(results.violations.length, 'No critical accessibility violations should be found')
        .toBe(0);
});
