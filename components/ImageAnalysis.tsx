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

export default function ImageAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  });

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        const imageData = base64Image.split(',')[1];

        // Send request directly to Hugging Face Space API
        const response = await fetch('https://dolvido-smart-image-insights.hf.space/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageData,
            analysis_type: 'all'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze image');
        }

        const data = await response.json();
        setResults(data);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Simple dropzone with dotted border */}
      {!preview && (
        <div
          {...getRootProps()}
          className="w-full max-w-xl h-48 border border-dashed border-gray-500 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <input {...getInputProps()} />
          <p className="text-gray-400 text-center">
            Drag and drop an image here, or click to select
          </p>
        </div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full max-w-4xl rounded-lg overflow-hidden"
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="w-full max-w-4xl mt-6 bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl mt-6 space-y-6"
          >
            {/* Object Detection Results */}
            {results.object_detection && (
              <div className="bg-gray-900/50 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Object Detection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.object_detection.map((obj, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-200">{obj.class}</span>
                      <span className="text-gray-400">
                        {(obj.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Classification Results */}
            {results.image_classification && (
              <div className="bg-gray-900/50 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Image Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.image_classification.map((pred, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-200">{pred.label}</span>
                      <span className="text-gray-400">
                        {(pred.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Detection Results */}
            {results.text_detection && (
              <div className="bg-gray-900/50 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Text Detection</h3>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <span className="font-medium text-gray-200">Detected Text:</span>
                  <span className="text-gray-400 ml-2">
                    {results.text_detection.text}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 