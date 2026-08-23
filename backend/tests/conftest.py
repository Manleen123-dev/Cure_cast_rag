import os

import numpy as np
import pandas as pd
import pytest

os.environ["CURECAST_SKIP_BOOTSTRAP"] = "1"

from backend.main import create_app


class DummyModel:
    def predict_proba(self, features):
        return np.array([[0.72, 0.18, 0.07, 0.03]], dtype=np.float32)


class DummyLabelEncoder:
    def inverse_transform(self, indexes):
        labels = np.array(
            ["Flu", "Common Cold", "Pneumonia", "Asthma"],
            dtype=object,
        )
        return labels[indexes]


class DummyRetriever:
    mode = "keyword"

    def retrieve(self, disease, symptoms, top_k=3):
        return [
            {
                "disease": disease,
                "source": "flu.json",
                "relevance": 0.91,
                "method": "keyword",
                "excerpt": "Disease: Flu. Description: Flu is an infectious respiratory illness.",
                "document": {
                    "description": "Flu is an infectious respiratory illness that can cause fever, fatigue, cough, and body aches.",
                    "symptoms": ["fever", "cough", "fatigue"],
                    "causes": "Influenza viruses spread through respiratory droplets.",
                    "when_to_see_doctor": "Seek medical care if breathing difficulty, dehydration, or worsening symptoms develop.",
                    "text": "Disease: Flu. Description: Flu is an infectious respiratory illness.",
                },
            }
        ]


class DummySynthesizer:
    def synthesize(self, primary_prediction, alternative_predictions, selected_symptoms, retrieved_context):
        return {
            "headline": f"{primary_prediction['disease']} is the leading current match",
            "summary": "A structured explanation generated for test verification.",
            "why_it_matches": [
                "The symptom pattern aligns with the highest-probability class.",
                "The retriever supplied disease context for the top diagnosis.",
            ],
            "medical_context": "Flu is an infectious respiratory illness.",
            "care_guidance": "Consult a clinician if symptoms worsen or do not improve.",
            "triage_note": "Monitor symptoms and seek urgent care if red-flag signs appear.",
            "matched_symptoms": selected_symptoms,
            "sources": [
                {
                    "title": "Flu knowledge card",
                    "source": "flu.json",
                    "relevance": 0.91,
                    "method": "keyword",
                    "excerpt": "Disease: Flu. Description: Flu is an infectious respiratory illness.",
                }
            ],
            "read_more": {
                "description": "Flu is an infectious respiratory illness.",
                "causes": "Influenza viruses spread through respiratory droplets.",
                "when_to_see_doctor": "Seek medical care if symptoms worsen.",
            },
        }


@pytest.fixture
def client():
    runtime = {
        "model": DummyModel(),
        "label_encoder": DummyLabelEncoder(),
        "symptoms": ["fever", "cough", "fatigue", "headache"],
        "disease_catalog": pd.DataFrame(
            [
                {"Disease": "Flu", "Disease_norm": "flu", "Sample_Count": 120, "Severity": "Moderate", "Specialist": "General Physician"},
                {"Disease": "Common Cold", "Disease_norm": "common cold", "Sample_Count": 90, "Severity": "Mild", "Specialist": "General Physician"},
                {"Disease": "Pneumonia", "Disease_norm": "pneumonia", "Sample_Count": 42, "Severity": "Severe", "Specialist": "Pulmonologist"},
                {"Disease": "Asthma", "Disease_norm": "asthma", "Sample_Count": 76, "Severity": "Moderate", "Specialist": "Pulmonologist"},
            ]
        ),
        "retriever": DummyRetriever(),
        "synthesizer": DummySynthesizer(),
    }
    app = create_app(runtime=runtime)
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client
