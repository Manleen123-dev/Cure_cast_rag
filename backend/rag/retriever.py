from __future__ import annotations

import json
import math
import os
import re
from typing import Any, Dict, List

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class CureCastRetriever:

    def __init__(self, base_dir=None):

        # --------------------------------------------------
        # Paths
        # --------------------------------------------------

        if base_dir is None:
            self.BASE_DIR = os.path.dirname(
                os.path.abspath(__file__)
            )
        else:
            self.BASE_DIR = os.fspath(base_dir)

        self.DATA_DIR = os.path.join(
            self.BASE_DIR,
            "data"
        )

        self.INDEX_FILE = os.path.join(
            self.DATA_DIR,
            "faiss_index.bin"
        )

        self.META_FILE = os.path.join(
            self.DATA_DIR,
            "metadata.json"
        )

        # Embedding model directory (optional local path)
        self.MODEL_DIR = os.path.join(
            self.DATA_DIR,
            "embedding_model"
        )

        if not os.path.exists(self.INDEX_FILE):
            raise FileNotFoundError(
                f"FAISS index not found:\n{self.INDEX_FILE}"
            )

        if not os.path.exists(self.META_FILE):
            raise FileNotFoundError(
                f"Metadata file not found:\n{self.META_FILE}"
            )

        # --------------------------------------------------
        # Load FAISS
        # --------------------------------------------------

        print(
            "RAG: Loading FAISS index..."
        )

        self.index = faiss.read_index(
            self.INDEX_FILE
        )

        # --------------------------------------------------
        # Load metadata
        # --------------------------------------------------

        print(
            "RAG: Loading metadata..."
        )

        with open(
            self.META_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            self.metadata = json.load(file)

        # --------------------------------------------------
        # Validate index / metadata
        # --------------------------------------------------

        if self.index.ntotal != len(
            self.metadata
        ):
            raise ValueError(
                "FAISS index and metadata size mismatch.\n"
                f"FAISS vectors: {self.index.ntotal}\n"
                f"Metadata entries: {len(self.metadata)}"
            )

        # --------------------------------------------------
        # Load embedding model
        # --------------------------------------------------

        model_path = self.MODEL_DIR if os.path.exists(self.MODEL_DIR) else "sentence-transformers/all-MiniLM-L6-v2"
        print(
            f"RAG: Loading embedding model from {model_path}..."
        )

        self.model = SentenceTransformer(
            model_path
        )
        self.mode = "hybrid"

        print(
            "RAG: Vector retrieval ready."
        )

    # ======================================================
    # RETRIEVE
    # ======================================================

    def retrieve(
        self,
        disease: str,
        symptoms: List[str],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:

        # --------------------------------------------------
        # Build query
        # --------------------------------------------------

        query = (
            f"Disease: {disease}. "
            f"Symptoms: {', '.join(symptoms)}."
        )

        # --------------------------------------------------
        # Convert query to embedding
        # --------------------------------------------------

        embedding = self.model.encode(
            [query],
            convert_to_numpy=True
        )

        embedding = np.asarray(
            embedding,
            dtype="float32"
        )

        # --------------------------------------------------
        # Normalize for cosine similarity
        # --------------------------------------------------

        faiss.normalize_L2(
            embedding
        )

        # --------------------------------------------------
        # Search FAISS
        # --------------------------------------------------

        scores, indices = self.index.search(
            embedding,
            top_k
        )

        # --------------------------------------------------
        # Build results
        # --------------------------------------------------

        results = []

        for score, index in zip(
            scores[0],
            indices[0]
        ):

            if index < 0:
                continue

            if index >= len(
                self.metadata
            ):
                continue

            metadata = self.metadata[
                int(index)
            ]

            results.append(
                {
                    "disease": metadata.get(
                        "disease",
                        ""
                    ),

                    "source": metadata.get(
                        "source",
                        ""
                    ),

                    "relevance": round(
                        float(score),
                        4
                    ),

                    "method": "vector",

                    "excerpt": self._excerpt(
                        metadata.get(
                            "text",
                            ""
                        )
                    ),

                    "document": {
                        "text": metadata.get(
                            "text",
                            ""
                        )
                    }
                }
            )

        return results

    # ======================================================
    # EXCERPT
    # ======================================================

    @staticmethod
    def _excerpt(
        text: str,
        max_length: int = 220
    ) -> str:

        text = " ".join(
            str(text).split()
        )

        if len(text) <= max_length:
            return text

        return (
            text[:max_length - 3]
            .rstrip()
            + "..."
        )