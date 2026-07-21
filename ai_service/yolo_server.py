"""
yolo_server.py

Standalone process handling ALL local model inference (YOLO + embedding
model + FAISS retrieval). Runs separately from the main app (different
port) because running these models in-process inside the main app's
FastAPI request handling reliably segfaults on this machine, regardless
of thread type (sync worker thread or async) or device (cpu or mps).
Isolating them into a separate process, started independently, is the
one fix that has actually worked. The main app calls this service over
HTTP for both detection and retrieval, and talks to Gemini directly
(a remote API call, no local tensor math, safe in the main process).

Run with: python -m uvicorn yolo_server:app --port 8001
"""

import json

from fastapi import FastAPI
from ultralytics import YOLO
import faiss
from sentence_transformers import SentenceTransformer

app = FastAPI()

_yolo_model = YOLO("yolo_model/best.pt")
_embedding_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
_faiss_index = faiss.read_index("data/index/irc_guidelines.faiss")
with open("data/index/irc_guidelines_meta.json") as f:
    _meta = json.load(f)

CLASS_NAMES = ["pothole", "crack", "open_manhole"]


@app.post("/predict")
def predict(image_path: str, conf: float = 0.25):
    results = _yolo_model.predict(source=image_path, conf=conf, device="cpu", verbose=False)
    result = results[0]
    img_h, img_w = result.orig_shape

    detections = []
    for box in result.boxes:
        class_id = int(box.cls[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append({
            "defect_type": CLASS_NAMES[class_id],
            "confidence": float(box.conf[0]),
            "bbox_pixels": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            "image_dims": {"width": img_w, "height": img_h},
        })
    return detections


@app.post("/retrieve")
def retrieve(query: str, defect_type: str, top_k: int = 4):
    query_vec = _embedding_model.encode([query], convert_to_numpy=True).astype("float32")
    search_k = min(50, _faiss_index.ntotal)
    distances, indices = _faiss_index.search(query_vec, search_k)

    matches = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        chunk_meta = _meta[idx]
        if defect_type in chunk_meta["defect_types"]:
            matches.append(chunk_meta)
        if len(matches) >= top_k:
            break
    return matches