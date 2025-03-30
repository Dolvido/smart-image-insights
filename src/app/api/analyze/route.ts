import { NextResponse } from 'next/server';

// Direct URL to the API
const HUGGINGFACE_API = 'https://dolvido-smart-image-insights.hf.space/analyze';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Return a hardcoded mock response without any request handling
export function POST() {
  return Response.json({
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