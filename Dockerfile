FROM python:3.11-slim

WORKDIR /app

# Sistem bağımlılıkları (isteğe bağlı, gerekirse ekleriz)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# Python bağımlılıkları
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Uygulama kodu
COPY . /app/

ENV PYTHONUNBUFFERED=1 \
    PORT=8080

# FastAPI proxy
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
