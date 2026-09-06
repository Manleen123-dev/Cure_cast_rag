# CureCast

> A symptom-exploration and health-screening web application that helps users organize reported symptoms, review likely matching conditions, and understand the result with retrieval-grounded context.

[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-646CFF?logo=vite&logoColor=white)](frontend/)
[![Backend](https://img.shields.io/badge/backend-Flask-000000?logo=flask&logoColor=white)](backend/)
[![Deployment](https://img.shields.io/badge/API-Render-46E3B7?logo=render&logoColor=white)](https://cure-cast-rag.onrender.com)

**Live API:** [cure-cast-rag.onrender.com](https://cure-cast-rag.onrender.com)
  **Live API:**  https://cure-cast-rag.vercel.app/

## What CureCast does

CureCast provides a guided symptom-selection experience. A user can search a library of 377 symptoms, select the symptoms that apply, and receive:

- A leading condition match and three alternatives
- A match-strength score, severity label, and suggested specialist category
- A plain-language explanation and care guidance
- Retrieved disease-card context and source excerpts
- A locally stored history of past checks and dark-mode support

The deployed backend uses a lightweight symptom-overlap matcher and keyword retrieval so it can run on Render's 512 MB free tier. The repository also contains the original CatBoost training workflow and optional FAISS/sentence-transformer retrieval code for larger deployments.

> **Medical disclaimer:** CureCast is an educational screening-support tool, not a diagnostic system. It cannot replace a qualified clinician. Seek urgent professional care for severe, sudden, or worsening symptoms.

## Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│ Vercel — React + Vite frontend                                     │
│ Search symptoms · select chips · results · explanations · history  │
└──────────────────────────────┬────────────────────────────────────┘
                               │ HTTPS (VITE_API_URL)
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│ Render — Flask API                                                  │
│ /symptoms · /diseases · /predict                                   │
│                                                                     │
│ Lightweight symptom matcher → keyword disease-card retrieval       │
│                              → explanation synthesizer             │
└──────────────────────────────┬────────────────────────────────────┘
                               ▼
                  Compact disease metadata and symptom catalog
```

## Features

- **Fast symptom discovery** — searchable, keyboard-friendly symptom picker with selected-symptom chips
- **Screening results** — leading match, alternatives, priority level, match strength, and specialist suggestion
- **Grounded explanations** — disease-card excerpts are included with each result
- **Thoughtful UI** — responsive React interface, motion transitions, accessibility attributes, dark mode, and local check history
- **Free-tier aware backend** — lightweight runtime avoids loading the original ~1 GB CatBoost artifact in production
- **Test coverage** — Flask endpoint tests plus Vitest frontend test setup

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Axios |
| Backend | Python, Flask, Flask-CORS, Pandas, NumPy, Gunicorn |
| Retrieval | Keyword disease-card matching in production; optional FAISS + SentenceTransformers workflow in the repository |
| Deployment | Vercel (frontend), Render Docker Web Service (API) |
| Testing | Pytest, Vitest, Testing Library |

## Repository structure

```text
CureCast/
├── frontend/                         # Vite + React client
│   ├── src/
│   │   ├── App.jsx                   # API integration and application state
│   │   ├── components/               # symptom, results, explanation, history UI
│   │   └── test/                     # frontend test configuration
│   ├── public/                       # static assets
│   └── package.json
├── backend/
│   ├── main.py                       # Flask application and API routes
│   ├── rag/
│   │   ├── retriever.py              # keyword/vector retrieval modes
│   │   ├── synthesizer.py            # response explanation builder
│   │   └── data/
│   │       ├── metadata.json         # compact disease knowledge cards
│   │       └── symptoms.json         # 377 symptom labels
│   ├── tests/                        # backend API tests
│   └── requirements.txt
├── disease_list_with_counts.csv      # disease sample-count catalog
├── train.py                          # original CatBoost training workflow
├── Dockerfile                        # Render-ready backend container
└── DEPLOYMENT_CHALLENGES.md          # deployment findings and decisions
```

## Run locally

### Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- npm

### 1. Start the backend

From the repository root:

```bash
python -m venv .venv
```

Activate the environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS/Linux/Git Bash
source .venv/bin/activate
```

Install the backend dependencies and run the low-memory production mode:

```bash
pip install -r backend/requirements.txt
```

```powershell
# Windows PowerShell
$env:CURECAST_RETRIEVER_MODE = "keyword"
flask --app backend.main run
```

```bash
# macOS/Linux/Git Bash
CURECAST_RETRIEVER_MODE=keyword flask --app backend.main run
```

The API starts at `http://127.0.0.1:5000`.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm ci
```

Create `frontend/.env.local`:

```text
VITE_API_URL=http://127.0.0.1:5000
```

Then run:

```bash
npm run dev
```

Open the local URL shown by Vite, normally `http://localhost:5173`.

## API reference

### `GET /`

Health check.

```json
{"message":"CureCast API is running."}
```

### `GET /symptoms`

Returns the searchable symptom library.

### `GET /diseases`

Returns the disease catalog with sample count, inferred severity, and suggested specialist category.

### `POST /predict`

Accepts selected symptom labels and returns screening matches and an explanation.

```json
{
  "symptoms": ["cough", "fever", "fatigue"]
}
```

The response includes `prediction`, `alternatives`, `explanation`, `retrieval_mode`, and a medical disclaimer.

## Testing

### Backend

```bash
pip install pytest
$env:CURECAST_SKIP_BOOTSTRAP = "1"   # PowerShell only
python -m pytest backend/tests -q
```

### Frontend

```bash
cd frontend
npm test
```

## Deploy

### Backend: Render

The repository root includes a Dockerfile configured for Render:

- Deploy as a **Docker Web Service** from the repository root.
- Do not override the Docker start command.
- Render supplies the `PORT` environment variable; Gunicorn binds to it automatically.
- The Docker image uses `CURECAST_RETRIEVER_MODE=keyword`, which is the low-memory deployment mode.

After deployment, verify:

```text
https://cure-cast-rag.onrender.com/symptoms
```

### Frontend: Vercel

Import this repository into Vercel and configure:

| Vercel setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable | `VITE_API_URL=https://cure-cast-rag.onrender.com` |

`VITE_API_URL` is substituted at build time, so redeploy Vercel after changing it.

## Deployment note: original ML model

The original project includes scripts for training and exporting a CatBoost classifier. Its exported model is approximately 1 GB and exceeds Render Free's 512 MB runtime limit. The deployed application therefore uses the compact knowledge-base matcher.

To restore the original CatBoost inference flow, use a larger compute instance or retrain/export a substantially smaller model. See [DEPLOYMENT_CHALLENGES.md](DEPLOYMENT_CHALLENGES.md) for the full diagnosis and trade-off.

## Future improvements

- Add calibrated confidence scoring for the lightweight matcher
- Retrain and benchmark a smaller production model
- Add a curated medical-source citation pipeline
- Add user authentication and encrypted server-side history, if persistence is required
- Add rate limiting, request validation, and monitoring for a production launch

## Disclaimer

This project is for educational and portfolio purposes. It does not provide medical diagnosis, emergency triage, or treatment recommendations. Always seek advice from a qualified healthcare professional for medical concerns.
