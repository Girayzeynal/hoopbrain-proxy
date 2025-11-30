FROM node:20-slim

# Çalışma klasörü
WORKDIR /app

# Sadece paket dosyaları
COPY package*.json ./

# Prod bağımlılıkları
RUN npm install --production

# Uygulamanın kalan kısmı
COPY . .

# Env
ENV NODE_ENV=production
ENV PORT=8080

# Fly healthcheck vs.
EXPOSE 8080

CMD ["node", "server.js"] 
