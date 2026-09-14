'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { requestImageAnalysis, type AnalysisResult } from '@/lib/analysis-response';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dolvido-smart-image-insights.hf.space';

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
    const image = images.find(item => item.id === imageId);
    if (!image) return;

    setImages(prev => prev.map(item =>
      item.id === imageId ? { ...item, loading: true, error: null, results: null } : item
    ));

    try {
      const formData = new FormData();
      formData.append('files', image.file);
      const results = await requestImageAnalysis(formData, API_BASE_URL);

      // Match by stable ID so removing another upload cannot redirect this result.
      setImages(prev => prev.map(item =>
        item.id === imageId ? { ...item, loading: false, error: null, results } : item
      ));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Image analysis failed. Please try again.';
      // A failed request leaves no result and keeps the Analyze button available for retry.
      setImages(prev => prev.map(item =>
        item.id === imageId ? { ...item, loading: false, error, results: null } : item
      ));
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
              <div role="alert" className="w-full mb-6 bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-800">
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
                  {image.results.objects && (
                    <div className="bg-gray-900/50 rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-semibold mb-4 text-white">Object Detection</h3>
                      {image.results.objects.length === 0 ? (
                        <p className="text-gray-400">No objects were returned by the detector.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {image.results.objects.map((obj, index) => (
                            <div
                              key={index}
                              className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border-l-4 border-blue-500"
                            >
                              <span className="font-medium text-gray-200 capitalize">{obj.label}</span>
                              <span className="text-gray-400 bg-gray-700 px-2 py-1 rounded-full text-sm">
                                {obj.confidence === undefined ? 'Score unavailable' : `${(obj.confidence * 100).toFixed(0)}%`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Model-generated caption; no classification confidence is supplied. */}
                  {image.results.caption && (
                    <div className="bg-gray-900/50 rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-semibold mb-4 text-white">Image Description</h3>
                      <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-purple-500">
                        <p className="text-gray-300 italic">
                          {image.results.caption}
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