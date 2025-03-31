from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import torch
from PIL import Image
import io
import base64
import numpy as np
from transformers import pipeline, AutoFeatureExtractor, AutoProcessor, AutoModel, AutoTokenizer
from sentence_transformers import SentenceTransformer
import faiss
import os
from dotenv import load_dotenv
import uuid
import logging
from functools import lru_cache
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model states
model_states: Dict = {
    "is_initialized": False,
    "object_detector": None,
    "image_captioner": None,
    "clip_model": None,
    "faiss_index": None,
    "initialization_started": False,
    "initialization_errors": []
}

# Store uploaded images and their analysis
uploaded_images = {}

# Model caching decorators
@lru_cache(maxsize=1)
def get_object_detector():
    """Cache the YOLOv5 model"""
    try:
        logger.info("Loading YOLOv5 model...")
        model = torch.hub.load('ultralytics/yolov5', 'yolov5n', pretrained=True)
        model.conf = 0.25  # Lower confidence threshold (default is 0.45)
        model.iou = 0.45   # IOU threshold
        model.eval()  # Set to evaluation mode
        return model
    except Exception as e:
        error_msg = f"Error loading YOLOv5 model: {str(e)}"
        logger.error(error_msg)
        model_states["initialization_errors"].append(error_msg)
        raise

@lru_cache(maxsize=1)
def get_image_captioner():
    """Cache the image captioning model"""
    try:
        logger.info("Loading BLIP model...")
        return pipeline("image-to-text", model="Salesforce/blip-image-captioning-base")
    except Exception as e:
        error_msg = f"Error loading BLIP model: {str(e)}"
        logger.error(error_msg)
        model_states["initialization_errors"].append(error_msg)
        raise

@lru_cache(maxsize=1)
def get_clip_model():
    """Cache the CLIP model"""
    try:
        logger.info("Loading CLIP model...")
        return SentenceTransformer('clip-ViT-B-32')
    except Exception as e:
        error_msg = f"Error loading CLIP model: {str(e)}"
        logger.error(error_msg)
        model_states["initialization_errors"].append(error_msg)
        raise

# Initialize models in background
async def initialize_models(background_tasks: BackgroundTasks):
    if not model_states["initialization_started"]:
        model_states["initialization_started"] = True
        model_states["initialization_errors"] = []
        try:
            logger.info("Starting model initialization...")
            start_time = time.time()
            
            # Initialize models one by one with error handling
            try:
                model_states["object_detector"] = get_object_detector()
                logger.info("YOLOv5 model loaded successfully")
            except Exception as e:
                error_msg = f"Failed to load YOLOv5 model: {str(e)}"
                logger.error(error_msg)
                model_states["initialization_errors"].append(error_msg)
                model_states["object_detector"] = None

            try:
                model_states["image_captioner"] = get_image_captioner()
                logger.info("BLIP model loaded successfully")
            except Exception as e:
                error_msg = f"Failed to load BLIP model: {str(e)}"
                logger.error(error_msg)
                model_states["initialization_errors"].append(error_msg)
                model_states["image_captioner"] = None

            try:
                model_states["clip_model"] = get_clip_model()
                logger.info("CLIP model loaded successfully")
            except Exception as e:
                error_msg = f"Failed to load CLIP model: {str(e)}"
                logger.error(error_msg)
                model_states["initialization_errors"].append(error_msg)
                model_states["clip_model"] = None

            model_states["faiss_index"] = faiss.IndexFlatL2(512)
            model_states["is_initialized"] = True
            
            end_time = time.time()
            logger.info(f"Model initialization completed in {end_time - start_time:.2f} seconds")
        except Exception as e:
            error_msg = f"Error during model initialization: {str(e)}"
            logger.error(error_msg)
            model_states["initialization_errors"].append(error_msg)
            model_states["is_initialized"] = False
            raise HTTPException(status_code=500, detail="Failed to initialize models")

app = FastAPI(title="Smart Image Insights API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageAnalysis(BaseModel):
    objects: List[dict]
    caption: str
    embedding: List[float]

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5

# New endpoint for base64 encoded images
class ImageBase64Request(BaseModel):
    image: str
    filename: str = "image.jpg"

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    background_tasks = BackgroundTasks()
    await initialize_models(background_tasks)

@app.post("/analyze")
async def analyze_images(files: List[UploadFile] = File(...)):
    if not model_states["is_initialized"]:
        error_msg = "Models are still initializing. Please try again in a few moments."
        if model_states["initialization_errors"]:
            error_msg += f" Initialization errors: {', '.join(model_states['initialization_errors'])}"
        raise HTTPException(status_code=503, detail=error_msg)

    try:
        logger.info(f"Received {len(files)} files for analysis")
        results = []
        errors = []

        for file in files:
            try:
                contents = await file.read()
                image = Image.open(io.BytesIO(contents))
                
                # Generate unique ID
                image_id = str(uuid.uuid4())

                # Object detection with error handling
                objects = []
                obj_detection_error = None
                if model_states["object_detector"]:
                    try:
                        results_detection = model_states["object_detector"](image)
                        pred = results_detection.pred[0]
                        names = results_detection.names
                        objects = [
                            {
                                "label": names[int(cls_id)],
                                "confidence": float(conf),
                                "bbox": [float(x) for x in box]
                            }
                            for *box, conf, cls_id in pred
                        ]
                    except Exception as e:
                        obj_detection_error = str(e)
                        logger.error(f"Object detection failed: {obj_detection_error}")
                        objects = []
                else:
                    obj_detection_error = "Object detection model not initialized"

                # Image captioning with error handling
                caption = "Failed to generate caption"
                caption_error = None
                if model_states["image_captioner"]:
                    try:
                        caption_result = model_states["image_captioner"](image)
                        if caption_result and len(caption_result) > 0:
                            caption = caption_result[0]['generated_text']
                        else:
                            caption_error = "Empty caption result"
                    except Exception as e:
                        caption_error = str(e)
                        logger.error(f"Image captioning failed: {caption_error}")
                else:
                    caption_error = "Image captioning model not initialized"

                # Generate embedding
                embedding = []
                embedding_error = None
                if model_states["clip_model"]:
                    try:
                        embedding = model_states["clip_model"].encode(image).tolist()
                        model_states["faiss_index"].add(np.array([embedding], dtype=np.float32))
                    except Exception as e:
                        embedding_error = str(e)
                        logger.error(f"Embedding generation failed: {embedding_error}")
                else:
                    embedding_error = "CLIP model not initialized"

                # Store results
                image_base64 = base64.b64encode(contents).decode('utf-8')
                uploaded_images[image_id] = {
                    "image": image_base64,
                    "analysis": {
                        "objects": objects,
                        "caption": caption,
                        "embedding": embedding
                    }
                }

                results.append({
                    "id": image_id,
                    "imageUrl": f"data:image/jpeg;base64,{image_base64}",
                    "objects": objects,
                    "caption": caption,
                    "errors": {
                        "object_detection": obj_detection_error,
                        "captioning": caption_error,
                        "embedding": embedding_error
                    }
                })

            except Exception as e:
                errors.append(f"Failed to process {file.filename}: {str(e)}")

        return {
            "results": results,
            "errors": errors if errors else None
        }

    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_images(query: SearchQuery):
    if not model_states["is_initialized"]:
        raise HTTPException(status_code=503, detail="Models are still initializing")

    try:
        # Convert query to embedding
        query_embedding = model_states["clip_model"].encode([query.query])
        
        # Search similar images
        D, I = model_states["faiss_index"].search(query_embedding, query.top_k)
        
        # Get results
        results = []
        for idx, (dist, i) in enumerate(zip(D[0], I[0])):
            if i < len(uploaded_images):  # Check if index is valid
                image_id = list(uploaded_images.keys())[i]
                image_data = uploaded_images[image_id]
                results.append({
                    "id": image_id,
                    "similarity": float(1 / (1 + dist)),  # Convert distance to similarity score
                    "imageUrl": f"data:image/jpeg;base64,{image_data['image']}",
                    "analysis": image_data['analysis']
                })
        
        return {"results": results}
        
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint for base64 encoded images
@app.post("/analyze-base64")
async def analyze_base64_image(request: ImageBase64Request):
    if not model_states["is_initialized"]:
        error_msg = "Models are still initializing. Please try again in a few moments."
        if model_states["initialization_errors"]:
            error_msg += f" Initialization errors: {', '.join(model_states['initialization_errors'])}"
        raise HTTPException(status_code=503, detail=error_msg)

    try:
        logger.info(f"Received base64 image for analysis")
        results = []
        errors = []

        try:
            # Decode base64 image
            image_data = base64.b64decode(request.image)
            image = Image.open(io.BytesIO(image_data))
            
            # Generate unique ID
            image_id = str(uuid.uuid4())

            # Object detection with error handling
            objects = []
            obj_detection_error = None
            if model_states["object_detector"]:
                try:
                    results_detection = model_states["object_detector"](image)
                    pred = results_detection.pred[0]
                    names = results_detection.names
                    objects = [
                        {
                            "label": names[int(cls_id)],
                            "confidence": float(conf),
                            "bbox": [float(x) for x in box]
                        }
                        for *box, conf, cls_id in pred
                    ]
                except Exception as e:
                    obj_detection_error = str(e)
                    logger.error(f"Object detection failed: {obj_detection_error}")
                    objects = []
            else:
                obj_detection_error = "Object detection model not initialized"

            # Image captioning with error handling
            caption = "Failed to generate caption"
            caption_error = None
            if model_states["image_captioner"]:
                try:
                    caption_result = model_states["image_captioner"](image)
                    if caption_result and len(caption_result) > 0:
                        caption = caption_result[0]['generated_text']
                    else:
                        caption_error = "Empty caption result"
                except Exception as e:
                    caption_error = str(e)
                    logger.error(f"Image captioning failed: {caption_error}")
            else:
                caption_error = "Image captioning model not initialized"

            # Generate embedding
            embedding = []
            embedding_error = None
            if model_states["clip_model"]:
                try:
                    embedding = model_states["clip_model"].encode(image).tolist()
                    model_states["faiss_index"].add(np.array([embedding], dtype=np.float32))
                except Exception as e:
                    embedding_error = str(e)
                    logger.error(f"Embedding generation failed: {embedding_error}")
            else:
                embedding_error = "CLIP model not initialized"

            # Store results
            image_base64 = request.image
            uploaded_images[image_id] = {
                "image": image_base64,
                "analysis": {
                    "objects": objects,
                    "caption": caption,
                    "embedding": embedding
                }
            }

            results.append({
                "id": image_id,
                "imageUrl": f"data:image/jpeg;base64,{image_base64}",
                "objects": objects,
                "caption": caption,
                "errors": {
                    "object_detection": obj_detection_error,
                    "captioning": caption_error,
                    "embedding": embedding_error
                }
            })

        except Exception as e:
            errors.append(f"Failed to process image: {str(e)}")

        return {
            "results": results,
            "errors": errors if errors else None
        }

    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_initialized": model_states["is_initialized"],
        "initialization_errors": model_states["initialization_errors"] if model_states["initialization_errors"] else None
    } 