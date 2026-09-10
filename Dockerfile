FROM python:3.10-slim

# Install system dependencies: Tesseract OCR + libs needed by opencv-python-headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (better Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Render provides the PORT env var at runtime and expects the app to bind to it
EXPOSE 5000

# Shell form so $PORT gets expanded at container start
CMD gunicorn --bind 0.0.0.0:${PORT:-5000} "app:create_app()"
