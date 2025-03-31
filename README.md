# Smart Image Insights

A modern web application that analyzes images using AI to provide object detection, image classification, and detailed descriptions.

## Features

- **Multi-Image Upload**: Upload multiple images simultaneously for batch analysis
- **Object Detection**: Identify objects in images using YOLOv5
- **Image Classification**: Get accurate classification of image content 
- **Image Description**: Generate natural language descriptions of image content
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: React Hooks

### Backend
- **API**: FastAPI running on Hugging Face Spaces
- **ML Models**:
  - YOLOv5 for object detection
  - BLIP for image captioning
  - CLIP for semantic image understanding
  - FAISS for vector search

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/smart-image-insights.git
cd smart-image-insights
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file with required environment variables:
```
NEXT_PUBLIC_API_URL=your_huggingface_space_endpoint
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Drag and drop images into the upload area or click to select files
2. Click "Analyze Image" to process each image
3. View the detailed analysis including:
   - Identified objects with confidence scores
   - Image classification with confidence score
   - Natural language description of the image

## Deployment

The frontend is deployed on Vercel, while the backend ML models run on Hugging Face Spaces.

## License

MIT
