'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisResult {
  id: string;
  objects: Array<{
    label: string;
    confidence: number;
  }>;
  caption: string;
}

export default function ImageAnalysisTest() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Create FormData and append the file
      const formData = new FormData();
      formData.append('files', file);

      console.log('Sending request to mock API...');
      const response = await fetch('/api/mock-analyze', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      // Get the raw response text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed API response:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${data.error || 'Unknown error'}`);
      }

      setResults(data.results[0]);
    } catch (err) {
      console.error('Error analyzing image:', err);
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
      <h2 className="text-2xl font-bold mb-4 text-center">Test Image Upload</h2>
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