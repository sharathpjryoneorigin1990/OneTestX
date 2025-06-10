import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Define test file type
interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

interface TestFile {
  id: string;
  name: string;
  path: string;
  category: string;
  tags: string[];
  testCases: TestCase[];
  lastRun: {
    status: string;
    timestamp: string;
  };
  isEmpty?: boolean;
}

// Extract test cases from file content
function extractTestCases(content: string): TestCase[] {
  const testCases: TestCase[] = [];
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

// Hardcoded test files based on our file system check
export const hardcodedTestFiles: TestFile[] = [
  // E2E Test Files
  {
    id: 'test-ui-e2e-e2efromgit-spec-js',
    name: 'e2efromgit',
    path: 'ui/e2e/e2efromgit.spec.js',
    category: 'ui/e2e',
    tags: ['ui', 'e2e'],
    testCases: [
      { name: 'should allow me to add todo items', group: null, line: 15 },
      { name: 'should clear text input field when an item is added', group: null, line: 41 },
      { name: 'should append new items to the bottom of the list', group: null, line: 54 },
      { name: 'should allow me to mark all items as completed', group: null, line: 83 },
      { name: 'should allow me to clear the complete state of all items', group: null, line: 92 },
      { name: 'complete all checkbox should update state when items are completed / cleared', group: null, line: 102 },
      { name: 'should allow me to mark items as complete', group: null, line: 125 },
      { name: 'should allow me to un-mark items as complete', group: null, line: 150 },
      { name: 'should allow me to edit an item', group: null, line: 175 },
      { name: 'should hide other controls when editing', group: null, line: 201 },
      { name: 'should save edits on blur', group: null, line: 211 },
      { name: 'should trim entered text', group: null, line: 225 },
      { name: 'should remove the item if an empty text string was entered', group: null, line: 239 },
      { name: 'should cancel edits on escape', group: null, line: 251 },
      { name: 'should display the current number of todo items', group: null, line: 261 },
      { name: 'should display the correct text', group: null, line: 285 },
      { name: 'should remove completed items when clicked', group: null, line: 290 },
      { name: 'should be hidden when there are no items that are completed', group: null, line: 298 },
      { name: 'should persist its data', group: null, line: 306 },
      { name: 'should allow me to display active items', group: null, line: 342 },
      { name: 'should respect the back button', group: null, line: 352 },
      { name: 'should allow me to display completed items', group: null, line: 378 },
      { name: 'should allow me to display all items', group: null, line: 385 },
      { name: 'should highlight the currently applied filter', group: null, line: 394 }
    ],
    lastRun: {
      status: 'pending',
      timestamp: new Date().toISOString()
    },
    isEmpty: false
  },
  {
    id: 'test-ui-e2e-simple-test-spec-js',
    name: 'simple test',
    path: 'ui/e2e/simple-test.spec.js',
    category: 'ui/e2e',
    tags: ['ui', 'e2e'],
    testCases: [
      { name: 'Empty test file', group: null, line: 1 }
    ],
    lastRun: {
      status: 'pending',
      timestamp: new Date().toISOString()
    },
    isEmpty: true
  },
  {
    id: 'test-ui-e2e-simple-flow-test-js',
    name: 'simple flow',
    path: 'ui/e2e/simple.flow.test.js',
    category: 'ui/e2e',
    tags: ['ui', 'e2e'],
    testCases: [
      { name: 'basic test', group: null, line: 3 }
    ],
    lastRun: {
      status: 'pending',
      timestamp: new Date().toISOString()
    },
    isEmpty: false
  },
  
  // Smoke Test Files
  {
    id: 'test-ui-smoke-smoke-test-js',
    name: 'smoke',
    path: 'ui/smoke/smoke.test.js',
    category: 'ui/smoke',
    tags: ['ui', 'smoke'],
    testCases: [
      { name: 'basic smoke test', group: null, line: 3 }
    ],
    lastRun: {
      status: 'pending',
      timestamp: new Date().toISOString()
    },
    isEmpty: false
  },
  {
    id: 'test-ui-smoke-smopkefromgit-spec-js',
    name: 'smopkefromgit',
    path: 'ui/smoke/smopkefromgit.spec.js',
    category: 'ui/smoke',
    tags: ['ui', 'smoke'],
    testCases: [
      { name: 'has title', group: null, line: 4 },
      { name: 'get started link', group: null, line: 11 }
    ],
    lastRun: {
      status: 'pending',
      timestamp: new Date().toISOString()
    },
    isEmpty: false
  }
];

export async function GET() {
  try {
    console.log('[GET] Using hardcoded test files list');
    
    // Return the hardcoded test files
    return NextResponse.json({
      tests: hardcodedTestFiles,
      _meta: {
        source: 'H:\\ASU projects\\new cursor\\backend\\tests',
        count: hardcodedTestFiles.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to read tests' }, { status: 500 });
  }
}
