# ============================================================
# 🐳 HoopBrain Proxy F15 - Dockerfile (Fly.io friendly)
# ============================================================
FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Sadece bağımlılık dosyalarını kopyala
COPY package.json package-lock.json ./

# NPM cache temizle + sadece prod bağımlılıkları kur
RUN npm cache clean --force \
    && npm install --omit=dev --prefer-online

# Şimdi uygulama kodunun geri kalanını kopyala
COPY . .

# Uygulamanın dinlediği port
EXPOSE 8080

# Start komutu
CMD ["npm", "start"] 
