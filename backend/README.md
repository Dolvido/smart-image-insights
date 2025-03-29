# Smart Image Insights Backend

This is the backend service for the Smart Image Insights application, providing AI-powered image analysis capabilities.

## Features

- Object Detection using YOLOv5
- Image Captioning using ViT-GPT2
- CLIP-based Image Embedding and Search
- Vector Search using FAISS
- RESTful API endpoints

## Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file (optional, for future environment variables):
```bash
touch .env
```

4. Run the development server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

### Endpoints

#### POST /api/upload
Upload an image for analysis.

**Request:**
- Content-Type: multipart/form-data
- Body: image file

**Response:**
```json
{
    "id": "string",
    "objects": [
        {
            "label": "string",
            "confidence": float,
            "box": [float, float, float, float]
        }
    ],
    "caption": "string"
}
```

#### POST /api/search
Search for images using natural language queries.

**Request:**
```json
{
    "query": "string",
    "top_k": int
}
```

**Response:**
```json
[
    {
        "id": "string",
        "image": "base64_string",
        "caption": "string",
        "similarity": float
    }
]
```

#### GET /api/image/{image_id}
Get image details and analysis by ID.

**Response:**
```json
{
    "image": "base64_string",
    "analysis": {
        "objects": [...],
        "caption": "string",
        "embedding": [...]
    }
}
```

## Development

The backend uses FastAPI for the API framework and includes several ML models:
- YOLOv5 for object detection
- ViT-GPT2 for image captioning
- CLIP for image embeddings
- FAISS for vector search

Models are loaded on startup and kept in memory for faster inference.

## Notes

- The backend stores images and their analysis in memory. For production, consider using a database and object storage.
- The FAISS index is also kept in memory. For larger datasets, consider using a persistent index.
- CORS is configured to allow requests from `http://localhost:3000` (frontend development server). 