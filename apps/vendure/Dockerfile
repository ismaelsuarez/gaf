FROM node:20-alpine AS builder

WORKDIR /app

# Build tools
RUN apk add --no-cache python3 make g++

# Instalar dependencias (incluye dev para compilar)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund --legacy-peer-deps || npm install --no-audit --no-fund --legacy-peer-deps

# Compilar
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime minimal
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund --legacy-peer-deps || npm install --no-audit --no-fund --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]


