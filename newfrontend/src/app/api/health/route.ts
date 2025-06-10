import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to connect to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const backendResponse = await fetch(`${backendUrl}/api/health`);
    
    if (!backendResponse.ok) {
      throw new Error('Backend service is not healthy');
    }

    const data = await backendResponse.json();
    return NextResponse.json({ status: 'ok', ...data });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Backend service is unavailable',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
