FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy model and data files from root
COPY curecast_catboost_optimized.pkl ./curecast_catboost_optimized.pkl
COPY disease_list_with_counts.csv ./disease_list_with_counts.csv

# HuggingFace Spaces expects port 7860
EXPOSE 7860

CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "--workers", "1", "backend.main:app"]
