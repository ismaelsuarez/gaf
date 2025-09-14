# Integración Mercado Pago (plan de implementación)

## Objetivo

- Procesar pagos con Mercado Pago en Vendure y finalizar ordenes según estado del pago.
- Soporte de sandbox y credenciales segregadas por entorno.

## Backend (Vendure)

- Plugin `MercadoPagoPlugin` con:
  - Endpoint `POST /payments/mercadopago/webhook` para notificaciones.
  - Validación de firma (X-Signature) y consulta del pago con Access Token server-side.
  - Actualización de estado de Orden en Vendure según resultado (approved, rejected, pending).
- Variables en `.env` / Secrets CI:
  - `MP_ACCESS_TOKEN`
  - `MP_WEBHOOK_SECRET` (si aplica al esquema de firma)

## Frontend (Storefront)

- Flujo Checkout API:
  - Iniciar preferencia/orden → redirección a Mercado Pago.
  - Retorno a `success_url`/`failure_url`/`pending_url` y confirmación visual.
  - Estado final determinado por webhook en backend.
- Sandbox:
  - Usar usuarios y tarjetas de prueba de MP.

## Referencias

- Overview: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/overview
- Referencia API: https://www.mercadopago.com.ar/developers/es/reference
- SDKs: https://www.mercadopago.com.ar/developers/es/docs/sdks-library/landing

## Seguridad

- Las credenciales no deben comitearse; usar `.env` local y GitHub Secrets para CI.
- Validar firma del webhook y verificar el pago consultando la API antes de actualizar la orden.
