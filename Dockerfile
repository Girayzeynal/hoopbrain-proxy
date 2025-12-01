# ====================================================================
# Dockerfile – HoopBrain Proxy F14 FINAL
# Fly.io 512MB memory optimized
# ====================================================================

FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
