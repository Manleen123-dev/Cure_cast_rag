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
hf_hub_download(repo_id='Man1912/curecast-model', filename='curecast_model.cbm', local_dir='/app'); \
hf_hub_download(repo_id='Man1912/curecast-model', filename='curecast_meta.pkl', local_dir='/app'); \
"

# Copy backend code and data
COPY backend/ ./backend/
COPY disease_list_with_counts.csv ./disease_list_with_counts.csv

# Render provides the PORT environment variable.  The keyword retriever avoids
# loading PyTorch/the embedding model in Render's 512 MB starter instance.
ENV CURECAST_RETRIEVER_MODE=keyword
ENV OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    MALLOC_ARENA_MAX=2
EXPOSE 10000

CMD ["sh", "-c", "gunicorn --preload --bind 0.0.0.0:${PORT:-10000} --timeout 120 --workers 1 backend.main:app"]
