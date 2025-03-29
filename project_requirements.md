### 🔧 Functional Requirements

1. **Image Upload Interface**
   - Users can drag-and-drop or select one or more images for analysis.
   - Real-time image previews should display immediately after upload.

2. **Object Detection Pipeline**
   - Once uploaded, images are processed by a YOLOv5 model.
   - Bounding boxes with labels are rendered over the image (e.g., "car", "person").
   - Detection should be visible on the frontend with interactive toggles (e.g., show/hide labels or boxes).

3. **Scene Description Generation**
   - Run each image through an image captioning model to generate natural language descriptions.
   - Display below the image as a readable text summary.

4. **CLIP-Based Image Embedding + Vector Search**
   - Images are embedded and indexed locally (FAISS or Chroma) on upload.
   - Add a text search bar for users to query (e.g., "people near trees"), returning the most relevant image matches from the session.

5. **LLM Agent for Image Q&A**
   - A text input lets users ask questions like "Are there any vehicles in this image?" or "How many people are visible?"
   - Agent processes the image metadata + model outputs and generates responses using GPT-4 or Claude via LangChain.

6. **Responsive and Minimal UI**
   - Design consistent with your portfolio: clean typography, spacious layout, minimalistic icons, subtle hover effects.
   - All core interactions must be accessible from the single page without reloads.

7. **Exportable Insights (optional)**
   - Provide a button to download a simple JSON or Markdown summary of the image insights, captions, and agent answers.

---

### 🧱 Technical Requirements

- **Frontend**: React.js with Tailwind CSS (matching your portfolio style)
- **Backend**: Python (FastAPI recommended) running:
  - YOLOv5 for detection
  - Image captioning model (e.g., BLIP, or OFA)
  - CLIP for embedding
  - FAISS/Chroma for vector search
  - LangChain orchestrating GPT-4 or Claude via API
- **APIs**:
  - Upload endpoint
  - Object detection
  - Caption generation
  - Vector indexing/search
  - Agent Q&A
- **Hosting/Deployment**:
  - Frontend on Firebase (like your portfolio)
  - Backend can be hosted on Render, Railway, or HuggingFace Spaces

---

### 🧪 Non-Functional Requirements

- **Performance**: Response time < 2s for most image tasks (offload heavier models to backend).
- **Scalability**: For now, local session-based analysis; avoid persistent storage unless you extend it.
- **Security**: Sanitize image uploads; ensure API keys for LLMs are protected.
- **User Experience**: Simple onboarding (no auth), clear loading states, mobile-friendly design.
- **Cost**: Prioritize free-to-use APIs over paid alternatives. (No OpenAI)


