import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This is a server-side only function
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { envVars } = body;

    // Get the path to the .env file in the project root
    const envPath = path.resolve(process.cwd(), '.env');
    
    // Create the content for the .env file
    let envContent = '';
    for (const [key, value] of Object.entries(envVars as Record<string, string>)) {
      // Escape newlines and quotes in the value
      const escapedValue = String(value)
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/"/g, '\\"');
      
      envContent += `${key}="${escapedValue}"\n`;
    }

    // Write to the .env file
    await fs.promises.writeFile(envPath, envContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing .env file:', error);
    return NextResponse.json(
      { error: 'Failed to update .env file' },
      { status: 500 }
    );
  }
}

// For security, we don't expose the .env file content via GET
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
