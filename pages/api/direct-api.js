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
    console.log('Received API request');
    
    // Parse the form data using proper constructor
    const form = new IncomingForm();
    
    // Use Promise to handle formidable's callback pattern
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    console.log('Form data parsed, files:', Object.keys(files));
    
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
    
    console.log('File found:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size
    });

    // Get the file path directly
    const filePath = file.filepath;
    
    if (!filePath) {
      console.error('File path is undefined, file properties:', Object.keys(file));
      return res.status(500).json({
        error: 'Failed to process image',
        message: 'File path is undefined'
      });
    }

    console.log('Using file path:', filePath);

    /* 
    // For testing purposes, return mock data
    // After the Hugging Face Space is properly initialized and running, you can uncomment the real integration
    console.log('Using mock data for development purposes');
    return res.status(200).json({
      results: [{
        id: '1',
        objects: [
          { label: 'Person', confidence: 0.95 },
          { label: 'Building', confidence: 0.87 },
          { label: 'Car', confidence: 0.82 }
        ],
        caption: 'A person standing next to a building with a car parked nearby',
        text_detected: false
      }],
      mock: true
    });
    */

    // Read the file from disk
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    
    console.log('Sending request to Hugging Face Space...');
    
    // Make the request to the Hugging Face Space
    try {
      // First check if the models are initialized
      const healthCheck = await fetch(`${HUGGINGFACE_SPACE_URL}/health`, {
        method: 'GET',
      }).catch(() => ({ ok: false }));
      
      // If health check fails, proceed with caution
      if (!healthCheck.ok) {
        console.log('Health check failed, the models might not be initialized yet');
      }
      
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

      console.log(`HF response status: ${hfResponse.status}`);
      
      // Handle error response from Hugging Face
      if (!hfResponse.ok) {
        let errorDetail = 'Unknown error';
        try {
          const errorBody = await hfResponse.text();
          console.error('Error from Hugging Face:', errorBody);
          
          // Check if it's an initialization error
          if (hfResponse.status === 503 || errorBody.includes('initializing')) {
            console.log('Models are still initializing, using mock data');
          }
          
          errorDetail = errorBody;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        // Send a mock response when HF fails
        console.log('Falling back to mock response due to HF error');
        return res.status(200).json({
          results: [{
            id: '1',
            objects: [
              { label: 'Person', confidence: 0.95 },
              { label: 'Building', confidence: 0.87 },
              { label: 'Car', confidence: 0.82 }
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
      console.log('Response from Hugging Face:', hfData);
      
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
        console.log('Invalid response format from HF, using mock data');
        return res.status(200).json({
          results: [{
            id: '1',
            objects: [
              { label: 'Person', confidence: 0.95 },
              { label: 'Building', confidence: 0.87 },
              { label: 'Car', confidence: 0.82 }
            ],
            caption: 'A person standing next to a building with a car parked nearby',
            text_detected: false
          }],
          mock: true
        });
      }
    } catch (hfError) {
      console.error('Error communicating with Hugging Face:', hfError);
      
      // Send a mock response on error
      console.log('Falling back to mock response due to exception:', hfError.message);
      return res.status(200).json({
        results: [{
          id: '1',
          objects: [
            { label: 'Person', confidence: 0.95 },
            { label: 'Building', confidence: 0.87 },
            { label: 'Car', confidence: 0.82 }
          ],
          caption: 'A person standing next to a building with a car parked nearby',
          text_detected: false
        }],
        mock: true,
        error: hfError.message
      });
    }
  } catch (error) {
    console.error('API processing error:', error);
    return res.status(500).json({ 
      error: 'Failed to process image',
      message: error.message || 'Unknown error'
    });
  }
} 