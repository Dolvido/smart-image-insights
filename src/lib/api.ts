const API_BASE_URL = 'http://localhost:8000/api';

export interface ImageAnalysis {
  id: string;
  objects: Array<{
    label: string;
    confidence: number;
    box: [number, number, number, number];
  }>;
  caption: string;
}

export interface SearchResult {
  id: string;
  image: string;
  caption: string;
  similarity: number;
}

export interface SearchQuery {
  query: string;
  top_k?: number;
}

export const api = {
  async uploadImage(file: File): Promise<ImageAnalysis> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return response.json();
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
      throw new Error('Failed to search images');
    }

    return response.json();
  },

  async getImage(id: string): Promise<{
    image: string;
    analysis: {
      objects: Array<{
        label: string;
        confidence: number;
        box: [number, number, number, number];
      }>;
      caption: string;
      embedding: number[];
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/image/${id}`);

    if (!response.ok) {
      throw new Error('Failed to get image');
    }

    return response.json();
  },
}; 