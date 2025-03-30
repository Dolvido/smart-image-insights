'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import ImageAnalysis from '@/components/ImageAnalysis';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0F1E]">
      <Navbar />
      
      <section className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-4xl text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-white">Smart Image Insights</h1>
          <p className="text-lg text-white/70 mb-4">
            Upload your images and analyze them. Get accurate insights
            with object detection and classification.
          </p>
        </div>
        <ImageAnalysis />
      </section>
    </main>
  );
}
