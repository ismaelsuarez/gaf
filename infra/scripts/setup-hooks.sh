#!/usr/bin/env bash

if ! command -v npx >/dev/null 2>&1; then
  echo "[hooks] npx no encontrado. Asegúrate de tener Node.js/npm instalado." >&2
  exit 1
fi

npx husky install || true
npx husky add .husky/pre-commit "npx lint-staged" || true
