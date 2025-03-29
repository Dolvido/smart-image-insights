'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUpload({ onImagesSelected, isLoading = false }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.file.size > MAX_FILE_SIZE) {
          return `${file.file.name} is too large. Maximum size is 10MB.`;
        }
        return `${file.file.name} is not a valid image file.`;
      });
      setError(errors.join('\n'));
      return;
    }

    // Clear any previous errors
    setError(null);

    // Create preview URLs
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    onImagesSelected(acceptedFiles);
  }, [onImagesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: true,
    disabled: isLoading,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`mt-8 cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/[0.03] px-6 py-12 text-center transition-colors
          ${isDragActive ? 'border-white/40 bg-white/[0.06]' : ''}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-white/50"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-white/70">
            {isLoading ? (
              <p className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></span>
                Processing...
              </p>
            ) : isDragActive ? (
              <p>Drop the images here ...</p>
            ) : (
              <p>Drag and drop images here, or click to select files</p>
            )}
          </div>
          <p className="text-sm text-white/50">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-900/50"
        >
          {error}
        </motion.div>
      )}

      {previews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
} 