# ================================================================
# 🧠 HoopBrain Proxy Dockerfile (Fly.io 512 MB uyumlu)
# - Sadece Node.js proxy servisi çalıştırır.
# - FAZ-7.9 / FAZ-10 / FAZ-11 / FAZ-12 / FAZ-13 / FAZ-17 / FAZ-22 / FAZ-23
#   mantığı ana bot (zeynal-bot-core) tarafında; burası sadece HTTP proxy.
# ================================================================

# Küçük ve hafif base image
FROM node:20-alpine

# Güvenlik ve boyut için ortam değişkenleri
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Çalışma klasörü
WORKDIR /app

# ------------------------------------------------
# 1) Bağımlılıkları kur
#   - Sadece package.json / package-lock.json kopyalanır
#   - npm ci production modda (devDeps yok) → RAM/Disk tasarrufu
# ------------------------------------------------
COPY package*.json ./

RUN npm ci --only=production --ignore-scripts \
    && npm cache clean --force

# ------------------------------------------------
# 2) Uygulama kodunu kopyala
#    (server.js vs. ne varsa hepsi)
# ------------------------------------------------
COPY . .

# ------------------------------------------------
# 3) Fly.io için port bildir
# ------------------------------------------------
EXPOSE 8080

# ------------------------------------------------
# 4) Çalıştırma komutu
#    (node resmi imajında ENTRYPOINT = docker-entrypoint.sh,
#     biz sadece CMD ile server.js’i başlatıyoruz)
# ------------------------------------------------
CMD ["node", "server.js"] 
