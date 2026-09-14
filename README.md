# Smart Image Insights

An image-analysis prototype with a Next.js upload interface and a Python/FastAPI inference service. The main page displays detected objects and a generated caption for each submitted image.

## What the current application does

- Accepts multiple PNG, JPEG, or GIF uploads and analyzes each image on request.
- Sends each upload directly from the browser to the configured FastAPI `/analyze` endpoint.
- Displays object labels and confidence scores supplied by the detector. A missing score stays unavailable.
- Displays the generated caption as an image description. Captions are not image classifications and have no classification confidence score.
- Shows an error and allows retry when the request or a backend model fails. It does not substitute sample detections for failed inference.

Model outputs may be incorrect. This project does not include an accuracy benchmark or a production-readiness claim.

## Implementation

| Part | Current implementation |
| --- | --- |
| Frontend | Next.js 14.1.0, React 18.2, TypeScript, Tailwind CSS, Framer Motion |
| Primary backend | `huggingface_space/app.py`: FastAPI, YOLOv5n detection, BLIP captioning, CLIP embeddings, FAISS search |
| Earlier backend variant | `backend/main.py`: YOLOv5s, ViT-GPT2 captioning, CLIP/FAISS, plus a Hugging Face text-model Q&A endpoint |
| Main page | Upload, detection labels/scores, and captions |
| Supporting backend endpoints | `/search`, `/analyze-base64`, and `/health`; these are not all exposed by the main page |

The primary backend keeps images and its search index in process memory. Restarting it loses that state. The earlier backend is a separate implementation, not an interchangeable deployment of the primary one.

## Local setup

Use Node.js 22 LTS and npm for the frontend. The checked-in backend Dockerfile uses Python 3.9; the dependency pins are historical and have not been upgraded here.

```bash
git clone https://github.com/Dolvido/smart-image-insights.git
cd smart-image-insights
npm ci
```

Create `.env.local` in the repository root:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:7860
```

This value is the backend base URL, without `/analyze`. Restart the frontend after changing it. If unset, the main page uses the original Hugging Face Space address; that deployment's availability is not guaranteed.

In a separate terminal, start the primary backend:

```bash
cd huggingface_space
python -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 7860
```

The backend downloads model files and YOLO source on initialization, so it needs network access, disk space, and enough memory for the models. Inspect `http://localhost:7860/health` for initialization errors before uploading an image. A health response alone does not prove every model loaded successfully.

Then run the frontend from the repository root:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). For a deployment, configure the backend URL and appropriate backend CORS origins. Images are sent to that backend for processing.

## Focused validation

The response checks use the Node.js test runner and built-in TypeScript stripping (Node.js 22.6+):

```bash
node --experimental-strip-types --test scripts/analysis-response.test.mjs
```

They cover real and absent detection scores, invalid responses, backend model errors, HTTP/network failures, and the configured upload URL. They do not run ML inference or validate model accuracy. A complete frontend build and backend inference should be checked in the target environment before deployment.

## Development routes and limitations

- `src/app/api/analyze/route.ts` was an unused mock route. It now returns HTTP 410 with an explanatory error; the main UI uses the FastAPI service directly.
- `/api/mock-analyze` is an explicit demo fixture marked `mock: true`. It does not inspect an image and is rejected by the main response parser.
- `/test` and the other API adapters are development experiments, separate from the main upload flow.
- The backend has no persistent image storage, authentication, or upload quotas. Its model-initialization and search-index behavior still need broader integration testing.
- This cleanup does not upgrade the pinned framework/model dependencies or verify the existing hosted deployments.
