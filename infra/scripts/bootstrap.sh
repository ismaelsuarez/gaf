#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[BOOTSTRAP] Directorio: $ROOT_DIR"

# 1) Crear .env si no existe (opcional, el compose tiene defaults)
if [[ ! -f .env ]]; then
  cat > .env <<'EOF'
POSTGRES_USER=vendure
POSTGRES_PASSWORD=vendure
POSTGRES_DB=vendure
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin
EOF
  echo "[BOOTSTRAP] .env creado en raíz (puedes editarlo)."
else
  echo "[BOOTSTRAP] .env ya existe; se mantiene."
fi

# 2) Construir/levantar Docker Compose (desarrollo)
echo "[BOOTSTRAP] Levantando servicios con docker compose..."
docker compose -f infra/docker-compose.yml up -d --build

# 3) Esperar healthchecks
echo "[BOOTSTRAP] Esperando a que Postgres esté healthy..."
until docker inspect --format='{{json .State.Health.Status}}' vendure_postgres 2>/dev/null | grep -q '"healthy"'; do
  sleep 3
  printf '.'
done
echo " OK"

echo "[BOOTSTRAP] Esperando a que Vendure Server esté healthy..."
until docker inspect --format='{{json .State.Health.Status}}' vendure_server 2>/dev/null | grep -q '"healthy"'; do
  sleep 3
  printf '.'
done
echo " OK"

echo "[BOOTSTRAP] Endpoints:"
echo "  - Admin: http://localhost:3000/admin"
echo "  - Shop API: http://localhost:3000/shop-api"
echo "  - Storefront: http://localhost:4000"

# 4) Preparar sync-service (apps)
if [[ -d apps/sync-service ]]; then
  echo "[BOOTSTRAP] Instalando dependencias de apps/sync-service..."
  cd apps/sync-service
  if command -v npm >/dev/null 2>&1; then
    npm install
  else
    echo "[BOOTSTRAP][WARN] npm no está disponible en PATH; omitiendo instalación."
  fi
  if [[ ! -f .env ]]; then
    cat > .env <<'EOF'
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
EOF
    echo "[BOOTSTRAP] apps/sync-service/.env creado (completa credenciales)."
  fi
  cd "$ROOT_DIR"
fi

echo "[BOOTSTRAP] Listo. Usa 'docker ps' para verificar contenedores."



