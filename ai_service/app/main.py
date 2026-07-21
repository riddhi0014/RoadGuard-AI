"""
app/main.py

FastAPI app entry point.

Run with (from the ai_service folder, venv active):
    uvicorn app.main:app --reload --port 8000

The --reload flag auto-restarts the server on code changes, useful while
developing. Drop it for anything resembling production use later.
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import faulthandler
faulthandler.enable()
import logging

from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.routers import analysis
from app.services import rag_service

from app.services import yolo_service
from app.routers import detect

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load the embedding model + FAISS index ONCE, not per-request.
    # This is what makes real requests fast (~1-2s for a Gemini call) instead
    # of slow (~10s+ reloading the embedding model every single time).
    logger.info("Starting up RoadGuard AI service...")
    rag_service.load_resources()
    yolo_service.load_resources()
    yield
    # Shutdown: nothing to clean up yet, but this is where it'd go.
    logger.info("Shutting down RoadGuard AI service...")


app = FastAPI(
    title="RoadGuard AI Service",
    description="AI microservice for road defect analysis: RAG-grounded report generation (YOLO/OpenCV to follow).",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(analysis.router)
app.include_router(detect.router)

@app.get("/health")
def health_check():
    """Basic liveness check — does NOT verify the RAG resources are loaded.
    Useful for Node or a deploy platform to confirm the process is up."""
    return {"status": "ok"}
