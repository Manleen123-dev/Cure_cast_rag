import os
import pickle
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd
from flask import Flask, current_app, jsonify, request
from flask_cors import CORS

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

from rag.retriever import CureCastRetriever
from rag.synthesizer import ExplanationSynthesizer

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------

ARTIFACT_PATH = BACKEND_DIR / "../curecast_catboost_optimized.pkl"
DISEASE_CSV_PATH = BACKEND_DIR / "../disease_list_with_counts.csv"


# ------------------------------------------------------------------
# Loaders
# ------------------------------------------------------------------

def load_artifact(path: Path):
    with open(path, "rb") as f:
        artifact = pickle.load(f)

    model = artifact.get("model")
    label_encoder = artifact["label_encoder"]
    symptoms = artifact.get("symptoms") or artifact.get("features") or []
    return model, label_encoder, symptoms

SEVERITY_OVERRIDES = {
    "heart attack": "Severe",
    "stroke": "Severe",
    "cancer": "Severe",
    "kidney failure": "Severe",
    "pneumonia": "Severe",
    "covid-19": "Severe",
    "diabetes": "Moderate",
    "hypertension": "Moderate",
    "asthma": "Moderate",
    "arthritis": "Moderate",
    "depression": "Moderate",
    "heart failure": "Severe",
}

SPECIALIST_KEYWORDS = {
    "heart": "Cardiologist",
    "cardio": "Cardiologist",
    "stroke": "Neurologist",
    "brain": "Neurologist",
    "lung": "Pulmonologist",
    "respiratory": "Pulmonologist",
    "asthma": "Pulmonologist",
    "pneumonia": "Pulmonologist",
    "kidney": "Nephrologist",
    "renal": "Nephrologist",
    "liver": "Hepatologist",
    "diabetes": "Endocrinologist",
    "thyroid": "Endocrinologist",
    "mental": "Psychiatrist",
    "depression": "Psychiatrist",
    "bone": "Orthopedic Surgeon",
    "fracture": "Orthopedic Surgeon",
    "skin": "Dermatologist",
    "dermatitis": "Dermatologist",
    "eye": "Ophthalmologist",
    "ear": "ENT Specialist",
    "sinus": "ENT Specialist",
}

def infer_specialist(disease: str) -> str:
    name = disease.lower()
    for keyword, specialist in SPECIALIST_KEYWORDS.items():
        if keyword in name:
            return specialist
    return "General Physician"

def load_disease_catalog(path: Path):
    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]
    df["Disease_norm"] = df["Disease"].str.lower()
    df["Severity"] = df["Disease_norm"].map(SEVERITY_OVERRIDES).fillna("Mild")
    df["Specialist"] = df["Disease_norm"].map(lambda x: infer_specialist(x))
    return df[["Disease", "Disease_norm", "Sample_Count", "Severity", "Specialist"]]

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def build_feature_frame(selected: List[str], known_symptoms: List[str]) -> pd.DataFrame:
    vector = pd.DataFrame(
        data=0,
        index=[0],
        columns=known_symptoms,
        dtype=np.float32,
    )
    active = [sym for sym in selected if sym in known_symptoms]
    if active:
        vector.loc[0, active] = 1.0
    return vector


def serialize_prediction_row(row: pd.Series) -> Dict[str, object]:
    return {
        "disease": row["Disease"],
        "confidence": round(float(row["Percent"]), 1),
        "probability": round(float(row["Probability"]), 4),
        "severity": row.get("Severity", "Unknown") or "Unknown",
        "specialist": row.get("Specialist", "General Physician") or "General Physician",
        "sample_count": int(row["Sample_Count"]) if pd.notna(row.get("Sample_Count")) else None,
    }


def create_runtime(
    artifact_path: Path = ARTIFACT_PATH,
    disease_csv_path: Path = DISEASE_CSV_PATH,
) -> Dict[str, object]:
    model, label_encoder, symptoms = load_artifact(artifact_path)
    disease_catalog = load_disease_catalog(disease_csv_path)
    retriever = CureCastRetriever(BACKEND_DIR / "rag")
    synthesizer = ExplanationSynthesizer()
    print(f"BACKEND LOG: Loaded {len(symptoms)} symptoms from artifact.")
    return {
        "model": model,
        "label_encoder": label_encoder,
        "symptoms": symptoms,
        "disease_catalog": disease_catalog,
        "retriever": retriever,
        "synthesizer": synthesizer,
    }


def get_runtime() -> Dict[str, object]:
    return current_app.config["RUNTIME"]

# ------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------


def create_app(runtime: Dict[str, object] | None = None) -> Flask:
    app = Flask(__name__)
    CORS(app)
    app.config["RUNTIME"] = runtime or create_runtime()

    @app.route("/")
    def read_root():
        return jsonify({"message": "CureCast API is running."})

    @app.route("/symptoms", methods=['GET'])
    def get_symptoms():
        runtime_data = get_runtime()
        symptoms = runtime_data["symptoms"]
        print(f"BACKEND LOG: /symptoms endpoint called, sending {len(symptoms)} symptoms.")
        return jsonify(symptoms)

    @app.route("/diseases", methods=['GET'])
    def get_diseases():
        runtime_data = get_runtime()
        return jsonify(runtime_data["disease_catalog"].to_dict(orient="records"))

    @app.route("/predict", methods=['POST'])
    def predict():
        runtime_data = get_runtime()
        known_symptoms = runtime_data["symptoms"]
        data = request.get_json(silent=True) or {}
        symptoms = data.get('symptoms', [])
        normalized_symptoms = [sym for sym in symptoms if sym in known_symptoms]

        if not normalized_symptoms:
            return jsonify({
                "selected_symptoms": [],
                "prediction": None,
                "alternatives": [],
                "explanation": None,
                "disclaimer": "CureCast offers screening support only and is not a substitute for professional medical advice.",
            }), 400

        features = build_feature_frame(normalized_symptoms, known_symptoms)
        probabilities = runtime_data["model"].predict_proba(features)[0]
        classes = runtime_data["label_encoder"].inverse_transform(np.arange(len(probabilities)))

        df = (
            pd.DataFrame({"Disease": classes, "Probability": probabilities})
            .sort_values("Probability", ascending=False)
            .head(4)
        )
        df["Percent"] = (df["Probability"] * 100)
        df["Disease_norm"] = df["Disease"].str.lower()
        merged = df.merge(
            runtime_data["disease_catalog"],
            on="Disease_norm",
            how="left",
            suffixes=("", "_catalog"),
        )
        merged = merged.drop(columns=["Disease_norm", "Disease_catalog"], errors="ignore")

        result = merged[
            ["Disease", "Probability", "Percent", "Severity", "Specialist", "Sample_Count"]
        ].fillna({"Severity": "Unknown", "Specialist": "General Physician"})

        serialized_predictions = [
            serialize_prediction_row(row) for _, row in result.iterrows()
        ]
        primary_prediction = serialized_predictions[0]
        alternatives = serialized_predictions[1:4]
        retrieved_context = runtime_data["retriever"].retrieve(
            disease=primary_prediction["disease"],
            symptoms=normalized_symptoms,
            top_k=3,
        )
        explanation = runtime_data["synthesizer"].synthesize(
            primary_prediction=primary_prediction,
            alternative_predictions=alternatives,
            selected_symptoms=normalized_symptoms,
            retrieved_context=retrieved_context,
        )

        response = {
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "selected_symptoms": normalized_symptoms,
            "prediction": primary_prediction,
            "alternatives": alternatives,
            "explanation": explanation,
            "retrieval_mode": runtime_data["retriever"].mode,
            "disclaimer": "CureCast offers screening support only and is not a substitute for professional medical advice.",
        }

        return jsonify(response)

    return app


app = None
if os.environ.get("CURECAST_SKIP_BOOTSTRAP") != "1":
    app = create_app()


if __name__ == "__main__":
    if app is None:
        app = create_app()
    app.run(debug=True)
