# Storefront

## Checkout con Mercado Pago (plan)

- Redirección a Mercado Pago (Checkout API) y retorno con `success`/`failure`/`pending`.
- Webhook de confirmación en backend (Vendure plugin) para estado final.
- Sandbox: usar credenciales de prueba y usuarios de prueba.

Referencias:
- Checkout API: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/overview
- Referencia API: https://www.mercadopago.com.ar/developers/es/reference
- SDKs: https://www.mercadopago.com.ar/developers/es/docs/sdks-library/landing

## Configuración de VENDURE_API_URL

- En Docker (Compose), el frontend se comunica con el backend por el hostname interno del servicio:

```
VENDURE_API_URL=http://vendure_server:3000/shop-api
```

- En ejecución local fuera de Docker (cuando levantas el backend en tu host):

```
VENDURE_API_URL=http://localhost:3000/shop-api
```

Asegúrate de exportar esta variable al construir o ejecutar la app.
