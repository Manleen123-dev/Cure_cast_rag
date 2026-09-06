FROM python:3.11-slim

WORKDIR /app

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and data
COPY backend/ ./backend/
COPY disease_list_with_counts.csv ./disease_list_with_counts.csv

# Render provides the PORT environment variable. The lightweight matcher avoids
# loading the 1 GB CatBoost artifact and works within the free 512 MB instance.
ENV CURECAST_RETRIEVER_MODE=keyword
ENV OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    MALLOC_ARENA_MAX=2
EXPOSE 10000

CMD ["sh", "-c", "gunicorn --preload --bind 0.0.0.0:${PORT:-10000} --timeout 120 --workers 1 backend.main:app"]
