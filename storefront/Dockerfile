FROM node:20-alpine

WORKDIR /app

# Permite fijar una referencia del storefront (tag/branch/commit)
ARG STORE_FRONT_REF=main

# Clona el starter de Remix Storefront
RUN apk add --no-cache git \
  && git clone https://github.com/vendure-ecommerce/storefront-remix-starter.git . \
  && cd /app && git checkout "$STORE_FRONT_REF" || true \
  && rm -rf .git

# Instala dependencias y construye
RUN npm ci --omit=dev --no-audit --no-fund \
  && npm run build

ENV PORT=4000
EXPOSE 4000

# En tiempo de ejecución, VENDURE_API_URL se recibe por env
RUN addgroup -S app && adduser -S app -G app \
  && chown -R app:app /app
USER app
CMD ["npm", "start"]


