from __future__ import annotations

from typing import Any, Dict, List


def _is_placeholder(value: str) -> bool:
    lowered = (value or "").lower()
    return "placeholder" in lowered or lowered.endswith("is a medical condition.")


class ExplanationSynthesizer:
    def synthesize(
        self,
        primary_prediction: Dict[str, Any],
        alternative_predictions: List[Dict[str, Any]],
        selected_symptoms: List[str],
        retrieved_context: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        disease = primary_prediction["disease"]
        confidence = primary_prediction["confidence"]
        severity = primary_prediction["severity"]
        specialist = primary_prediction["specialist"]

        lead_context = retrieved_context[0] if retrieved_context else {}
        lead_document = lead_context.get("document", {})
        doc_symptoms = lead_document.get("symptoms", []) or []
        matched_symptoms = [
            symptom
            for symptom in selected_symptoms
            if symptom.lower() in {item.lower() for item in doc_symptoms}
        ]

        summary = (
            f"CureCast ranked {disease} as the strongest current match based on "
            f"{len(selected_symptoms)} selected symptom"
            f"{'' if len(selected_symptoms) == 1 else 's'} and a model confidence of "
            f"{confidence:.1f}%. This is a screening estimate and should be reviewed "
            f"with a qualified clinician."
        )

        why_it_matches = [
            f"The prediction model found the overall symptom pattern more consistent with {disease} than the next alternatives.",
            f"The current care recommendation is to follow up with a {specialist} or primary care clinician if symptoms persist, worsen, or feel concerning.",
        ]

        if matched_symptoms:
            why_it_matches.insert(
                1,
                f"The retrieved disease reference overlaps with symptoms such as {', '.join(matched_symptoms[:4])}.",
            )
        elif selected_symptoms:
            why_it_matches.insert(
                1,
                f"Your reported symptoms include {', '.join(selected_symptoms[:4])}, which the model used as the main diagnostic signal.",
            )

        medical_context = lead_document.get("description", "")
        if not medical_context or _is_placeholder(medical_context):
            medical_context = (
                f"The CureCast knowledge base includes a reference card for {disease}. "
                f"As richer clinical content is added, this panel can surface deeper "
                f"condition details and cited evidence alongside the model output."
            )

        care_guidance = self._build_care_guidance(
            disease=disease,
            severity=severity,
            specialist=specialist,
            alternatives=alternative_predictions,
        )
        triage_note = self._build_triage_note(severity)

        sources = [
            {
                "title": f"{item['disease']} knowledge card",
                "source": item["source"],
                "relevance": item["relevance"],
                "method": item["method"],
                "excerpt": item["excerpt"],
            }
            for item in retrieved_context
        ]

        read_more = {
            "description": medical_context,
            "causes": self._fallback_text(
                lead_document.get("causes", ""),
                "Specific cause details are limited in the current knowledge base entry.",
            ),
            "when_to_see_doctor": self._fallback_text(
                lead_document.get("when_to_see_doctor", ""),
                "Seek in-person medical advice promptly if symptoms worsen, new symptoms appear, or you feel unsafe.",
            ),
        }

        return {
            "headline": f"{disease} is the leading current match",
            "summary": summary,
            "why_it_matches": why_it_matches,
            "medical_context": medical_context,
            "care_guidance": care_guidance,
            "triage_note": triage_note,
            "matched_symptoms": matched_symptoms,
            "sources": sources,
            "read_more": read_more,
        }

    @staticmethod
    def _fallback_text(value: str, fallback: str) -> str:
        if not value or _is_placeholder(value):
            return fallback
        return value

    @staticmethod
    def _build_triage_note(severity: str) -> str:
        if severity == "Severe":
            return "Because this pattern can be higher risk, urgent medical review is worth considering, especially if symptoms are escalating."
        if severity == "Moderate":
            return "This result deserves timely follow-up if symptoms continue, interfere with daily life, or become more intense."
        return "Monitor your symptoms closely and arrange medical advice if the pattern does not improve or something feels off."

    @staticmethod
    def _build_care_guidance(
        disease: str,
        severity: str,
        specialist: str,
        alternatives: List[Dict[str, Any]],
    ) -> str:
        alternative_names = ", ".join(item["disease"] for item in alternatives[:2])
        if alternative_names:
            alternative_phrase = f" Other possibilities the model considered include {alternative_names}."
        else:
            alternative_phrase = ""

        if severity == "Severe":
            urgency = "Arrange prompt medical assessment rather than relying on self-triage alone."
        elif severity == "Moderate":
            urgency = "A planned clinician review is a good next step if symptoms are not clearly improving."
        else:
            urgency = "Supportive self-care may be reasonable at first, but professional review is still appropriate if symptoms persist."

        return (
            f"If {disease} remains the main concern, {urgency} "
            f"A {specialist} may be the most relevant specialist based on the current label.{alternative_phrase}"
        )
