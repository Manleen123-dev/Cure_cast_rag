# CureCast 🩺

### AI-Assisted Symptom Screening & Medical Explanation Platform

CureCast is an AI-assisted symptom-screening application designed to help users understand possible health conditions based on the symptoms they provide.

Instead of simply returning a predicted disease, CureCast combines a **machine-learning prediction model** with **retrieval-based medical context** to provide a more understandable explanation of the result and encourage appropriate follow-up when necessary.

> ⚠️ **Medical Disclaimer:** CureCast is an educational screening-support tool and is not a substitute for professional medical diagnosis, emergency evaluation, or treatment advice.

---

## ✨ Features

### 🔍 AI-Based Symptom Screening

Users can select symptoms from a comprehensive symptom library and submit them for analysis.

The backend processes the selected symptoms and uses a trained **CatBoost classification model** to identify the conditions that are most consistent with the provided symptoms.

---

### 🧠 Retrieval-Based Medical Explanations

CureCast goes beyond a simple prediction.

After generating a prediction, the system retrieves relevant medical context from the application's knowledge base and uses it to provide:

- Explanation of the predicted condition
- Relevant medical context
- Supporting information
- Practical next-step guidance
- Retrieved sources/context used for the explanation

This creates a pipeline of:

**Symptoms → ML Prediction → Medical Context Retrieval → Explanation**

---

### 📊 Confidence-Aware Results

Predictions are presented together with their confidence score.

Rather than treating confidence as a definitive diagnosis, CureCast provides contextual language around the result so that lower-confidence predictions are communicated appropriately.

For example:

> Low-confidence match — the selected symptoms are most consistent with this condition, but other causes may also be possible.

---

### 🟢 Priority-Based Results

Predictions can be presented using different priority levels:

- **Mild**
- **Moderate**
- **Severe**

Each priority level has its own visual treatment to make the result easier to understand at a glance.

---

### 🕘 Past Checks

CureCast maintains a history of previous symptom checks.

Users can:

- View previous predictions
- See when a check was performed
- Review the symptoms used
- Reopen a previous check
- Remove saved checks

This allows users to compare previous symptom patterns without repeating the entire process.

---

### 🌗 Light & Dark Mode

The interface supports both:

- Light clinical theme
- Dark theme

The themes use shared CSS design tokens so that components remain visually consistent across both modes.

---

### 📱 Responsive Interface

The frontend is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

The layout adapts the symptom selector, prediction results, history panel, and navigation for smaller screens.

---

## 🏗️ System Architecture

CureCast follows a frontend-backend architecture.

```text
                    ┌──────────────────────┐
                    │      User            │
                    │ Selects Symptoms     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │   Vite Application    │
                    └──────────┬───────────┘
                               │
                         HTTP Request
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Flask Backend     │
                    │      /predict        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   CatBoost Model     │
                    │ Symptom Classification│
                    └──────────┬───────────┘
                               │
                         Prediction
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Retrieval System    │
                    │ Medical Knowledge    │
                    │       Context        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Explanation & Result │
                    │  Confidence + Info   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    React UI          │
                    │ Prediction + Sources │
                    └──────────────────────┘
