# 🩺 CureCast — AI-Powered Symptom Screening & Explanation

CureCast is an **AI-assisted symptom-screening application** designed to help users understand possible health conditions based on the symptoms they provide.

Instead of simply returning a predicted disease, CureCast combines a **machine-learning prediction model with retrieval-based medical context** to provide a more understandable explanation of the result and guide the user toward an appropriate next step.

> ⚠️ **Medical Disclaimer:** CureCast is an educational screening-support tool and is **not a replacement for professional medical diagnosis, emergency evaluation, or treatment advice.**

---

## ✨ Features

### 🔍 AI Symptom Screening
Users can select symptoms from a structured symptom library and submit them for analysis.

The backend processes the selected symptoms and uses a trained **CatBoost classification model** to identify the conditions that are most consistent with the given symptom pattern.

### 🤖 Retrieval-Augmented Explanations

CureCast goes beyond a simple machine-learning prediction.

After generating a prediction, the system retrieves relevant medical information from its knowledge base and uses that information to provide additional context around the prediction.

This allows the application to answer questions such as:

- What does the predicted condition mean?
- Why might it be consistent with the selected symptoms?
- What information is relevant to the prediction?
- What should the user consider doing next?

### 📊 Confidence-Aware Results

Predictions are presented together with their confidence score.

CureCast intentionally uses a calmer presentation for low-confidence predictions rather than presenting a low percentage as an alarming statistic.

For example:

> **6% confidence**  
> Low-confidence match — the selected symptoms are only weakly associated with this condition.

This helps communicate that the prediction is an AI-generated possibility rather than a diagnosis.

### 🟢 Priority Classification

Predicted conditions can be presented using different priority levels:

- **Mild**
- **Moderate**
- **Severe**

Each level has its own visual treatment so that users can quickly understand the general urgency associated with the result.

### 📚 Supporting Medical Context

The application can display retrieved information associated with the prediction, including:

- Relevant medical context
- Explanations
- Source information
- Retrieved excerpts
- Relevance information

This makes the result more transparent than a black-box prediction alone.

### 🕘 Past Checks

CureCast stores previous screening results locally so users can:

- Review previous checks
- Reopen a previous result
- Review the symptoms used
- Remove old checks

### 🌗 Light & Dark Theme

The interface includes a manually controlled light/dark theme.

The design system uses CSS variables so that colors, surfaces, borders, typography, and other UI elements remain consistent across both themes.

### 📱 Responsive Interface

The frontend is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

---

# 🏗️ System Architecture

CureCast follows a frontend–backend architecture:

```text
                    ┌─────────────────────┐
                    │       User          │
                    │ Selects Symptoms    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │                     │
                    │ • Symptom Selector  │
                    │ • Prediction UI     │
                    │ • History           │
                    │ • Explanations      │
                    └──────────┬──────────┘
                               │
                         HTTP / REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Flask Backend     │
                    │                     │
                    │ • API Endpoints     │
                    │ • Input Processing  │
                    │ • Model Inference   │
                    │ • RAG Retrieval     │
                    └───────┬─────┬───────┘
                            │     │
                ┌───────────┘     └────────────┐
                ▼                              ▼
       ┌─────────────────┐            ┌─────────────────┐
       │ CatBoost Model  │            │ RAG Retriever   │
       │                 │            │                 │
       │ Disease /       │            │ Medical Context │
       │ Condition       │            │ Retrieval       │
       │ Prediction      │            │                 │
       └────────┬────────┘            └────────┬────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Combined Result   │
                    │                     │
                    │ Prediction          │
                    │ Confidence          │
                    │ Explanation         │
                    │ Sources             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │ Displays Result     │
                    └─────────────────────┘
```

---

# 🔄 Application Workflow

The complete CureCast workflow is:

### 1. User selects symptoms

The frontend loads the available symptoms from the Flask backend.

```text
GET /symptoms
```

The backend provides the symptom list to the frontend.

---

### 2. User submits symptoms

The selected symptoms are sent to the prediction endpoint.

```text
POST /predict
```

The backend receives the selected symptoms and prepares them for model inference.

---

### 3. Machine-learning prediction

The processed symptom representation is passed to the trained **CatBoost classifier**.

The model generates a predicted condition and associated confidence information.

Conceptually:

```text
Selected Symptoms
        ↓
Feature Representation
        ↓
CatBoost Classifier
        ↓
Predicted Condition
        ↓
Confidence Score
```

---

### 4. Medical context retrieval

The prediction is then used as part of the retrieval process.

The CureCast retriever searches its available medical knowledge/context and identifies information relevant to the prediction.

```text
Prediction
    ↓
Retriever
    ↓
Relevant Medical Context
    ↓
Supporting Information
```

---

### 5. Result generation

The backend combines the prediction and retrieved information into the response returned to the frontend.

The frontend can then display:

```text
Prediction
     +
Confidence
     +
Priority
     +
Explanation
     +
Supporting Sources
```

---

### 6. Result displayed to the user

The React interface presents the result in a structured format instead of showing raw model output.

The user can also save the result to their recent history and reopen it later.

---

# 🧠 Machine Learning Component

CureCast uses a **CatBoost classification model** for symptom-based prediction.

CatBoost was selected because it provides strong performance for structured/tabular classification problems and can handle complex relationships between input features effectively.

The model takes the symptom representation as input and predicts the most likely condition.

### High-level ML pipeline

```text
Raw Symptom Dataset
        ↓
Data Cleaning
        ↓
Feature Preparation
        ↓
Symptom Representation
        ↓
Train/Test Split
        ↓
CatBoost Classifier
        ↓
Model Evaluation
        ↓
Saved Model
        ↓
Flask Inference
```

The trained model is loaded by the Flask backend when the application starts.

---

# 📚 RAG / Retrieval Component

The retrieval component is used to provide additional context around the machine-learning prediction.

The purpose is not simply to generate another prediction.

Instead:

```text
ML Model
   ↓
"What condition is most consistent?"
   ↓
Prediction
   ↓
Retriever
   ↓
"What medical information is relevant?"
   ↓
Context
   ↓
Explanation
```

This separation is important because the ML model is responsible for **prediction**, while retrieval provides **supporting context**.

This makes the overall system easier to understand and provides users with more information than a standalone classifier.

---

# 🎨 Frontend

The CureCast frontend is built using:

- React
- Vite
- JavaScript / JSX
- CSS
- Responsive UI components

The interface is designed around a clinical-product style rather than a generic dashboard.

### Main UI sections

```text
┌─────────────────────────────────────┐
│ Header                              │
│ Logo | Navigation | Theme Toggle   │
├─────────────────────────────────────┤
│                                     │
│ Hero                                │
│ "Understand symptoms..."            │
│                                     │
│ [Check Symptoms]                    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ How CureCast Works                  │
│                                     │
│ 01        02        03              │
│ Screening Explanation Support      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Symptom Selector                    │
│                                     │
│ Search symptoms                     │
│ [symptom] [symptom] [symptom]       │
│                                     │
│             [Run Screening]         │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Prediction Result                   │
│                                     │
│ Condition                           │
│ Priority                            │
│ Confidence                          │
│ Explanation                         │
│ Sources                             │
│                                     │
├─────────────────────────────────────┤
│ Past Checks                         │
│ Previous screening results          │
└─────────────────────────────────────┘
```

---

# 🎨 Design System

CureCast uses a centralized CSS variable-based design system.

The system defines reusable variables for:

- Colors
- Typography
- Spacing
- Borders
- Radius
- Shadows
- Transitions
- Light theme
- Dark theme

### Light Theme

The light theme uses:

- Warm off-white backgrounds
- Near-black typography
- Restrained teal/blue primary color
- Soft green for mild/safe states
- Amber for warnings/disclaimers
- Subtle borders and shadows

### Dark Theme

The dark theme uses:

- Dark navy/charcoal backgrounds
- Slightly lighter cards
- Desaturated teal primary colors
- Subtle borders
- Low-opacity shadows
- High-contrast readable text

The theme is controlled through a class on the HTML element:

```html
<html class="dark">
```

This allows the same component styles to automatically adapt between themes.

---

# 📁 Project Structure

The project is organized into separate frontend and backend components.

```text
CureCast/
│
├── backend/
│   ├── main.py
│   ├── rag/
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ExplanationPanel.jsx
│   │   │   ├── HistoryPanel.jsx
│   │   │   └── ...
│   │   │
│   │   ├── App.jsx
│   │   ├── App.tsx
│   │   ├── main.jsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── ...
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── Disease and symptoms dataset.csv
│
├── curecast_catboost_...
│
├── .gitignore
└── README.md
```

> Some generated files, local environments, cached files, and large datasets/models may be excluded from version control using `.gitignore`.

---

# ⚙️ Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Frontend development/build tool |
| JSX | UI components |
| CSS | Design system and responsive styling |

## Backend

| Technology | Purpose |
|---|---|
| Python | Backend / ML integration |
| Flask | REST API |
| Flask-CORS | Frontend-backend communication |

## Machine Learning

| Technology | Purpose |
|---|---|
| CatBoost | Disease/condition classification |
| Scikit-learn | Preprocessing/model utilities |

## AI / Retrieval

| Component | Purpose |
|---|---|
| RAG Retriever | Retrieve relevant medical context |
| Medical Knowledge Base | Supporting information |
| Retrieval Pipeline | Connect predictions with context |

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/Manleen123-dev/Cure_cast_rag.git
```

Move into the project:

```bash
cd Cure_cast_rag
```

---

# 🐍 Backend Setup

Move into the backend directory:

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If a `requirements.txt` is not included in the repository, install the required Python packages used by the backend and ML pipeline.

---

## Start the Flask backend

From the project root:

```bash
python -m flask --app backend/main.py run
```

The backend should be available at:

```text
http://127.0.0.1:5000
```

You should see:

```text
* Running on http://127.0.0.1:5000
```

---

# ⚛️ Frontend Setup

Open another terminal.

Move to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend should be available at:

```text
http://localhost:5173
```

---

# 🔌 API

## Get Symptoms

### Endpoint

```http
GET /symptoms
```

### Purpose

Returns the available symptoms that can be selected by the frontend.

Example:

```text
GET http://127.0.0.1:5000/symptoms
```

---

## Predict Condition

### Endpoint

```http
POST /predict
```

### Purpose

Receives the selected symptoms and returns the prediction result generated by the backend.

Conceptual request:

```json
{
  "symptoms": [
    "fever",
    "nausea",
    "fatigue"
  ]
}
```

The response contains prediction-related information used by the frontend to display the result.

> The exact response structure may vary with the current backend implementation.

---

# 🔐 Data & Privacy

CureCast is intended as an educational screening-support application.

Users should **not enter highly sensitive personal information** into the application.

The current frontend history functionality stores previous screening results locally in the browser rather than requiring a user account.

---

# 🧪 Example Workflow

Suppose a user selects:

```text
Fever
Nausea
Fatigue
```

CureCast processes the request:

```text
User
 │
 │ Selects symptoms
 ▼
React Frontend
 │
 │ POST /predict
 ▼
Flask Backend
 │
 ├───────────────┐
 ▼               ▼
CatBoost        Retriever
 │               │
 │ Prediction    │ Medical Context
 └───────┬───────┘
         ▼
   Combined Result
         │
         ▼
   React Frontend
         │
         ▼
Prediction + Confidence
+ Explanation + Sources
```

---

# 🎯 Why CureCast?

Traditional symptom-checking systems often have one major limitation:

> They provide an output without enough context.

CureCast attempts to improve this experience by combining:

```text
Machine Learning
       +
Information Retrieval
       +
Human-readable Explanation
       +
Confidence-aware UI
       +
Clinical-style Design
```

The goal is to make AI-generated screening information:

- Easier to understand
- More transparent
- Less alarming
- More useful for follow-up discussions
- Clear about its limitations

---

# ⚠️ Important Limitations

CureCast should **not** be treated as a medical diagnostic system.

The prediction generated by the ML model represents a model-based possibility based on the provided symptoms.

A prediction may be incorrect because of:

- Incomplete symptom information
- Symptoms shared by multiple conditions
- Dataset limitations
- Model limitations
- Differences between individual patients
- Missing medical history
- Real-world conditions that are not represented in the training data

Therefore:

> **Always consult a qualified healthcare professional for medical diagnosis and treatment decisions.**

For severe, rapidly worsening, or emergency symptoms, users should seek appropriate medical care rather than relying on CureCast.

---

# 🔮 Future Improvements

Potential future improvements include:

### 🧠 Improved ML Models

Experiment with:

- Ensemble models
- Neural networks
- Better feature representations
- Larger and more diverse datasets
- Improved calibration of confidence scores

### 📚 Improved RAG

Future versions could include:

- Larger curated medical knowledge bases
- Better document chunking
- Semantic/vector search
- Improved reranking
- More precise source attribution
- Better retrieval evaluation

### 👤 User Accounts

A future version could support:

- Secure authentication
- Cloud-based history
- Personalized screening history
- User-controlled data management

### 📈 Prediction Transparency

Additional explainability could include:

- Important symptoms influencing the prediction
- Comparison between possible conditions
- Model uncertainty
- Better calibrated probabilities

### 🏥 Clinical Integration

Future versions could potentially explore integration with healthcare workflows, subject to appropriate clinical validation, privacy requirements, and regulatory considerations.

---

# 🛠️ Development

Frontend development:

```bash
cd frontend
npm run dev
```

Backend development:

```bash
python -m flask --app backend/main.py run
```

The frontend communicates with the Flask backend through HTTP requests.

During development, make sure **both servers are running**:

```text
Frontend
http://localhost:5173
        │
        ▼
Backend
http://127.0.0.1:5000
```

---

# 🧹 Git & Repository Hygiene

Large generated files, Python caches, Node modules, local environments, and other unnecessary artifacts should not be committed.

Typical files/directories to exclude include:

```gitignore
# Python
__pycache__/
*.py[cod]
*.pyo

# Virtual environments
venv/
.venv/
env/

# Python tooling
.pytest_cache/
.mypy_cache/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Vite
dist/
.vite/

# Environment variables
.env
.env.*
!.env.example

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Python cache
.pytest_cache/
*.pyc

# Generated files
*.log

# Local data / generated artifacts
__pycache__/
```

Large datasets and model files should be tracked deliberately rather than accidentally committing hundreds of generated files.

---

# 📌 Project Status

CureCast is currently a **working prototype** demonstrating an end-to-end AI-assisted symptom-screening workflow:

```text
Symptom Input
      ↓
Machine Learning Prediction
      ↓
Confidence
      ↓
Medical Context Retrieval
      ↓
Explanation
      ↓
User-friendly Result
      ↓
History
```

The project focuses on demonstrating how **machine learning + retrieval-based AI + a carefully designed user interface** can work together in a health-information screening application.

---

# 👩‍💻 Authors

**CureCast**

Developed as an AI/ML project exploring:

- Machine Learning
- Natural Language / Retrieval-based AI
- RAG systems
- Flask APIs
- React applications
- Human-centered AI interfaces

---

# 📄 License

This project is intended for educational and research purposes.

Before using CureCast in a real healthcare environment, appropriate validation, security, privacy, clinical evaluation, and regulatory requirements would need to be addressed.

---

## ⭐ If you found CureCast interesting

The project demonstrates an important idea:

> **AI should not only predict — it should also explain, communicate uncertainty, and help users understand what the prediction means.**
