"""
ingest_guidelines.py

Reads the 4 IRC guideline PDFs, splits each into overlapping text chunks,
tags every chunk with the DefectType(s) it's relevant to, embeds the chunks
with a local sentence-transformer model, and builds a FAISS index for
retrieval later.

Run this ONCE (or whenever the source PDFs change) to (re)build the index.
It is a standalone script, separate from the FastAPI app that will run
day-to-day.

USAGE:
    1. Put your 4 PDFs in ./data/guidelines/ using the exact filenames below.
    2. python ingest_guidelines.py
    3. This produces two files in ./data/index/:
         - irc_guidelines.faiss   (the vector index)
         - irc_guidelines_meta.json (chunk text + metadata, same order as index)
"""

import json
import os
from pathlib import Path

import faiss
import fitz  # PyMuPDF
import numpy as np
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# 1. Map each source PDF to the DefectType(s) it grounds.
#    This is the mechanism that keeps retrieval scoped later: a "pothole"
#    detection will only ever search chunks tagged with "pothole".
# ---------------------------------------------------------------------------
DOCUMENT_MAP = {
    "irc.gov.in.082.2015.pdf": {
        "irc_code": "IRC:82-2015",
        "title": "Code of Practice for Maintenance of Bituminous Road Surfaces",
        "defect_types": ["pothole", "crack"],
    },
    "irc.gov.in.116.2014.pdf": {
        "irc_code": "IRC:116-2014",
        "title": "Specifications for Readymade Bituminous Pothole Patching Mix",
        "defect_types": ["pothole"],
    },
    "irc.gov.in.034.2011.pdf": {
        "irc_code": "IRC:34-2011",
        "title": "Recommendations for Road Construction in Areas Affected by Water Logging, Flooding and/or Salts Infestation",
        "defect_types": ["waterlogging"],
    },
    "irc.gov.in.sp.050.2013.pdf": {
        "irc_code": "IRC:SP:50-2013",
        "title": "Guidelines on Urban Drainage",
        "defect_types": ["open_manhole", "waterlogging"],
    },
    # NOTE: irc.gov.in.sp.083.2018.pdf (concrete pavement) is intentionally
    # NOT included here — it doesn't map to any current DefectType.
    # See project notes for why it's parked, not deleted.
}

CHUNK_SIZE_WORDS = 220     # ~ a few sentences to a short paragraph
CHUNK_OVERLAP_WORDS = 40   # keeps context from being cut mid-idea

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"  # small, fast, runs on CPU, free

BASE_DIR = Path(__file__).parent
PDF_DIR = BASE_DIR / "data" / "guidelines"
INDEX_DIR = BASE_DIR / "data" / "index"
INDEX_PATH = INDEX_DIR / "irc_guidelines.faiss"
META_PATH = INDEX_DIR / "irc_guidelines_meta.json"


def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Pulls all text out of a PDF, page by page, joined with newlines.

    Uses PyMuPDF (fitz) rather than pypdf. PyMuPDF reconstructs word
    boundaries from each character's actual (x, y) position on the page,
    which handles older/scanned-then-digitized government PDFs (like the
    IRC documents here) far more reliably than pypdf's stream-order
    extraction — those often lack explicit space characters between words,
    which caused pypdf to glue whole sentences into single "words" and
    silently produce far too few chunks.
    """
    doc = fitz.open(str(pdf_path))
    pages_text = []
    for page in doc:
        text = page.get_text("text") or ""
        pages_text.append(text)
    doc.close()
    return "\n".join(pages_text)


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """
    Simple word-based sliding-window chunker.
    Not fancy (no sentence-boundary awareness), but predictable and good
    enough for a first working RAG pipeline. Can upgrade later if retrieval
    quality needs it.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunk = " ".join(chunk_words).strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(words):
            break
        start = end - overlap  # step forward, but overlap with previous chunk
    return chunks


def build_index():
    if not PDF_DIR.exists():
        raise FileNotFoundError(
            f"Expected PDFs in {PDF_DIR} — create that folder and put the "
            f"4 IRC PDFs there first."
        )

    print(f"Loading embedding model '{EMBEDDING_MODEL_NAME}'...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    all_chunks_meta = []  # parallel list to the vectors we'll embed

    for filename, doc_info in DOCUMENT_MAP.items():
        pdf_path = PDF_DIR / filename
        if not pdf_path.exists():
            print(f"  [SKIP] {filename} not found in {PDF_DIR} — skipping.")
            continue

        print(f"  Reading {filename} ({doc_info['irc_code']})...")
        text = extract_text_from_pdf(pdf_path)
        chunks = chunk_text(text, CHUNK_SIZE_WORDS, CHUNK_OVERLAP_WORDS)
        print(f"    -> {len(chunks)} chunks")

        for i, chunk in enumerate(chunks):
            all_chunks_meta.append({
                "text": chunk,
                "source_file": filename,
                "irc_code": doc_info["irc_code"],
                "irc_title": doc_info["title"],
                "defect_types": doc_info["defect_types"],
                "chunk_index": i,
            })

    if not all_chunks_meta:
        raise RuntimeError(
            "No chunks were produced. Did you put the PDFs in "
            f"{PDF_DIR}? Check the filenames match DOCUMENT_MAP exactly."
        )

    print(f"\nEmbedding {len(all_chunks_meta)} total chunks...")
    texts = [c["text"] for c in all_chunks_meta]
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    embeddings = embeddings.astype("float32")

    print("Building FAISS index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_PATH))

    with open(META_PATH, "w") as f:
        json.dump(all_chunks_meta, f, indent=2)

    print(f"\nDone. Index saved to {INDEX_PATH}")
    print(f"Metadata saved to {META_PATH}")
    print(f"Total vectors in index: {index.ntotal}")


if __name__ == "__main__":
    build_index()