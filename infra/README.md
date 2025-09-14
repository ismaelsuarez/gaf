# Infraestructura: Desarrollo y Producción

## Versionado y pin de imágenes

- Postgres: `POSTGRES_TAG` (ej. `16.4-alpine`)
- Vendure: `VENDURE_IMAGE_TAG` (ej. `2.2.6`)
- Storefront: `STORE_FRONT_REF` (tag/branch/commit del repo)

Define estas variables en `.env` o en tu sistema de CI/CD (Secrets). No commitees secretos al repo.

## Desarrollo

- Orquestación: `docker compose -f infra/docker-compose.yml up`
- Servicios expuestos al host:
  - Postgres `5432`
  - Vendure `3000`
  - Storefront `4000`
- Healthchecks y `depends_on: condition: service_healthy` para Postgres y Vendure.
- Límites de recursos (best-effort): `deploy.resources.limits`.

## Producción

- Orquestación: `docker compose -f infra/docker-compose.prod.yml up -d --build`
- Reverse proxy: Traefik (TLS automático Let's Encrypt).
- Sólo expone `80/443`. Postgres/Vendure/Storefront no exponen puertos al host.
- Variables requeridas:
  - `ACME_EMAIL`
  - `VENDURE_DOMAIN` / `STOREFRONT_DOMAIN` (DNS apuntando al host)
  - `POSTGRES_TAG`, `VENDURE_IMAGE_TAG`, `STORE_FRONT_REF`
- Healthchecks y `depends_on: condition: service_healthy`.
- Límites de recursos: `deploy.resources.limits` por servicio.

## Notas de seguridad

- Mantener `ADMIN_PASSWORD` fuera del repo (usar secrets CI/CD).
- Habilitar HSTS y otras cabeceras en Traefik (middlewares) si aplica.
- Deshabilitar exposición de Postgres en entornos de staging/producción.
- Backups automáticos de Postgres y rotación de logs.
- Auditar versiones antes de actualizarlas (usar tags fijas en lugar de `latest`).

## Flujo recomendado (staging/producción)

1) Configurar DNS → `VENDURE_DOMAIN` y `STOREFRONT_DOMAIN`.
2) Exportar variables/tag en el entorno (o `.env` en staging):

```bash
export POSTGRES_TAG=16.4-alpine
export VENDURE_IMAGE_TAG=2.2.6
export STORE_FRONT_REF=main
export ACME_EMAIL=admin@dominio.com
export VENDURE_DOMAIN=admin.dominio.com
export STOREFRONT_DOMAIN=www.dominio.com
```

3) Desplegar:

```bash
docker compose -f infra/docker-compose.prod.yml up -d --build
```

4) Verificar certificados y endpoints (HTTPS).

5) Monitoreo y backups: configurar stack de logs/métricas y backup de volúmenes.
