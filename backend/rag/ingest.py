from __future__ import annotations

import json
import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

DOCS_DIR = BASE_DIR / "data" / "medical_docs"
OUTPUT_FILE = BASE_DIR / "data" / "chunks.json"


def build_document_text(document):
    disease = document.get("disease", "")
    description = document.get("description", "")
    symptoms = document.get("symptoms", [])
    causes = document.get("causes", "")
    doctor = document.get("when_to_see_doctor", "")

    symptoms_text = ", ".join(symptoms)

    return (
        f"Disease: {disease}. "
        f"Description: {description} "
        f"Symptoms: {symptoms_text}. "
        f"Causes: {causes} "
        f"When to see a doctor: {doctor}"
    ).strip()


def ingest():

    print("\n================================")
    print("CureCast RAG Ingestion")
    print("================================")

    if not DOCS_DIR.exists():
        raise FileNotFoundError(
            f"Medical docs directory not found:\n{DOCS_DIR}"
        )

    chunks = []

    json_files = sorted(
        DOCS_DIR.glob("*.json")
    )

    print(
        f"Found {len(json_files)} medical documents."
    )

    for path in json_files:

        with open(
            path,
            "r",
            encoding="utf-8"
        ) as file:

            document = json.load(file)


        disease = document.get(
            "disease",
            path.stem
        )

        text = build_document_text(
            document
        )


        chunks.append(
            {
                "disease": disease,
                "source": path.name,
                "text": text
            }
        )


    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            chunks,
            file,
            indent=2,
            ensure_ascii=False
        )


    print(
        f"\nCreated {len(chunks)} chunks."
    )

    print(
        f"Saved to:\n{OUTPUT_FILE}"
    )

    print("\nDone!")


if __name__ == "__main__":
    ingest()