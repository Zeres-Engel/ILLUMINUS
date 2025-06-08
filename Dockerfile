FROM nvcr.io/nvidia/pytorch:22.03-py3

ARG DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender1 \
    libfontconfig1 \
    libglib2.0-0 \
    tmux \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install additional dependencies for WebSocket and performance
RUN pip install --no-cache-dir \
    uvicorn[standard] \
    websockets \
    uvloop \
    httptools

# 🔥 OPTIMIZATION: Create all necessary directories including checkpoints
RUN mkdir -p /app/static/uploads \
    /app/static/results \
    /app/static/session/uploads \
    /app/static/session/results \
    /app/temp \
    /app/temp/websocket/session \
    /app/logs \
    /app/frontend/templates \
    /app/models \
    /app/data/checkpoints/face_detection \
    /app/data/checkpoints/wav2lip \
    /app/data/checkpoints/.torch

# Copy application code
COPY . .

# Set Python path and checkpoint environment
ENV PYTHONPATH=/app
# 🔥 CHECKPOINT: Configure torch to use local checkpoints
ENV TORCH_HOME=/app/data/checkpoints/.torch
ENV CHECKPOINT_DIR=/app/data/checkpoints

# Expose the port the app runs on
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]