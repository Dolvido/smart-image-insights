import { NextResponse } from 'next/server';

// Force Node.js runtime
export const runtime = 'nodejs';

// Make sure this is dynamic (not cached)
export const dynamic = 'force-dynamic';

export async function POST(request) {
  // Return a hard-coded mock response
  return NextResponse.json({
    results: [{
      id: '1',
      objects: [
        { label: 'Mock Object 1', confidence: 0.95 },
        { label: 'Mock Object 2', confidence: 0.85 }
      ],
      caption: 'This is a mock caption for testing',
      text_detected: false
    }]
  });
} 