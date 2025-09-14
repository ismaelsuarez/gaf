# sync-service

Servicio en Node.js + TypeScript para sincronizar productos desde Zetti hacia Vendure.

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` con las siguientes variables (ejemplo abajo):

- API_URL
- OAUTH_URL
- API_USER
- API_PASSWORD
- NODO_ID
- VENDURE_API_URL
- VENDURE_TOKEN
 - SYNC_BATCH_SIZE (default 50)
 - SYNC_CONCURRENCY (default 5)
 - METRICS_PORT (default 9090)

Ejemplo de `.env`:

```env
# Zetti
API_URL=
OAUTH_URL=
API_USER=
API_PASSWORD=
NODO_ID=

# Vendure Admin API
VENDURE_API_URL=http://localhost:3000/admin-api
VENDURE_TOKEN=

# Scheduler opcional
# SYNC_CRON=0 */6 * * *
# RUN_ONCE=true
```

## Comandos

- Desarrollo:
  ```bash
  npm run dev
  ```
- Construir:
  ```bash
  npm run build
  ```
- Ejecutar sincronización:
  ```bash
  npm run sync
  ```

## Cron de ejemplo

Ejecutar cada 6 horas:
```ts
import cron from 'node-cron';
import { runSync } from './src/sync';

cron.schedule('0 */6 * * *', async () => {
  await runSync();
});
```

## Métricas

- Endpoint HTTP: `/metrics` en `METRICS_PORT` (texto plano):
  - `sync_created`, `sync_updated`, `sync_errors` y `sync_finished_timestamp`.

