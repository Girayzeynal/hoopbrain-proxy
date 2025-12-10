# ============================================================
# 🔥 HoopBrain Proxy — Python 3.11 lightweight Fly.io build
# ============================================================

FROM python:3.11-slim

# ---- Sistem paketleri (minimum) ----
RUN apt-get update && apt-get install -y \
    build-essential \
    libxml2-dev \
    libxslt1-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ---- Çalışma dizini ----
WORKDIR /app

# ---- Python bağımlılıkları ----
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ---- Uygulama dosyaları ----
COPY . .

# ---- Environment (Fly.io) ----
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# ---- Uygulamayı uvicorn ile çalıştır ----
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
