FROM node:20-alpine

# Çalışma klasörü
WORKDIR /app

# Sadece package.json kopyala (lock dosyası yok!)
COPY package.json ./

# Normal npm install kullan (npm ci yerine)
RUN npm install --production && npm cache clean --force

# Tüm kaynak dosyalarını kopyala
COPY . .

# Port
EXPOSE 8080

# Start
CMD ["node", "server.js"]
