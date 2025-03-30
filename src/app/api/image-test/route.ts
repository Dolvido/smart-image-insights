import { NextResponse } from 'next/server';

// Force Node.js runtime instead of Edge
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    console.log('Test endpoint received request');
    
    // Return a simple mock response
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working correctly',
      results: [{
        id: '1',
        objects: [
          { label: 'Test Object 1', confidence: 0.95 },
          { label: 'Test Object 2', confidence: 0.85 }
        ],
        caption: 'This is a test caption',
        text_detected: false
      }]
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Test endpoint error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 