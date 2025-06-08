import { NextRequest, NextResponse } from 'next/server';

// Handler for all HTTP methods
export async function POST(request: NextRequest) {
  try {
    console.log('[Proxy POST] Received request');
    
    // Parse the request body
    const requestData = await request.json();
    const { url, method, headers = {}, body } = requestData;
    
    console.log('[Proxy POST] Request details:', { url, method });
    
    if (!url) {
      console.log('[Proxy POST] Error: URL is required');
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    if (!method) {
      console.log('[Proxy POST] Error: HTTP method is required');
      return NextResponse.json(
        { error: 'HTTP method is required' },
        { status: 400 }
      );
    }
    
    // Validate URL to prevent server-side request forgery
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }
    
    // Optional: Add allowlist of domains for security
    // const allowedDomains = ['api.example.com', 'swagger.io'];
    // const parsedUrl = new URL(url);
    // if (!allowedDomains.includes(parsedUrl.hostname)) {
    //   return NextResponse.json(
    //     { error: 'Domain not allowed' },
    //     { status: 403 }
    //   );
    // }
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'User-Agent': 'API Testing Tool/1.0',
        ...headers
      },
      redirect: 'follow'
    };
    
    // Add body for non-GET/HEAD requests
    if (body && !['GET', 'HEAD'].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    // Make the request
    console.log('[Proxy POST] Sending request to:', url, 'with options:', {
      method: fetchOptions.method,
      headers: fetchOptions.headers
    });
    
    const startTime = performance.now();
    let response;
    try {
      response = await fetch(url, fetchOptions);
      console.log('[Proxy POST] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (fetchError) {
      console.error('[Proxy POST] Fetch error:', fetchError);
      throw fetchError;
    }
    const endTime = performance.now();
    
    // Get response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Get response body based on content type
    const contentType = response.headers.get('content-type') || '';
    console.log('[Proxy POST] Response content type:', contentType);
    let responseBody;
    
    if (contentType.includes('application/json')) {
      try {
        console.log('[Proxy POST] Parsing response as JSON');
        const text = await response.text();
        console.log('[Proxy POST] Response text preview:', text.substring(0, 200) + '...');
        
        try {
          responseBody = JSON.parse(text);
          console.log('[Proxy POST] Successfully parsed JSON, keys:', Object.keys(responseBody));
          
          // Check if it's a Swagger/OpenAPI spec
          if (responseBody.swagger || responseBody.openapi) {
            console.log('[Proxy POST] Detected Swagger/OpenAPI spec:', { 
              version: responseBody.swagger || responseBody.openapi,
              title: responseBody.info?.title,
              paths: Object.keys(responseBody.paths || {}).length
            });
          }
        } catch (jsonError) {
          console.error('[Proxy POST] JSON parsing error:', jsonError);
          responseBody = text; // Use the text as fallback
        }
      } catch (error) {
        console.error('[Proxy POST] Error reading response text:', error);
        responseBody = 'Error reading response';
      }
    } else if (
      contentType.includes('text/') || 
      contentType.includes('application/xml') || 
      contentType.includes('application/javascript')
    ) {
      console.log('[Proxy POST] Parsing response as text');
      try {
        responseBody = await response.text();
        console.log('[Proxy POST] Response text preview:', responseBody.substring(0, 200) + '...');
      } catch (error) {
        console.error('[Proxy POST] Error reading text response:', error);
        responseBody = 'Error reading response';
      }
    } else {
      // For binary data, return base64 encoded string
      console.log('[Proxy POST] Parsing response as binary');
      try {
        const buffer = await response.arrayBuffer();
        responseBody = Buffer.from(buffer).toString('base64');
        console.log('[Proxy POST] Converted binary data to base64 string');
      } catch (error) {
        console.error('[Proxy POST] Error processing binary response:', error);
        responseBody = 'Error processing binary response';
      }
    }
    
    // Return response data
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      time: Math.round(endTime - startTime),
      size: JSON.stringify(responseBody).length,
      url: response.url
    });
  } catch (error) {
    console.error('Proxy error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        body: null,
        time: 0,
        size: 0
      },
      { status: 500 }
    );
  }
}

// For backward compatibility, maintain the GET method
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  console.log('[Proxy GET] Received request for URL:', url);
  
  if (!url) {
    console.log('[Proxy GET] Error: URL parameter is required');
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }
  
  console.log('[Proxy GET] Forwarding to POST handler with URL:', url);
  
  try {
    // Convert GET request to use the POST handler
    const result = await POST(
      new Request('http://localhost/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
      }) as NextRequest
    );
    
    // Log the response status
    const responseData = await result.clone().json();
    console.log('[Proxy GET] Response received:', {
      status: responseData.status,
      contentType: responseData.headers?.['content-type'],
      bodyPreview: typeof responseData.body === 'object' ? 
        JSON.stringify(responseData.body).substring(0, 200) + '...' : 
        'Non-JSON response'
    });
    
    return result;
  } catch (error) {
    console.error('[Proxy GET] Error forwarding request:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error in proxy',
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        body: null,
        time: 0,
        size: 0
      },
      { status: 500 }
    );
  }
}
