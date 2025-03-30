'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageQA } from '@/components/ImageQA';
import { motion } from 'framer-motion';
import ImageAnalysis from '@/components/ImageAnalysis';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://dolvido-smart-image-insights.hf.space';

interface ImageAnalysis {
  id: string;
  imageUrl: string;
  objects: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  caption: string;
}

interface SearchResult {
  id: string;
  imageUrl: string;
  similarity: number;
  analysis: {
    objects: Array<{
      label: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
    caption: string;
    embedding: number[];
  };
}

export default function Home() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleImagesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to analyze images');
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No images were successfully processed');
      }

      setAnalyses(prev => [...prev, ...data.results]);

      if (data.errors) {
        setError(`Some images had errors:\n${data.errors.join('\n')}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          top_k: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0F1E]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <a href="https://lukepayne.web.app" className="text-xl font-medium text-white">Portfolio</a>
        <div className="flex gap-8">
          <a href="https://lukepayne.web.app/projects" className="text-[15px] text-white/70 hover:text-white">Projects</a>
          <a href="https://lukepayne.web.app/about" className="text-[15px] text-white/70 hover:text-white">About</a>
          <a href="https://lukepayne.web.app/contact" className="text-[15px] text-white/70 hover:text-white">Contact</a>
        </div>
      </nav>

      <main className="flex flex-1 flex-col items-center px-4 py-16">
        <div className="w-full max-w-[800px] space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-semibold text-white">Smart Image Insights</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Upload your images and get AI-powered analysis. Get accurate insights with object detection,
              scene descriptions, and visual understanding.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {['Next.js', 'TypeScript', 'YOLOv5', 'CLIP', 'Computer Vision'].map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="bg-white/[0.03] rounded-lg p-6 border border-white/10">
            <ImageAnalysis />
          </div>

          <ImageUpload onImagesSelected={handleImagesSelected} isLoading={isProcessing} />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-900/50"
            >
              {error}
            </motion.div>
          )}

          {analyses.length > 0 && (
            <div className="space-y-8">
              {analyses.map((analysis) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.03] rounded-lg p-6 border border-white/10"
                >
                  <div className="relative aspect-video mb-4">
                    <img
                      src={analysis.imageUrl}
                      alt="Analyzed image"
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Detected Objects</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.objects.map((obj, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-full text-sm border border-blue-500/20"
                        >
                          {obj.label} ({Math.round(obj.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Scene Description</h3>
                      <p className="text-white/70">{analysis.caption}</p>
                    </div>
                    <ImageQA imageId={analysis.id} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {analyses.length > 0 && (
            <div className="mt-8">
              <form onSubmit={handleSearch} className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search images (e.g., 'people near trees')"
                  className="flex-1 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/[0.03] rounded-lg overflow-hidden border border-white/10"
                    >
                      <img
                        src={result.imageUrl}
                        alt={result.analysis.caption}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-4">
                        <p className="text-sm text-white/70">{result.analysis.caption}</p>
                        <p className="text-xs text-white/50 mt-2">
                          Similarity: {Math.round(result.similarity * 100)}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
