# ---- BASE IMAGE ----
FROM node:20-alpine AS base

# ---- WORKDIR ----
WORKDIR /app

# ---- COPY PACKAGE FILES ----
COPY package.json package-lock.json* ./

# ---- INSTALL PROD DEPENDENCIES ----
RUN npm ci --only=production

# ---- COPY ALL PROJECT FILES ----
COPY . .

# ---- SET ENV ----
ENV NODE_ENV=production
ENV PORT=8080

# ---- EXPOSE PORT ----
EXPOSE 8080

# ---- START COMMAND ----
CMD ["npm", "start"] 
