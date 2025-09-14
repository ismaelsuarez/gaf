#!/usr/bin/env sh

set -eu

echo "[smoke] Checking Vendure shop-api..."
curl -sf http://localhost:3000/shop-api > /dev/null
echo "OK"

echo "[smoke] Checking Storefront..."
curl -sf http://localhost:4000 > /dev/null
echo "OK"

echo "[smoke] All good"

