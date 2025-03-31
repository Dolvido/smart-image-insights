'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisResult {
  object_detection?: Array<{
    class: string;
    confidence: number;
  }>;
  image_classification?: Array<{
    label: string;
    confidence: number;
  }>;
  text_detection?: {
    text: string;
  };
}

interface ApiResponse {
  results?: Array<{
    id: string;
    imageUrl: string;
    objects: Array<{
      label: string;
      confidence: number;
      bbox?: [number, number, number, number];
    }>;
    caption: string;
  }>;
  errors?: string[] | null;
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  loading: boolean;
  error: string | null;
  results: AnalysisResult | null;
}

export default function ImageAnalysis() {
  const [images, setImages] = useState<ImageItem[]>([]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const newImages = acceptedFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        loading: false,
        error: null,
        results: null
      }));
      
      setImages(prev => [...prev, ...newImages]);
    }
  });

  const handleAnalyze = async (imageId: string) => {
    const imageIndex = images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) return;
    
    // Update loading state
    setImages(prev => prev.map((img, idx) => 
      idx === imageIndex ? { ...img, loading: true, error: null } : img
    ));

    try {
      const imageToAnalyze = images[imageIndex];
      console.log('Preparing to send image to API...', imageToAnalyze.file.name);
      
      // Create a FormData object instead of using base64
      const formData = new FormData();
      formData.append('files', imageToAnalyze.file);
      formData.append('analysis_type', 'all');
      
      console.log('Sending request to Hugging Face API...');
      
      // Send request directly to Hugging Face Space API with FormData
      const response = await fetch('https://dolvido-smart-image-insights.hf.space/analyze', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      // Get the response text first for better error debugging
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to analyze image (${response.status}): ${responseText.substring(0, 100)}`);
      }
      
      // Parse the JSON response
      let data: any;
      try {
        data = JSON.parse(responseText) as ApiResponse;
        console.log('API Response Data:', data);
        
        // Check if data has the expected structure
        if (!data.object_detection && !data.image_classification && !data.text_detection) {
          console.warn('API response missing expected fields, transforming data structure...');
          
          // The API might return data in a different structure, try to adapt it
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            // If the response has a results array, use the first item
            const firstResult = data.results[0];
            console.log('Using first item from results array:', firstResult);
            
            // Transform the data structure to match component expectations
            const transformedData: AnalysisResult = {
              object_detection: firstResult.objects && firstResult.objects.length > 0 
                ? firstResult.objects.map((obj: any) => ({
                    class: obj.label || obj.class,
                    confidence: obj.confidence || 0.9
                  })) 
                : [],
              
              image_classification: [
                { label: firstResult.caption || "Unknown", confidence: 0.95 }
              ],
              text_detection: {
                text: firstResult.caption || "No text detected"
              }
            };
            
            console.log('Transformed data:', transformedData);
            data = transformedData;
          } else {
            console.error('Cannot find valid results in the API response');
            throw new Error('Invalid data structure in API response');
          }
        }
        
        console.log('Final processed data:', data);
        
        // Update the specific image with the results
        setImages(prev => prev.map((img, idx) => 
          idx === imageIndex ? { ...img, loading: false, results: data } : img
        ));
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
    } catch (err) {
      console.error('API request error:', err);
      
      const errorMessage = `${err instanceof Error ? err.message : 'Failed to analyze image'} - Using mock data instead`;
      
      // Update with error but use mock data
      setTimeout(() => {
        const mockData = {
          object_detection: [
            { class: "person", confidence: 0.95 },
            { class: "car", confidence: 0.87 },
            { class: "tree", confidence: 0.76 }
          ],
          image_classification: [
            { label: "urban scene", confidence: 0.92 }
          ],
          text_detection: {
            text: "A person standing next to a car with trees in the background"
          }
        };
        
        console.log('Using mock data:', mockData);
        
        setImages(prev => prev.map((img, idx) => 
          idx === imageIndex ? { ...img, loading: false, error: errorMessage, results: mockData } : img
        ));
      }, 1500);
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="w-full max-w-xl h-48 border border-dashed border-gray-500 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors mb-6"
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <p className="text-gray-400">
            Drag and drop images here, or click to select
          </p>
          <p className="text-gray-500 text-sm mt-1">
            You can upload multiple images
          </p>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="w-full max-w-4xl space-y-12">
        {images.map((image) => (
          <div key={image.id} className="relative bg-gray-900/30 rounded-lg p-6 border border-gray-800">
            <button
              onClick={() => removeImage(image.id)}
              className="absolute top-3 right-3 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-full p-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image Preview */}
            <div className="relative w-full rounded-lg overflow-hidden mb-6">
              <img
                src={image.preview}
                alt="Preview"
                className="w-full max-h-96 object-contain"
              />
              {!image.results && (
                <button
                  onClick={() => handleAnalyze(image.id)}
                  disabled={image.loading}
                  className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg
                    hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  {image.loading ? 'Analyzing...' : 'Analyze Image'}
                </button>
              )}
            </div>

            {/* Error */}
            {image.error && (
              <div className="w-full mb-6 bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-800">
                {image.error}
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {image.results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full space-y-6"
                >
                  {/* Object Detection Results */}
                  {image.results.object_detection && (
                    <div className="bg-gray-900/50 rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-semibold mb-4 text-white">Object Detection</h3>
                      {image.results.object_detection.length === 0 ? (
                        <p className="text-gray-400">No objects detected. YOLO model couldn't identify specific items in this image.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {image.results.object_detection.map((obj, index) => (
                            <div
                              key={index}
                              className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border-l-4 border-blue-500"
                            >
                              <span className="font-medium text-gray-200 capitalize">{obj.class}</span>
                              <span className="text-gray-400 bg-gray-700 px-2 py-1 rounded-full text-sm">
                                {(obj.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image Classification Results */}
                  {image.results.image_classification && (
                    <div className="bg-gray-900/50 rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-semibold mb-4 text-white">Image Classification</h3>
                      <div className="space-y-3">
                        {image.results.image_classification.map((pred, index) => (
                          <div key={index} className="w-full">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-gray-200">{pred.label}</span>
                              <span className="text-gray-400 text-sm">{(pred.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${(pred.confidence * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Detection Results */}
                  {image.results.text_detection && (
                    <div className="bg-gray-900/50 rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-semibold mb-4 text-white">Image Description</h3>
                      <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-purple-500">
                        <p className="text-gray-300 italic">
                          "{image.results.text_detection.text}"
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
} 