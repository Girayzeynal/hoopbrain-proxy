# HoopBrain Proxy - Final Dockerfile
# Basit, hafif, 512 MB Fly free limite uygun Node proxy imajı

FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Önce sadece package dosyaları (cache için)
COPY package*.json ./

# package-lock.json OLMADIĞI için npm ci KULLANMIYORUZ
# Normal install, dev dependency yok
RUN npm install --omit=dev --ignore-scripts \
    && npm cache clean --force

# Uygulamanın geri kalanı
COPY . .

# Prod mod
ENV NODE_ENV=production
ENV PORT=8080

# Fly iç port
EXPOSE 8080

# Entry point: server.js
CMD ["node", "server.js"] 
