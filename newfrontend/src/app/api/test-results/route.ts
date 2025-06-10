import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// In-memory storage for test results
const testResults = new Map<string, any>();

// Handle OPTIONS request for CORS preflight
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Ensure directory exists
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

// Helper function to create a response
function createResponse(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

export async function GET(request: Request) {
  console.log('GET /api/test-results called');
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return handleOptions();
  }

  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('id') || searchParams.get('testId');

    console.log('Request URL:', request.url);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Test ID:', testId);

    if (!testId) {
      console.error('Missing test ID in request');
      return createResponse(
        { error: 'Test ID is required' },
        400
      );
    }

    // Try to get from in-memory storage first
    if (testResults.has(testId)) {
      console.log('Found test result in memory');
      return createResponse({
        success: true,
        result: testResults.get(testId),
        source: 'memory'
      });
    }

    // Try to load from file system
    try {
      const resultsDir = path.join(process.cwd(), 'test-results');
      const filePath = path.join(resultsDir, `${testId}.json`);
      
      console.log('Looking for test result at:', filePath);
      
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const testResult = JSON.parse(fileContent);
      
      // Cache in memory for future requests
      testResults.set(testId, testResult);
      
      console.log('Found test result in file system');
      return createResponse({
        success: true,
        result: testResult,
        source: 'file-system'
      });
      
    } catch (fsError) {
      console.error('Error reading from file system:', fsError);
      
      // Try the old backend path as fallback
      try {
        const oldResultsDir = path.join(process.cwd(), '../../backend/results/keyboard-tests');
        const files = await fs.readdir(oldResultsDir);
        const resultFile = files.find(file => 
          file.startsWith(testId) && file.endsWith('.json')
        );

        if (resultFile) {
          const resultPath = path.join(oldResultsDir, resultFile);
          const resultData = await fs.readFile(resultPath, 'utf-8');
          const testResult = JSON.parse(resultData);
          
          // Cache in memory for future requests
          testResults.set(testId, testResult);
          
          console.log('Found test result in legacy backend path');
          return createResponse({
            success: true,
            result: testResult,
            source: 'legacy-backend'
          });
        }
      } catch (legacyError) {
        console.error('Error checking legacy backend path:', legacyError);
      }
      
      // If we get here, the test result wasn't found
      return createResponse(
        { 
          success: false,
          error: 'Test result not found',
          testId,
          timestamp: new Date().toISOString()
        },
        404
      );
    }
    
  } catch (error) {
    console.error('Unexpected error in GET /api/test-results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return createResponse(
      { 
        success: false,
        error: 'Failed to fetch test result',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      500
    );
  }
}

// Also support POST for backward compatibility
export { POST } from './save/route';
