const API_BASE_URL = 'https://dolvido-smart-image-insights.hf.space';

export interface ImageAnalysis {
  id: string;
  imageUrl: string;
  objects: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  caption: string;
}

export interface SearchResult {
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

export interface SearchQuery {
  query: string;
  top_k?: number;
}

export const api = {
  async uploadImage(file: File): Promise<ImageAnalysis> {
    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload image');
    }

    const data = await response.json();
    return data.results[0];
  },

  async searchImages(query: SearchQuery): Promise<SearchResult[]> {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to search images');
    }

    const data = await response.json();
    return data.results;
  },

  async getImage(id: string): Promise<{
    imageUrl: string;
    analysis: {
      objects: Array<{
        label: string;
        confidence: number;
        bbox: [number, number, number, number];
      }>;
      caption: string;
      embedding: number[];
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: id,
        top_k: 1
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get image');
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      throw new Error('Image not found');
    }

    return {
      imageUrl: data.results[0].imageUrl,
      analysis: data.results[0].analysis
    };
  },
}; 