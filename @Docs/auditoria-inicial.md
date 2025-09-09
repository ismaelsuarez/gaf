# Auditoría inicial del entorno Vendure + Remix Storefront

- Fecha: 2025-09-09
- Responsable: Equipo de implementación
- Estado: Implementado y endurecido (compose + storefront)

## 1) Alcance

Implementación base orquestada con Docker Compose para un entorno de ecommerce compuesto por:
- Base de datos Postgres
- Vendure Server (Admin + Shop API)
- Vendure Worker
- Storefront Remix Starter

Incluye persistencia de datos, healthchecks, políticas de reinicio, red dedicada y ejecución no-root en el storefront.

## 2) Arquitectura y servicios

- Postgres
  - Imagen: `postgres:16-alpine`
  - Puerto expuesto: 5432
  - Healthcheck: `pg_isready`
  - Restart policy: `unless-stopped`
  - Volumen: `vendure_postgres_data:/var/lib/postgresql/data`

- Vendure Server
  - Imagen: `vendureio/server:latest`
  - Puertos: 3000:3000
  - Endpoints:
    - Admin: `http://localhost:3000/admin`
    - Shop API: `http://localhost:3000/shop-api`
  - Healthcheck: `wget -qO- http://localhost:3000/shop-api`
  - Restart policy: `unless-stopped`
  - Volumen de assets: `vendure_assets:/app/static/assets`
  - Dependencias: espera a Postgres saludable

- Vendure Worker
  - Imagen: `vendureio/server:latest`
  - Comando: `npm run start:worker`
  - Restart policy: `unless-stopped`
  - Dependencias: espera a Postgres saludable
  - Comparte `vendure_assets` con el server

- Storefront Remix
  - Imagen propia construida desde `storefront-remix-starter`
  - Puerto: 4000
  - Ejecuta como usuario no root (`app`)
  - Vars relevantes: `VENDURE_API_URL=http://vendure_server:3000/shop-api`, `PORT=4000`
  - Restart policy: `unless-stopped`
  - Dependencias: espera a Vendure Server saludable

- Red
  - Red dedicada: `vendure_net` (driver bridge)

## 3) Persistencia

- `vendure_postgres_data`: datos de Postgres
- `vendure_assets`: assets estáticos de Vendure (subidas, imágenes, etc.)

## 4) Variables de entorno (defaults aplicados en Compose)

- Base de datos
  - `POSTGRES_USER` (default: `vendure`)
  - `POSTGRES_PASSWORD` (default: `vendure`)
  - `POSTGRES_DB` (default: `vendure`)
- Vendure Superadmin
  - `ADMIN_EMAIL` (default: `admin@admin.com`)
  - `ADMIN_PASSWORD` (default: `admin`)
- Storefront
  - `VENDURE_API_URL` (default interno: `http://vendure_server:3000/shop-api`)

Nota: El uso de `${VAR:-default}` permite operar sin `.env`. Se recomienda crear `.env` para entornos auditados y gestionar secretos fuera del VCS.

## 5) Endpoints expuestos

- Vendure Admin: `http://localhost:3000/admin`
- Vendure Shop API: `http://localhost:3000/shop-api`
- Storefront: `http://localhost:4000`

## 6) Procedimiento de despliegue

1. Requisitos: Docker Desktop (Compose incluido), puertos 3000/4000 libres
2. En la raíz del proyecto:
   ```bash
   docker-compose up
   ```
3. Acceso inicial a Admin: `admin@admin.com` / `admin`

## 7) Endurecimiento aplicado

- Políticas de reinicio `unless-stopped` en todos los servicios
- Healthchecks en Postgres y Vendure Server, orquestación condicionada a estado saludable
- Red dedicada `vendure_net` para aislamiento de tráfico interno
- Storefront ejecutándose como usuario no root
- Instalación de dependencias del storefront sin dev (`npm ci --omit=dev`)

## 8) Hallazgos y recomendaciones (próximos pasos)

- Versionado estricto de imágenes
  - Pinnear tags a minor/patch (p.ej. `postgres:16.4-alpine`, `vendureio/server:<versión>`)
- Gestión de secretos
  - Evitar defaults en producción; usar `.env` cifrado o secretos de Docker/CI
- TLS y reverse proxy
  - Colocar Nginx/Traefik con certificados válidos; cerrar puertos directos si no son necesarios
- Backups y observabilidad
  - Backups automáticos de Postgres; métricas y logs centralizados
- Límites de recursos
  - Aplicar `deploy.resources.limits` para CPU/Mem en orquestadores compatibles
- Build del backend desde fuente (opcional)
  - Para control total en auditorías, compilar Vendure desde el repo oficial con `vendure/Dockerfile` y usar `build:` en Compose

## 9) Inventario de archivos relevantes

- `docker-compose.yml`: orquestación de servicios, red, healthchecks y volúmenes
- `storefront/Dockerfile`: build del storefront, usuario no root
- `README.md`: uso, accesos, notas de auditoría

---
Este documento resume el estado actual del entorno y las medidas de hardening aplicadas. Cualquier cambio futuro deberá reflejarse en una nueva versión dentro de `@Docs/`.
