# Entorno Ecommerce con Vendure y Remix Storefront

Este proyecto levanta un entorno completo con Docker Compose:
- Postgres
- Vendure Server (Admin + APIs)
- Vendure Worker
- Storefront Remix Starter

## Levantar todo el entorno

```bash
docker-compose up
```

Todos los servicios usan `restart: unless-stopped` y healthchecks, por lo que Compose esperará a que Postgres esté saludable antes de iniciar Vendure y el Storefront.

## Accesos

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

### Auditoría / Seguridad básica

- Servicios en red dedicada `vendure_net`.
- Policies de reinicio `unless-stopped`.
- Healthchecks en Postgres y Vendure Server.
- Storefront corre como usuario no root dentro del contenedor.
