# Entorno Ecommerce con Vendure y Remix Storefront

Este proyecto levanta un entorno completo con Docker Compose:
- Postgres
- Vendure Server (Admin + APIs)
- Vendure Worker
- Storefront Remix Starter

## Levantar todo el entorno (desarrollo)

```bash
docker compose -f infra/docker-compose.yml up
```

Todos los servicios usan `restart: unless-stopped` y healthchecks, por lo que Compose esperará a que Postgres esté saludable antes de iniciar Vendure y el Storefront.

## Accesos (desarrollo)

- Vendure Admin: http://localhost:3000/admin
- Vendure API (Shop): http://localhost:3000/shop-api
- Storefront: http://localhost:4000

## Usuario inicial de Vendure

- Email: admin@admin.com
- Password: admin

## Variables de entorno básicas

Crea un archivo `.env` en la raíz (opcional, hay defaults). Ejemplo:

```env
POSTGRES_USER=vendure
POSTGRES_PASSWORD=vendure
POSTGRES_DB=vendure
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin
# Usada por storefront si la exportas en build/runtime (opcional)
# VENDURE_API_URL=http://vendure_server:3000/shop-api
```

## Persistencia

- Volumen `vendure_postgres_data`: datos de Postgres
- Volumen `vendure_assets`: assets de Vendure

## Notas

- Los contenedores del server y worker comparten la misma base de datos y assets.
- El storefront se construye desde `storefront-remix-starter` dentro de su propia imagen.

## Producción (compose con Traefik + TLS)

- Usa `docker-compose.prod.yml` con Traefik para TLS automático (Let's Encrypt) y dominios.
- Variables relevantes (usar `.env` o exportar en el shell):
  - `POSTGRES_TAG` (ej: `16.4-alpine`)
  - `VENDURE_IMAGE_TAG` (ej: `2.2.6`)
  - `STORE_FRONT_REF` (tag/branch/commit del storefront)
  - `VENDURE_DOMAIN` (ej: `admin.mi-dominio.com`)
  - `STOREFRONT_DOMAIN` (ej: `www.mi-dominio.com`)
  - `ACME_EMAIL` (email para certificados Let's Encrypt)

Despliegue:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Notas de seguridad:
- En prod no se exponen puertos de Postgres/Vendure/Storefront al host; sólo 80/443 en Traefik.
- Pinnea versiones: `POSTGRES_TAG`, `VENDURE_IMAGE_TAG` y `STORE_FRONT_REF`.

### Auditoría / Seguridad básica

- Servicios en red dedicada `vendure_net`.
- Policies de reinicio `unless-stopped`.
- Healthchecks en Postgres y Vendure Server.
- Storefront corre como usuario no root dentro del contenedor.

## Monorepo

Estructura:

```
/apps
  /vendure        # backend Vendure + worker (imagen oficial)
  /storefront     # frontend Remix (Dockerfile)
  /sync-service   # servicio Zetti → Vendure
/packages
  /config         # eslint, prettier, tsconfig base, jest
  /utils          # helpers comunes (zod, logger)
/infra            # docker-compose*, traefik, scripts
```

Scripts raíz sugeridos:

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc -p packages/config/tsconfig.base.json --noEmit",
    "format": "prettier --write .",
    "test": "echo 'no tests'"
  }
}
```

Producción:

```bash
docker compose -f infra/docker-compose.prod.yml up -d --build
```
