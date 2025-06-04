import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Received image upload request');
    
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      console.log('No file provided in request');
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Create a new FormData instance for the worker
    const workerFormData = new FormData();
    workerFormData.append('image', file);

    console.log('Forwarding request to worker:', process.env.API_BASE_URL);

    // Forward the request to the worker
    const response = await fetch(`${process.env.API_BASE_URL}/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.R2_API_TOKEN}`
      },
      body: workerFormData
    });

    console.log('Worker response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Worker error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to upload image' },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Upload successful:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Detailed error in image upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    );
  }
} 