import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imagePath = searchParams.get('path');

  if (!imagePath) {
    return new NextResponse('Image path is required', { status: 400 });
  }

  try {
    // Check if the file exists
    await fs.access(imagePath);
    
    // Read the image file
    const imageBuffer = await fs.readFile(imagePath);
    
    // Get the file extension to determine content type
    const ext = path.extname(imagePath).toLowerCase();
    let contentType = 'image/png'; // default
    
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }
    
    // Return the image with appropriate content type
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Image not found', { status: 404 });
  }
}
