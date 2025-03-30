import { NextResponse } from 'next/server';

const HUGGINGFACE_SPACE_URL = 'https://dolvido-smart-image-insights.hf.space';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the request to the Hugging Face Space
    const response = await fetch(`${HUGGINGFACE_SPACE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Space API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to search images',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 