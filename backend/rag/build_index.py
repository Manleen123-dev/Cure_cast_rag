from __future__ import annotations

import json
import os

import faiss
import numpy as np

from sentence_transformers import SentenceTransformer


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "data"
)

CHUNKS_FILE = os.path.join(
    DATA_DIR,
    "chunks.json"
)

INDEX_FILE = os.path.join(
    DATA_DIR,
    "faiss_index.bin"
)

META_FILE = os.path.join(
    DATA_DIR,
    "metadata.json"
)

MODEL_DIR = os.path.join(
    DATA_DIR,
    "embedding_model"
)


# ============================================================
# MODEL
# ============================================================

EMBED_MODEL = "all-MiniLM-L6-v2"


# ============================================================
# BUILD
# ============================================================

def build():

    print("\n============================================")
    print("CureCast FAISS Index Builder")
    print("============================================")


    # --------------------------------------------------------
    # Load chunks
    # --------------------------------------------------------

    if not os.path.exists(CHUNKS_FILE):
        raise FileNotFoundError(
            f"\nchunks.json not found:\n{CHUNKS_FILE}\n\n"
            "Run ingest.py first."
        )


    with open(
        CHUNKS_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        chunks = json.load(file)


    if not chunks:
        raise ValueError(
            "chunks.json is empty."
        )


    print(
        f"Loaded {len(chunks)} chunks."
    )


    # --------------------------------------------------------
    # Validate placeholders
    # --------------------------------------------------------

    placeholder_found = False

    for chunk in chunks:

        text = chunk.get(
            "text",
            ""
        ).lower()

        if (
            "placeholder symptom 1" in text
            or
            "placeholder symptom 2" in text
        ):

            placeholder_found = True

            print(
                "[ERROR] Placeholder found in:",
                chunk.get("source")
            )


    if placeholder_found:

        raise ValueError(
            "\nThe RAG documents still contain "
            "placeholder symptoms.\n"
            "Fix generate_docs.py and regenerate "
            "the medical documents before building "
            "the FAISS index."
        )


    # --------------------------------------------------------
    # Extract text
    # --------------------------------------------------------

    texts = [
        chunk["text"]
        for chunk in chunks
    ]


    # --------------------------------------------------------
    # Load embedding model
    # --------------------------------------------------------

    print(
        f"\nLoading embedding model: "
        f"{EMBED_MODEL}"
    )

    model = SentenceTransformer(
        EMBED_MODEL
    )


    # --------------------------------------------------------
    # Save local model
    # --------------------------------------------------------

    print(
        "\nSaving local embedding model..."
    )

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    model.save(
        MODEL_DIR
    )

    print(
        f"Saved model to:\n{MODEL_DIR}"
    )


    # --------------------------------------------------------
    # Generate embeddings
    # --------------------------------------------------------

    print(
        "\nGenerating embeddings..."
    )

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=True
    )

    embeddings = np.asarray(
        embeddings,
        dtype="float32"
    )


    print(
        f"Embedding shape: "
        f"{embeddings.shape}"
    )


    # --------------------------------------------------------
    # Normalize
    # --------------------------------------------------------

    faiss.normalize_L2(
        embeddings
    )


    # --------------------------------------------------------
    # Build FAISS index
    # --------------------------------------------------------

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatIP(
        dimension
    )

    index.add(
        embeddings
    )


    print(
        f"FAISS vectors: "
        f"{index.ntotal}"
    )


    # --------------------------------------------------------
    # Save index
    # --------------------------------------------------------

    faiss.write_index(
        index,
        INDEX_FILE
    )

    print(
        f"FAISS index saved to:\n"
        f"{INDEX_FILE}"
    )


    # --------------------------------------------------------
    # Metadata
    # --------------------------------------------------------

    metadata = []

    for chunk in chunks:

        metadata.append(
            {
                "disease": chunk["disease"],
                "source": chunk["source"],
                "text": chunk["text"]
            }
        )


    with open(
        META_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metadata,
            file,
            indent=2,
            ensure_ascii=False
        )


    print(
        f"Metadata saved to:\n"
        f"{META_FILE}"
    )


    # --------------------------------------------------------
    # Final validation
    # --------------------------------------------------------

    print("\n============================================")
    print("INDEX BUILD COMPLETE")
    print("============================================")

    print(
        f"Vectors   : {index.ntotal}"
    )

    print(
        f"Dimension  : {dimension}"
    )

    print(
        f"Model     : {MODEL_DIR}"
    )

    print(
        f"Index     : {INDEX_FILE}"
    )

    print(
        f"Metadata  : {META_FILE}"
    )

    print("============================================\n")


if __name__ == "__main__":
    build()