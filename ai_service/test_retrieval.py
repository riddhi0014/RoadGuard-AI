"""
test_retrieval.py

Quick sanity check for the FAISS index built by ingest_guidelines.py.
Given a defect type and a short natural-language query (standing in for
what a real detection description might look like), this:
  1. Filters the index down to only chunks tagged with that defect type
  2. Embeds the query
  3. Finds the closest-matching chunks among the filtered set
  4. Prints them so you can eyeball whether retrieval makes sense

This is NOT part of the FastAPI service — it's a standalone check to run
by hand while building, same folder as ingest_guidelines.py.
"""

import json
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).parent
INDEX_PATH = BASE_DIR / "data" / "index" / "irc_guidelines.faiss"
META_PATH = BASE_DIR / "data" / "index" / "irc_guidelines_meta.json"

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


def load_index_and_meta():
    index = faiss.read_index(str(INDEX_PATH))
    with open(META_PATH) as f:
        meta = json.load(f)
    return index, meta


def retrieve(query: str, defect_type: str, model, index, meta, top_k: int = 3):
    """
    Retrieves the top_k chunks most relevant to `query`, restricted to
    chunks tagged with `defect_type`.

    Implementation note: FAISS's IndexFlatL2 doesn't support filtering
    before search, so this does a full search over everything, then
    discards results whose metadata doesn't match the defect type, and
    keeps searching a wider net until it has top_k matches. Fine for an
    index this size (hundreds of chunks); would need a smarter approach
    (e.g. separate per-defect-type indexes, or a metadata-filtering
    vector DB) if this ever grew to tens of thousands of chunks.
    """
    query_vec = model.encode([query], convert_to_numpy=True).astype("float32")

    # Search generously wide, then filter, since we don't know in advance
    # how many of the top matches will actually belong to this defect type.
    search_k = min(50, index.ntotal)
    distances, indices = index.search(query_vec, search_k)

    matches = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        chunk_meta = meta[idx]
        if defect_type in chunk_meta["defect_types"]:
            matches.append((dist, chunk_meta))
        if len(matches) >= top_k:
            break

    return matches


def print_matches(query, defect_type, matches):
    print(f"\nQuery: \"{query}\"  (defect_type={defect_type})")
    print("-" * 70)
    if not matches:
        print("  No matches found for this defect type. Check DOCUMENT_MAP "
              "tagging or try a different query.")
        return
    for dist, chunk_meta in matches:
        print(f"  [{chunk_meta['irc_code']}] (L2 distance: {dist:.3f})")
        preview = chunk_meta["text"][:200].replace("\n", " ")
        print(f"    {preview}...")
        print()


if __name__ == "__main__":
    print(f"Loading embedding model '{EMBEDDING_MODEL_NAME}'...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    print("Loading FAISS index and metadata...")
    index, meta = load_index_and_meta()
    print(f"Loaded {index.ntotal} chunks total.\n")

    # A handful of test queries standing in for real detection results.
    # Edit these freely to probe other cases.
    test_cases = [
        ("large pothole 300mm deep on bituminous road", "pothole"),
        ("crack sealing procedure for bituminous surface", "crack"),
        ("road submerged during monsoon flooding", "waterlogging"),
        ("open manhole cover missing on urban road", "open_manhole"),
    ]

    for query, defect_type in test_cases:
        matches = retrieve(query, defect_type, model, index, meta, top_k=3)
        print_matches(query, defect_type, matches)