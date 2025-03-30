import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));

    const base64Image = body.data[0];
    
    // Use the Gradio API endpoint
    const spaceUrl = 'https://dolvido-smart-image-insights.hf.space';
    const endpoint = '/run/predict';
    console.log('Attempting to connect to:', `${spaceUrl}${endpoint}`);

    // Format the request body according to Gradio's API format
    const gradioRequest = {
      data: [base64Image],
      fn_index: 0 // Use the first function in the Gradio interface
    };

    const response = await fetch(`${spaceUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(gradioRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error details:', {
        url: `${spaceUrl}${endpoint}`,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText
      });
      throw new Error(`Space API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Space API response:', JSON.stringify(responseData, null, 2));

    // Transform the response to match our frontend's expected format
    const transformedData = {
      detections: responseData.data?.[0]?.objects?.map((obj: any) => ({
        name: obj.label,
        confidence: obj.confidence
      })) || [],
      predictions: responseData.data?.[0]?.predictions || [],
      text_detection: responseData.data?.[0]?.text_detection
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Analysis error:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze image',
        details: error instanceof Error ? error.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 