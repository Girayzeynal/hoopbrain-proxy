FROM node:20-slim

# Çalışma klasörü
WORKDIR /app

# Sadece package dosyaları
COPY package*.json ./

# Burada HATA YAPAN KISMI DEĞİŞTİRİYORUZ:
# npm ci --omit=dev DEĞİL
RUN npm install --omit=dev

# Uygulamanın geri kalanı
COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"] 
