# Node 20 LTS — Fly.io için ideal
FROM node:20-slim

# Çalışma dizini
WORKDIR /app

# Paketleri önce kopyala (cache için)
COPY package*.json ./

# Prod modunda kurulum
RUN npm install --production

# Uygulamanın geri kalanını kopyala
COPY . .

# Uygulama 8080'i dinliyor
EXPOSE 8080

# 0.0.0.0 üzerinde server.js çalıştır
CMD ["node", "server.js"]
