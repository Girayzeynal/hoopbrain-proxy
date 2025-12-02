# lightweight Python image
FROM python:3.11-slim

# Çöp paketleri temizlemek için temel araçlar
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama
COPY main.py /app/

# Fly.io port
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Gunicorn ile tek worker, düşük RAM
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8080", "main:app"]
