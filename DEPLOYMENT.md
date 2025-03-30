# Deployment Guide

## 1. Deploy Backend to Hugging Face Spaces

1. Go to [Hugging Face](https://huggingface.co) and sign in
2. Click "New Space"
3. Fill in the details:
   - Owner: Your username
   - Space name: smart-image-insights
   - SDK: FastAPI
   - Hardware: CPU

4. Clone and push the backend:
```bash
cd huggingface_space
git init
git add .
git commit -m "Initial commit"
git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/smart-image-insights
git push -u origin main
```

## 2. Update Frontend Configuration

1. Create a `.env.local` file in your frontend directory:
```
NEXT_PUBLIC_API_URL=https://YOUR_USERNAME-smart-image-insights.hf.space
```

2. Update CORS in backend (already done in app.py):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 3. Deploy Frontend to Vercel

1. Push your frontend code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - NEXT_PUBLIC_API_URL=https://YOUR_USERNAME-smart-image-insights.hf.space
5. Deploy

## 4. Testing

1. Wait for both deployments to complete
2. Test the health endpoint: `https://YOUR_USERNAME-smart-image-insights.hf.space/health`
3. Test image upload from your frontend
4. Test image search functionality

## Notes

- The first request might be slow due to model loading
- Models are cached after first use
- Free tier limitations apply:
  - 150 requests/minute
  - 60-second timeout
  - CPU-only execution 