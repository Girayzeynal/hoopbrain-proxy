FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Gereken Python paketleri
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Uygulama kodu
COPY . /app

ENV PORT=8080

CMD ["gunicorn", "-b", "0.0.0.0:8080", "main:app"] 
