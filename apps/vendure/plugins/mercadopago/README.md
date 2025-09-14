# MercadoPagoPlugin (Vendure)

## Variables de entorno

- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET` (si aplica)
- `MP_SUCCESS_URL`
- `MP_FAILURE_URL`
- `MP_PENDING_URL`

## Pasos (sandbox/producción)

1. Crear credenciales (sandbox primero) en Mercado Pago.
2. Configurar webhook `POST /payments/mercadopago/webhook`.
3. Definir variables en `.env` / Secrets.
4. Habilitar método de pago en Admin y cargar parámetros (token/urls).

## Flujo

- createPayment: crea preferencia (Checkout API) y devuelve `init_point`.
- settlePayment: completado vía webhook (consulta GET /v1/payments/:id).

## Tests

- Validación de firma (placeholder, implementar HMAC según MCP Server).
- Estados: approved, pending, rejected.
