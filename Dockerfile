FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt huggingface_hub

# Download model files from HuggingFace Model Hub at build time
RUN python -c "\
from huggingface_hub import hf_hub_download; \
from sentence_transformers import SentenceTransformer; \
hf_hub_download(repo_id='Man1912/curecast-model', filename='curecast_model.cbm', local_dir='/app'); \
hf_hub_download(repo_id='Man1912/curecast-model', filename='curecast_meta.pkl', local_dir='/app'); \
SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); \
"

# Copy backend code and data
COPY backend/ ./backend/
COPY disease_list_with_counts.csv ./disease_list_with_counts.csv

# HuggingFace Spaces expects port 7860
EXPOSE 7860

CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "--workers", "1", "backend.main:app"]
