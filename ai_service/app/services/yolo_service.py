"""
app/services/yolo_service.py

Calls the separate yolo_server.py process (running on its own port)
over HTTP, rather than running YOLO in-process. Running YOLO directly
inside this app's request handling reliably segfaults on this machine
(ultralytics' internal model-fusing code conflicting with FastAPI's
threaded request handling) — isolating it into a fully separate
process with its own main thread avoids the issue entirely.

Requires yolo_server.py to be running separately:
    python -m uvicorn yolo_server:app --port 8001
"""

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

YOLO_SERVICE_URL = "http://localhost:8001/predict"


def load_resources() -> None:
    """No in-process loading — model runs in the separate yolo_server.py
    process. Kept for interface parity with rag_service.py."""
    logger.info(f"YOLO service expected at {YOLO_SERVICE_URL} (run yolo_server.py separately).")


def detect_defects(image_path: str, conf_threshold: float = 0.25) -> list[dict]:
    try:
        response = httpx.post(
            YOLO_SERVICE_URL,
            params={"image_path": image_path, "conf": conf_threshold},
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.ConnectError:
        raise RuntimeError(
            "Could not reach YOLO service. Is it running? "
            "Start it with: python -m uvicorn yolo_server:app --port 8001"
        )
    except httpx.HTTPStatusError as e:
        raise RuntimeError(f"YOLO service returned an error: {e.response.text}")