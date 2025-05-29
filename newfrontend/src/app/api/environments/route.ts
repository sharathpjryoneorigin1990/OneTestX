import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Saving environment configuration:', body);
    
    const response = NextResponse.json({ success: true });
    
    // Set secure, persistent cookies to indicate environments are configured
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    response.cookies.set('has_configured_environments', 'true', cookieOptions);
    response.cookies.set('env_configured', 'true', { ...cookieOptions, httpOnly: false });
    response.cookies.set('initial_setup_seen', 'true', cookieOptions);
    
    // Also set the active environment in a cookie
    if (body.environments && body.environments.length > 0) {
      response.cookies.set('activeEnvironment', JSON.stringify(body.environments[0]), {
        ...cookieOptions,
        httpOnly: false // Need to be able to read this client-side
      });
    }
    
    // Save environments to a cookie
    response.cookies.set('environments', JSON.stringify(body.environments), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });
    
    console.log('Environment configuration saved. Cookies set:', {
      hasConfiguredEnvironments: true,
      envConfigured: true,
      environments: body.environments
    });
    
    return response;
  } catch (error) {
    console.error('Error saving environments:', error);
    return NextResponse.json(
      { error: 'Failed to save environments' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const environmentsCookie = cookieStore.get('environments')?.value;
    const environments = environmentsCookie ? JSON.parse(environmentsCookie) : [];
    
    return NextResponse.json({ environments });
  } catch (error) {
    console.error('Error fetching environments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch environments' },
      { status: 500 }
    );
  }
}
