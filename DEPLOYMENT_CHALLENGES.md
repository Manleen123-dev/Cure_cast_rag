# CureCast Deployment Challenges and Solutions

## Project architecture

CureCast is a React/Vite frontend hosted on Vercel and a Flask API hosted on Render. The API exposes symptom, disease, and prediction endpoints. The initial backend included a CatBoost prediction model and a sentence-transformer/FAISS retrieval pipeline.

## 1. Free-tier memory limit exceeded

### Challenge

The Render free web-service instance has a 512 MB memory limit. The original CatBoost artifact was approximately 1 GB on disk. Loading that artifact, along with Python ML dependencies and the embedding model, caused the backend worker to be killed for running out of memory. Render then repeatedly restarted the service, which produced a `502 Bad Gateway` response.

### Diagnosis

The Render logs showed `Out of memory (used over 512Mi)` and repeated Gunicorn worker starts. This showed that the Docker image could build successfully but the application could not stay alive at runtime.

### Solution

I replaced the production free-tier predictor with a lightweight symptom-overlap matcher. It uses the compact disease metadata already generated for the RAG knowledge base rather than loading the 1 GB CatBoost artifact. I also removed unnecessary heavy ML packages and model downloads from the production Docker build.

### Trade-off

The lightweight matcher is suitable for a demo and free deployment, but its ranking is not identical to the original CatBoost model. To serve the original model, the backend would need a larger paid instance or a smaller retrained model.

## 2. Incorrect fixed port for Render

### Challenge

The original Docker configuration bound Gunicorn to port `7860`, which was intended for Hugging Face Spaces. Render supplies its own port through the `PORT` environment variable.

### Diagnosis

Render's logs reported that no open HTTP port had been detected, even though Gunicorn had started.

### Solution

I changed the Docker start command to bind Gunicorn to `0.0.0.0:${PORT:-10000}`. This lets the same container use Render's assigned port while still having a local fallback port.

## 3. Docker image contained unnecessary large assets

### Challenge

The backend folder contained the sentence-transformer embedding model, a FAISS index, and generated medical-document copies. The free deployment no longer needed these files after switching to keyword retrieval.

### Solution

I added Docker ignore rules for unused heavy assets. This reduced build context size, image size, dependency-install time, and the risk of loading unnecessary ML libraries.

## 4. Deployment succeeded but the service still returned 502

### Challenge

Render showed a successful deployment, but the public API still returned `502 Bad Gateway`.

### Diagnosis

The runtime traceback identified the real cause:

```text
FileNotFoundError: Metadata file not found:
/app/backend/rag/data/metadata.json
```

The required metadata file was present locally but had been excluded from Git by a broad `*.json` rule in `.gitignore`. Therefore, it did not exist in Render's cloned repository.

### Solution

I force-added the small required `metadata.json` file to Git and redeployed. This highlighted an important distinction: a successful container build does not guarantee that the application has all runtime assets.

## 5. Monorepo frontend deployment configuration

### Challenge

The repository contains both a Docker backend at the repository root and a Vite frontend inside `frontend/`. Vercel initially interpreted the repository as a multi-service project.

### Solution

I configured Vercel to deploy only the `frontend` directory with the Vite build command and `dist` output directory. I set the build-time environment variable below so that the frontend calls the deployed backend instead of localhost:

```text
VITE_API_URL=https://cure-cast-rag.onrender.com
```

## Interview summary

> The main deployment challenge was adapting an ML application to a free cloud instance with a strict 512 MB memory limit. I used deployment logs to separate build-time success from runtime failures, identified that the original 1 GB model could not fit in memory, and redesigned the hosted inference path around a compact knowledge base. I also corrected platform-specific port configuration, reduced the Docker image, configured a monorepo frontend deployment, and diagnosed a missing runtime asset caused by `.gitignore`. The result was a working Vercel frontend connected to a Render backend that fits the free tier.

## Key lessons

- Measure model memory requirements before selecting a hosting plan.
- Bind web servers to the deployment platform's `PORT` environment variable.
- Treat build status and runtime health as separate checks.
- Keep required runtime assets tracked in source control or download them explicitly during the build.
- Use environment variables for frontend API URLs; Vite substitutes them during the build.
- Be explicit about deployment trade-offs when replacing a large ML model with a lightweight fallback.
