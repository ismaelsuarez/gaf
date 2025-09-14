import { Args, Mutation, Resolver, VendurePlugin } from '@vendure/core';
import { Request, Response } from 'express';
import fetch from 'node-fetch';

@Resolver()
class MercadoPagoResolver {
  // placeholder for potential GraphQL mutations if needed
}

@VendurePlugin({
  imports: [],
  providers: [],
  shopApiExtensions: {
    schema: 'extend type Mutation { mercadoPagoInit(orderCode: String!): String! }',
    resolvers: [MercadoPagoResolver],
  },
})
export class MercadoPagoPlugin {
  static initWebhook(app: any) {
    app.post('/payments/mercadopago/webhook', expressJson(), async (req: Request, res: Response) => {
      try {
        const signature = req.headers['x-signature'] as string | undefined;
        // TODO: validar firma según doc de MP
        // @https://www.mercadopago.com.ar/developers/es/reference

        const body = req.body;
        // TODO: consultar estado del pago con Access Token de server y actualizar orden
        // @https://www.mercadopago.com.ar/developers/es/docs/checkout-api/overview

        res.status(200).send('OK');
      } catch (err) {
        res.status(400).send('ERROR');
      }
    });
  }
}

function expressJson() {
  // pequeña envoltura para evitar import de express directamente; Vendure expone app de express
  const bodyParser = require('body-parser');
  return bodyParser.json({ type: '*/*' });
}


