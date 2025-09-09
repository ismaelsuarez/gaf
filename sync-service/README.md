# sync-service

Servicio en Node.js + TypeScript para sincronizar productos desde Zetti hacia Vendure.

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` basado en `.env.example` con las siguientes variables:

- API_URL
- OAUTH_URL
- API_USER
- API_PASSWORD
- NODO_ID
- VENDURE_API_URL
- VENDURE_TOKEN

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
