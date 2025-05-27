import { NextResponse, type NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/signup', '/_next', '/api', '/assets', '/favicon.ico'];

// Check if environments are configured
function checkEnvironmentsConfigured(request: NextRequest): boolean {
  // Skip check for API routes and environment configuration page
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/environments/configure')) {
    return true;
  }

  // Check for any indication that environments are configured
  // 1. Check for the active environment in cookies
  const activeEnv = request.cookies.get('activeEnvironment')?.value;
  if (activeEnv) {
    try {
      const env = JSON.parse(activeEnv);
      if (env && env.url) {
        console.log('Found active environment in cookies:', env.name);
        return true;
      }
    } catch (e) {
      console.error('Error parsing activeEnvironment cookie:', e);
    }
  }
  
  // 2. Check for the environments array in cookies
  const hasHttpOnlyCookie = request.cookies.get('has_configured_environments')?.value === 'true';
  const hasRegularCookie = request.cookies.get('env_configured')?.value === 'true';
  const hasInitialSetup = request.cookies.get('initial_setup_seen')?.value === 'true';
  
  // If any of the cookies indicate environments are configured, return true
  if (hasHttpOnlyCookie || hasRegularCookie || hasInitialSetup) {
    console.log('Environment configuration found via cookies');
    return true;
  }
  
  // 3. Check the environments cookie directly
  const environmentsCookie = request.cookies.get('environments');
  if (environmentsCookie?.value) {
    try {
      const envs = JSON.parse(environmentsCookie.value);
      if (Array.isArray(envs) && envs.length > 0) {
        console.log('Found environments in cookie:', envs);
        return true;
      }
    } catch (e) {
      console.error('Error parsing environments cookie:', e);
    }
  }
  
  // 3. Check for any of the other indicator cookies
  const indicatorCookies = [
    'has_configured_environments',
    'env_configured',
    'initial_setup_seen'
  ];
  
  for (const cookieName of indicatorCookies) {
    if (request.cookies.get(cookieName)?.value === 'true') {
      console.log(`Found indicator cookie: ${cookieName}`);
      return true;
    }
  }
  
  console.log('No environment configuration found in cookies');
  return false;
};

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isConfigurePage = pathname.startsWith('/environments/configure');
  const isInitialSetup = searchParams.get('initial') === 'true';
  
  // Skip middleware for public paths and API routes
  if (isPublicPath || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const isAuthenticated = request.cookies.get('auth-token')?.value;
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For authenticated users, check environment configuration
  const environmentsConfigured = checkEnvironmentsConfigured(request);
  
  // Log the decision for debugging
  console.log('Middleware decision:', {
    pathname,
    isConfigurePage,
    environmentsConfigured,
    isInitialSetup,
    cookies: {
      authToken: !!isAuthenticated,
      initialSetup: request.cookies.get('initial_setup_seen')?.value,
      envConfigured: request.cookies.get('env_configured')?.value,
      hasEnvironments: !!request.cookies.get('environments')?.value
    }
  });

  // If environments are not configured and we're not on the configure page, redirect
  if (!environmentsConfigured && !isConfigurePage) {
    console.log('Redirecting to environment configuration');
    const configureUrl = new URL('/environments/configure', request.url);
    configureUrl.searchParams.set('initial', 'true');
    
    // Set a cookie to indicate we've seen the initial setup
    const response = NextResponse.redirect(configureUrl);
    response.cookies.set('initial_setup_seen', 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    return response;
  }

  // Allow access to the configure page only when accessed directly (not after login)
  if (isConfigurePage) {
    const referer = request.headers.get('referer');
    const isFromLogin = referer && referer.includes('/login');
    
    if (isFromLogin) {
      console.log('Redirecting to dashboard after login');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    console.log('Allowing direct access to configure page');
    return NextResponse.next();
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
