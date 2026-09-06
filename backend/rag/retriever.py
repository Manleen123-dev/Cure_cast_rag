from __future__ import annotations

import json
import math
import os
import re
from typing import Any, Dict, List

import numpy as np

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

        self.META_FILE = os.path.join(
            self.DATA_DIR,
            "metadata.json"
        )

        self.mode = os.environ.get("CURECAST_RETRIEVER_MODE", "vector").lower()
        if self.mode not in {"keyword", "vector"}:
            raise ValueError("CURECAST_RETRIEVER_MODE must be 'keyword' or 'vector'.")

        # Embedding model directory (optional local path)
        self.MODEL_DIR = os.path.join(
            self.DATA_DIR,
            "embedding_model"
        )

        if not os.path.exists(self.META_FILE):
            raise FileNotFoundError(
                f"Metadata file not found:\n{self.META_FILE}"
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
        self.index = None
        self.model = None
        if self.mode == "vector":
            self._load_vector_retriever()
        else:
            print("RAG: Keyword retrieval ready (low-memory mode).")

    def _load_vector_retriever(self) -> None:
        """Load optional ML dependencies only when vector retrieval is requested."""
        index_file = os.path.join(self.DATA_DIR, "faiss_index.bin")
        if not os.path.exists(index_file):
            raise FileNotFoundError(f"FAISS index not found:\n{index_file}")

        import faiss
        from sentence_transformers import SentenceTransformer

        print("RAG: Loading FAISS index and embedding model...")
        self.index = faiss.read_index(index_file)
        if self.index.ntotal != len(self.metadata):
            raise ValueError(
                "FAISS index and metadata size mismatch.\n"
                f"FAISS vectors: {self.index.ntotal}\n"
                f"Metadata entries: {len(self.metadata)}"
            )
        model_path = self.MODEL_DIR if os.path.exists(self.MODEL_DIR) else "sentence-transformers/all-MiniLM-L6-v2"
        self.model = SentenceTransformer(model_path)
        print("RAG: Vector retrieval ready.")

    # ======================================================
    # RETRIEVE
    # ======================================================

    def retrieve(
        self,
        disease: str,
        symptoms: List[str],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:

        if self.mode == "keyword":
            return self._keyword_retrieve(disease, symptoms, top_k)

        # Build query

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

        import faiss
        faiss.normalize_L2(embedding)

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

    def _keyword_retrieve(self, disease: str, symptoms: List[str], top_k: int) -> List[Dict[str, Any]]:
        """Small, deterministic fallback suited to memory-constrained hosts."""
        terms = set(re.findall(r"[a-z0-9]+", f"{disease} {' '.join(symptoms)}".lower()))
        scored = []
        for item in self.metadata:
            text = str(item.get("text", ""))
            searchable = text.lower()
            matches = sum(term in searchable for term in terms)
            disease_match = str(item.get("disease", "")).lower() == disease.lower()
            score = matches + (3 if disease_match else 0)
            if score:
                scored.append((score, item))

        scored.sort(key=lambda entry: entry[0], reverse=True)
        max_score = max((score for score, _ in scored), default=1)
        return [
            {
                "disease": item.get("disease", ""),
                "source": item.get("source", ""),
                "relevance": round(score / max_score, 4),
                "method": "keyword",
                "excerpt": self._excerpt(str(item.get("text", ""))),
                "document": {"text": item.get("text", "")},
            }
            for score, item in scored[:top_k]
        ]

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
