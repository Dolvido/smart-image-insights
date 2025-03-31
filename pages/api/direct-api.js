// Direct API endpoint using Pages Router
// Import correctly based on the formidable version
import { IncomingForm } from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Hugging Face Space URL provided by the user
const HUGGINGFACE_SPACE_URL = 'https://dolvido-smart-image-insights.hf.space';

// Disable Next.js body parsing for multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data using proper constructor
    const form = new IncomingForm();
    
    // Use Promise to handle formidable's callback pattern
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });
    
    // Get file from the uploaded files object
    const fileKeys = Object.keys(files);
    if (fileKeys.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileKey = fileKeys[0];
    
    // Important: The file may be an array or a single object depending on formidable version
    const fileData = files[fileKey];
    
    // Handle both array and single object cases
    const file = Array.isArray(fileData) ? fileData[0] : fileData;
    
    // Get the file path directly
    const filePath = file.filepath;
    
    if (!filePath) {
      return res.status(500).json({
        error: 'Failed to process image',
        message: 'File path is undefined'
      });
    }

    // Read the file from disk
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    
    // Make the request to the Hugging Face Space
    try {
      // First check if the models are initialized
      const healthCheck = await fetch(`${HUGGINGFACE_SPACE_URL}/health`, {
        method: 'GET',
      }).catch(() => ({ ok: false }));
      
      // Make the API request - IMPORTANT CHANGE: Use JSON payload instead of form data
      const hfResponse = await fetch(`${HUGGINGFACE_SPACE_URL}/analyze-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          filename: file.originalFilename || 'image.jpg'
        }),
        // Give it more time to respond
        timeout: 30000
      });
      
      // Handle error response from Hugging Face
      if (!hfResponse.ok) {
        let errorDetail = 'Unknown error';
        try {
          const errorBody = await hfResponse.text();
          errorDetail = errorBody;
        } catch (e) {
          // Error parsing error response
        }
        
        // Send a mock response when HF fails
        return res.status(200).json({
          results: [{
            id: '1',
            objects: [
              { label: 'person', confidence: 0.95 },
              { label: 'building', confidence: 0.87 },
              { label: 'car', confidence: 0.82 }
            ],
            caption: 'A person standing next to a building with a car parked nearby',
            text_detected: false
          }],
          mock: true,
          error: errorDetail
        });
      }

      // Get the response data
      const hfData = await hfResponse.json();
      
      // The FastAPI endpoint returns a format with 'results' containing an array
      if (hfData.results && Array.isArray(hfData.results) && hfData.results.length > 0) {
        const result = hfData.results[0];
        
        // Transform the response to match our expected format
        const responseData = {
          results: [{
            id: result.id || '1',
            objects: Array.isArray(result.objects) ? result.objects : [],
            caption: result.caption || 'Image analysis complete',
            text_detected: result.text_detected || false
          }]
        };

        return res.status(200).json(responseData);
      } else {
        // Invalid response format, return mock data
        return res.status(200).json({
          results: [{
            id: '1',
            objects: [
              { label: 'person', confidence: 0.95 },
              { label: 'building', confidence: 0.87 },
              { label: 'car', confidence: 0.82 }
            ],
            caption: 'A person standing next to a building with a car parked nearby',
            text_detected: false
          }],
          mock: true
        });
      }
    } catch (hfError) {
      // Send a mock response on error
      return res.status(200).json({
        results: [{
          id: '1',
          objects: [
            { label: 'person', confidence: 0.95 },
            { label: 'building', confidence: 0.87 },
            { label: 'car', confidence: 0.82 }
          ],
          caption: 'A person standing next to a building with a car parked nearby',
          text_detected: false
        }],
        mock: true,
        error: hfError.message
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to process image',
      message: error.message || 'Unknown error'
    });
  }
} 