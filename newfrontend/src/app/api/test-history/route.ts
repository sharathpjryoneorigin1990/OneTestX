import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Get the absolute path to the project root
const PROJECT_ROOT = path.join(process.cwd(), '..');
const TEST_STORAGE_PATH = path.join(PROJECT_ROOT, 'backend', 'tests', 'ai', 'smart', 'testHistory.json');

export async function GET() {
  console.log('GET /api/test-history - Starting');
  console.log('Current working directory:', process.cwd());
  console.log('Test storage path:', TEST_STORAGE_PATH);

  try {
    // Ensure directory exists
    const dirPath = path.dirname(TEST_STORAGE_PATH);
    console.log('Ensuring directory exists:', dirPath);
    
    try {
      await fs.access(dirPath);
      console.log('Directory exists');
    } catch (dirError) {
      console.log('Directory does not exist, creating...');
      await fs.mkdir(dirPath, { recursive: true });
      console.log('Directory created');
    }
    
    // Try to read the file, return empty object if it doesn't exist
    try {
      console.log('Attempting to read file:', TEST_STORAGE_PATH);
      const fileContent = await fs.readFile(TEST_STORAGE_PATH, 'utf-8');
      console.log('Successfully read test history file');
      return NextResponse.json(JSON.parse(fileContent));
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        console.log('Test history file does not exist, returning empty object');
        return NextResponse.json({});
      }
      console.error('Error reading file:', readError);
      throw readError;
    }
  } catch (error: any) {
    console.error('Error in GET /api/test-history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load test history',
        details: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('POST /api/test-history - Starting');
  
  try {
    const tests = await request.json();
    console.log('Received tests data:', JSON.stringify(tests, null, 2));
    
    if (!Array.isArray(tests)) {
      throw new Error('Expected an array of tests');
    }
    
    // Ensure directory exists
    const dirPath = path.dirname(TEST_STORAGE_PATH);
    console.log('Ensuring directory exists:', dirPath);
    
    try {
      await fs.access(dirPath);
      console.log('Directory exists');
    } catch (dirError) {
      console.log('Directory does not exist, creating...');
      await fs.mkdir(dirPath, { recursive: true });
      console.log('Directory created');
    }
    
    // Read existing history
    let history: Record<string, any> = {};
    try {
      const fileContent = await fs.readFile(TEST_STORAGE_PATH, 'utf-8');
      history = JSON.parse(fileContent);
      console.log('Loaded existing history with', Object.keys(history).length, 'entries');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading history file:', error);
        throw error;
      }
    }
    
    // Add new test run with current timestamp
    const timestamp = new Date().toISOString();
    history[timestamp] = tests;
    
    // Keep only the last 10 test runs
    const timestamps = Object.keys(history).sort().reverse().slice(0, 10);
    const trimmedHistory: Record<string, any> = {};
    for (const ts of timestamps) {
      trimmedHistory[ts] = history[ts];
    }
    
    // Write the updated history to file
    console.log('Writing updated test history to:', TEST_STORAGE_PATH);
    await fs.writeFile(TEST_STORAGE_PATH, JSON.stringify(trimmedHistory, null, 2));
    
    console.log('Successfully saved test history with', timestamps.length, 'entries');
    return NextResponse.json({ success: true, timestamp });
  } catch (error: any) {
    console.error('Error in POST /api/test-history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save test history',
        details: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
