import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Enable CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

// In-memory storage for test results
const testResults = new Map<string, any>();

export async function POST(request: Request) {
  console.log('Received save request');
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return handleOptions();
  }
  
  try {
    console.log('Parsing request body');
    let result;
    try {
      result = await request.json();
      console.log('Parsed request body:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Invalid request body');
    }
    
    if (!result.id) {
      console.error('Missing required field: id');
      throw new Error('Test result ID is required');
    }
    
    // Store the result in memory
    testResults.set(result.id, result);
    
    // Also try to save to file system for persistence
    try {
      const resultsDir = path.join(process.cwd(), 'test-results');
      await ensureDirectoryExists(resultsDir);
      
      const filePath = path.join(resultsDir, `${result.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(result, null, 2));
      console.log('Successfully saved test result to file system');
    } catch (fsError) {
      console.warn('Warning: Could not save to file system, using in-memory storage only', fsError);
    }
    
    const responseData = { 
      success: true, 
      id: result.id,
      message: 'Test result saved successfully',
      storage: testResults.has(result.id) ? 'memory' : 'file-system'
    };
    
    console.log('Sending success response:', responseData);
    
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error in save route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        error: 'Failed to save test result',
        details: errorMessage,
        timestamp: new Date().toISOString(),
        storage: 'none'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}

// Add a GET endpoint to retrieve test results
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('id');
  
  if (!testId) {
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Test ID is required' 
      }),
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Try to get from in-memory storage first
  const result = testResults.get(testId);
  
  if (result) {
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        result,
        source: 'memory' 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
  
  // If not in memory, try to load from file system
  try {
    const resultsDir = path.join(process.cwd(), 'test-results');
    const filePath = path.join(resultsDir, `${testId}.json`);
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const fileResult = JSON.parse(fileContent);
    
    // Cache in memory for future requests
    testResults.set(testId, fileResult);
    
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        result: fileResult,
        source: 'file-system' 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (fsError) {
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Test result not found',
        details: fsError instanceof Error ? fsError.message : 'Unknown error',
        source: 'none'
      }),
      { 
        status: 404, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
}
