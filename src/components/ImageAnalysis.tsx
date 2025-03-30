'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisResult {
  id: string;
  imageUrl: string;
  objects: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  caption: string;
}

export default function ImageAnalysis() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiAttempted, setApiAttempted] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  const handleAnalyze = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      try {
        // Create FormData and append the file
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/direct-api', {
          method: 'POST',
          body: formData,
        });

        // Get the raw response text first
        const responseText = await response.text();
        
        // Try to parse the response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}...`);
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${data.error || 'Unknown error'}`);
        }

        if (!data.results || data.results.length === 0) {
          throw new Error('No analysis results received');
        }

        // Check if this is a mock response
        if (response.ok && data.mock === true) {
          setUsingMockData(true);
        }

        setResults(data.results[0]);
      } catch (apiError) {
        setApiAttempted(true);
        setUsingMockData(true);
        
        // Use client-side mock data as fallback
        setTimeout(() => {
          setResults({
            id: '1',
            imageUrl: preview,
            objects: [
              { label: 'Person', confidence: 0.95, bbox: [0, 0, 100, 100] },
              { label: 'Building', confidence: 0.85, bbox: [100, 100, 200, 200] },
              { label: 'Tree', confidence: 0.78, bbox: [300, 150, 350, 250] },
            ],
            caption: 'A person standing in front of a building with trees nearby',
          });
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleAnalyze(acceptedFiles[0]);
      }
    }
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the image here...'
                : 'Drag and drop an image here, or click to select'}
            </p>
          </div>
        )}
      </div>

      {usingMockData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-yellow-50 text-yellow-600 rounded-lg"
        >
          Note: Using demonstration data for image analysis.
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-64 mx-auto rounded-lg shadow-lg"
          />
        </motion.div>
      )}

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 space-y-4"
          >
            {/* Object Detection Results */}
            {results.objects && results.objects.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Detected Objects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.objects.map((obj, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"
                    >
                      <span className="font-medium">{obj.label}</span>
                      <span className="text-gray-600">
                        {(obj.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Caption */}
            {results.caption && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Scene Description</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600">{results.caption}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 