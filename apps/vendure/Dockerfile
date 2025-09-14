FROM node:20-alpine

WORKDIR /app

# Install build tools needed by some deps
RUN apk add --no-cache python3 make g++

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm ci --no-audit --no-fund

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]


