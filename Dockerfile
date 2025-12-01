FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev --legacy-peer-deps --prefer-online --force

COPY . .

EXPOSE 8080
CMD ["node", "server.js"]
