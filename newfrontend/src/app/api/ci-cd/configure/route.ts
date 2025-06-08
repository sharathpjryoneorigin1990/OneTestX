import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { selectedTests, jenkinsConfig, schedule } = await req.json();

    // Validate input
    if (!selectedTests?.length || !jenkinsConfig?.url || !schedule?.cronExpression) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Here you would typically:
    // 1. Save the configuration to your database
    // 2. Set up the Jenkins job with the provided configuration
    // 3. Schedule the job using the provided cron expression

    // Mock response for now
    return NextResponse.json({ 
      success: true, 
      message: 'CI/CD configuration saved successfully',
      jobId: `job-${Date.now()}`
    });
  } catch (error) {
    console.error('Error saving CI/CD configuration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
