---
title: Smart Image Insights API
emoji: 🔍
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
---

# Smart Image Insights API

This Space hosts the backend API for Smart Image Insights, a powerful image analysis tool.

## Features
- Object detection using YOLOv5n
- Image captioning using BLIP
- Semantic image search using CLIP
- Vector similarity search using FAISS

## API Documentation

### Endpoints

1. `POST /analyze`
   - Upload images for analysis
   - Returns object detection, captions, and embeddings

2. `POST /search`
   - Search through analyzed images using natural language
   - Returns similar images with similarity scores

3. `GET /health`
   - Check API health and model initialization status

## Technical Details

- FastAPI backend running in Docker
- Models are downloaded and cached on first use
- Optimized for CPU inference
- Port: 7860 (Hugging Face Spaces default)

## Environment

- Python 3.9
- FastAPI
- PyTorch
- Docker

## Deployment

This Space is automatically deployed using Docker on Hugging Face Spaces infrastructure. 