# ---- BASE IMAGE ----
FROM node:20-alpine AS base

# ---- WORKDIR ----
WORKDIR /app

# ---- COPY PACKAGE FILES ----
COPY package*.json ./

# ---- INSTALL DEPENDENCIES ----
RUN npm install --production

# ---- COPY ALL PROJECT FILES ----
COPY . .

# ---- ENV ----
ENV NODE_ENV=production
ENV PORT=8080

# ---- EXPOSE PORT ----
EXPOSE 8080

# ---- START COMMAND ----
CMD ["npm", "start"] 
