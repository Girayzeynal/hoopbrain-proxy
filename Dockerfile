# ===============================
#  FAZ-14 HOOPBRAIN PROXY DOCKERFILE
# ===============================
FROM node:20-slim

# Çalışma dizini
WORKDIR /app

# Paketler
COPY package*.json ./
RUN npm ci --omit=dev

# Proje dosyaları
COPY . .

# Container health check
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD \
  ["node", "-e", "fetch('http://localhost:8080/ping').then(r=>{if(r.ok)process.exit(0); else process.exit(1)}).catch(()=>process.exit(1))"]

# Port
EXPOSE 8080

# Start
CMD ["node", "server.js"]
