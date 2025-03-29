from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import torch
from PIL import Image
import io
import base64
import numpy as np
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import faiss
import os
from dotenv import load_dotenv
from langchain_community.llms import HuggingFaceHub
from langchain.prompts import PromptTemplate
import uuid
from contextlib import asynccontextmanager
import logging
from mangum import Mangum

# Load environment variables
load_dotenv()

# Store uploaded images and their analysis
uploaded_images = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize ML models
    global object_detector, image_captioner, clip_model, faiss_index, llm
    
    # Initialize YOLOv5 for object detection
    object_detector = torch.hub.load('ultralytics/yolov5', 'yolov5s')
    
    # Initialize image captioning model
    image_captioner = pipeline("image-to-text", model="nlpconnect/vit-gpt2-image-captioning")
    
    # Initialize CLIP for image embeddings
    clip_model = SentenceTransformer('clip-ViT-B-32')
    
    # Initialize FAISS index for vector search
    faiss_index = faiss.IndexFlatL2(512)  # CLIP embedding dimension
    
    # Initialize LLM for Q&A
    llm = HuggingFaceHub(
        repo_id="mistralai/Mistral-7B-Instruct-v0.2",
        model_kwargs={"temperature": 0.1},
        huggingfacehub_api_token=os.getenv("HUGGINGFACE_API_TOKEN")
    )
    
    yield
    
    # Cleanup
    del object_detector
    del image_captioner
    del clip_model
    del faiss_index
    del llm

# Configure CORS with more permissive settings for development
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app = FastAPI(title="Smart Image Insights API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageAnalysis(BaseModel):
    objects: List[dict]
    caption: str
    embedding: List[float]

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5

class QuestionQuery(BaseModel):
    image_id: str
    question: str

@app.post("/analyze")
async def analyze_images(files: List[UploadFile] = File(...)):
    try:
        logger.info(f"Received {len(files)} files for analysis")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files were uploaded")
            
        results = []
        errors = []
        
        for file in files:
            try:
                # Read and validate image
                contents = await file.read()
                logger.info(f"Processing file: {file.filename}")
                
                try:
                    image = Image.open(io.BytesIO(contents))
                    if image.format and image.format.upper() not in ['PNG', 'JPEG', 'JPG', 'GIF']:
                        raise ValueError(f"Unsupported image format: {image.format}")
                except Exception as e:
                    logger.error(f"Failed to open image {file.filename}: {str(e)}")
                    errors.append(f"Failed to process {file.filename}: {str(e)}")
                    continue
                    
                # Generate unique ID for the image
                image_id = str(uuid.uuid4())
                
                try:
                    # Perform object detection
                    results_detection = object_detector(image)
                    pred = results_detection.pred[0]  # Get predictions for first image
                    names = results_detection.names
                    
                    objects = []
                    if len(pred) > 0:  # If there are any detections
                        for *box, conf, cls_id in pred:  # Each prediction has box coords, confidence, and class ID
                            objects.append({
                                "label": names[int(cls_id)],
                                "confidence": float(conf),
                                "bbox": [float(x) for x in box]
                            })
                    
                    logger.info(f"Detected {len(objects)} objects in {file.filename}")
                    
                    # Generate image caption
                    caption = image_captioner(image)[0]['generated_text']
                    logger.info(f"Generated caption for {file.filename}")
                    
                    # Generate CLIP embedding
                    embedding = clip_model.encode(image).tolist()
                    logger.info(f"Generated embedding for {file.filename}")
                    
                    # Store results
                    uploaded_images[image_id] = {
                        "image": base64.b64encode(contents).decode('utf-8'),
                        "analysis": {
                            "objects": objects,
                            "caption": caption,
                            "embedding": embedding
                        }
                    }
                    
                    # Add embedding to FAISS index
                    faiss_index.add(np.array([embedding], dtype=np.float32))
                    
                    results.append({
                        "id": image_id,
                        "imageUrl": f"data:image/jpeg;base64,{base64.b64encode(contents).decode('utf-8')}",
                        "objects": objects,
                        "caption": caption
                    })
                    logger.info(f"Successfully processed {file.filename}")
                except Exception as e:
                    logger.error(f"Error processing {file.filename}: {str(e)}")
                    errors.append(f"Failed to analyze {file.filename}: {str(e)}")
                    continue
                
            except Exception as e:
                logger.error(f"Unexpected error processing {file.filename}: {str(e)}")
                errors.append(f"Unexpected error with {file.filename}: {str(e)}")
                continue
        
        if not results and errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "No images were successfully processed",
                    "errors": errors
                }
            )
            
        return {
            "results": results,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_images(query: SearchQuery):
    try:
        # Generate query embedding
        query_embedding = clip_model.encode(query.query)
        
        # Search in FAISS index
        distances, indices = faiss_index.search(
            np.array([query_embedding], dtype=np.float32),
            query.top_k
        )
        
        # Get results
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(uploaded_images):
                image_id = list(uploaded_images.keys())[idx]
                results.append({
                    "id": image_id,
                    "image": uploaded_images[image_id]["image"],
                    "caption": uploaded_images[image_id]["analysis"]["caption"],
                    "similarity": float(1 / (1 + distance))
                })
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(query: QuestionQuery):
    try:
        if query.image_id not in uploaded_images:
            raise HTTPException(status_code=404, detail="Image not found")
            
        image_data = uploaded_images[query.image_id]
        
        # Create context from image analysis
        context = f"""
        Image Caption: {image_data['analysis']['caption']}
        Detected Objects: {', '.join([obj['label'] for obj in image_data['analysis']['objects']])}
        """
        
        # Create prompt template
        prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""Based on the following image analysis:
{context}

Please answer this question: {question}

Answer:"""
        )
        
        # Generate prompt and get response
        prompt = prompt_template.format(context=context, question=query.question)
        response = llm(prompt)
        
        # Clean up the response to remove any prompt template text
        cleaned_response = response.split("Answer:")[-1].strip()
        
        return {"answer": cleaned_response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/image/{image_id}")
async def get_image(image_id: str):
    if image_id not in uploaded_images:
        raise HTTPException(status_code=404, detail="Image not found")
    return uploaded_images[image_id]

# Add this at the end of the file
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 