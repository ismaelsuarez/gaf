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

## 10) Servicio de sincronización (sync-service)

### Propósito

Servicio en Node.js + TypeScript para sincronizar productos desde la API externa de Zetti hacia Vendure (Admin GraphQL API), creando o actualizando productos, variantes, precios y stock; e incorporando la carga de imágenes (pendiente implementación de upload multipart según configuración de Assets).

### Estructura

```
sync-service/
  src/
    apiClient.ts        # Cliente Zetti (OAuth2 + endpoints)
    vendureClient.ts    # Cliente Vendure (GraphQL Admin)
    sync.ts             # Orquestación de sincronización
    index.ts            # Entry point (cron o ejecución única)
  package.json
  tsconfig.json
  README.md
  .env (basado en .env.example)
```

### Dependencias clave

- axios, graphql-request, dotenv, ts-node, node-cron

### Scripts disponibles

- `dev`: `ts-node src/index.ts`
- `build`: `tsc`
- `sync`: `ts-node src/sync.ts`

### Variables de entorno

- Zetti
  - `API_URL`
  - `OAUTH_URL`
  - `API_USER`
  - `API_PASSWORD`
  - `NODO_ID`
- Vendure
  - `VENDURE_API_URL` (Admin API)
  - `VENDURE_TOKEN` (token con permisos de admin)
- Scheduler (opcional)
  - `SYNC_CRON` (por defecto: `0 */6 * * *`)
  - `RUN_ONCE` (si `true`, ejecuta una vez y termina)

### Flujo funcional (src/sync.ts)

1. Autenticación OAuth2 contra Zetti (grant type password); almacenamiento y uso de `access_token` hasta expiración.
2. Productos: `POST /{nodo}/products/search` (grupo 2 E-Commerce).
3. Detalle: `POST /{nodo}/products/details-per-nodes` (campos `stock1`, `pvp`).
4. Categorías: `POST /{nodo}/products/groups-search` (Rubro, Marca, etc.) [opcional, se recupera para futuros mapeos].
5. Imagen: `GET /{nodo}/products/{id_producto}/image` (base64) [carga en Vendure pendiente de multipart].
6. Vendure:
   - Búsqueda por término/sku (consulta `search`).
   - Crear `Product` y `ProductVariant` si no existe.
   - Actualizar precio (`price`) y stock (`stockOnHand`) si ya existe la variante por `sku`.
7. Logging por producto: crear/actualizar/error.

Notas:
- Precios convertidos a minor units (céntimos) cuando aplica: `price = Math.round(pvp * 100)`.
- `sku` derivado de `code` o `id` del producto Zetti.

### Ejecución

- Una sola corrida:
  ```bash
  npm run sync
  ```
- Programado (cron) cada 6 horas por defecto:
  ```bash
  npm run dev
  ```
  - Configurable con `SYNC_CRON`.

### Consideraciones de auditoría

- Separación de responsabilidades por archivo (`apiClient`, `vendureClient`, `sync`).
- Control estricto de errores y logs en pasos críticos.
- Variables sensibles fuera del VCS (`.env` recomendado, gestionar secretos en CI/Runtime).
- Token de Vendure con permisos mínimos necesarios para mutaciones de productos.
- Pendiente: implementación de subida de `Asset` vía multipart conforme a `AssetServer` configurado; requiere endpoint y credenciales adecuados.

## 11) Cliente Vendure Admin API (`vendureClient.ts`)

### Funcionalidad implementada

- `searchProductsBySku(sku: string)`
  - Localiza variante por `sku` y devuelve el `product.id` y `variants { id, sku, stockOnHand, price }` del producto.
  - Loggea resumen: producto encontrado y cantidad de variantes.

- `createProduct(input)`
  - Crea `Product` con traducción `es` y opcionalmente `assetIds`/`facetValueIds`.
  - Crea variantes con `sku`, `price` (minor units) y `stockOnHand`.
  - Loggea `id` creado y cantidad de variantes.

- `updateProductVariant(input)`
  - Actualiza una variante por `id` o resuelve `id` vía `sku`.
  - Actualiza `price` (minor units) y/o `stockOnHand`.
  - Loggea confirmación de actualización.

- `createAssets(file: Buffer | base64, fileName?, mimeType?)`
  - Soporta Buffer o cadena base64 (con o sin prefijo `data:`) y usa multipart con `graphql-request`.
  - Retorna array de `assetId` creados. Loggea cantidad y advierte errores parciales.

### Configuración por entorno

- `VENDURE_API_URL` (Admin API)
- `VENDURE_TOKEN` (Bearer con permisos administrativos)

### Consideraciones

- Precios: usar minor units (p. ej. 15500 = $155,00).
- Errores: se capturan y se registran con contexto de operación.
- Uploads: requieren que la instancia soporte multipart en Admin API y permisos de creación de `Asset`.

## 12) Script de arranque (`scripts/bootstrap.sh`)

### Objetivo

Automatizar el arranque del entorno: creación de `.env` con defaults, build/levante de contenedores, espera de healthchecks y preparación de `sync-service`.

### Acciones que realiza

1. Crea `.env` en la raíz si no existe (usa defaults seguros para desarrollo).
2. Ejecuta `docker-compose up -d --build`.
3. Espera a Postgres y Vendure Server hasta que estén `healthy`.
4. Muestra URLs: Admin, Shop API y Storefront.
5. En `sync-service/`, ejecuta `npm install` y crea `sync-service/.env` si falta.

### Uso

```bash
bash scripts/bootstrap.sh
```

Notas:
- Requiere Docker/Compose instalados y puertos 3000/4000 libres.
- Completar credenciales reales en `sync-service/.env` antes de ejecutar el sincronizador.

