import { Injectable } from '@nestjs/common';
import {
  LanguageCode,
  Logger,
  Order,
  OrderService,
  PaymentMethodHandler,
  RequestContext,
  RequestContextService,
  VendurePlugin,
} from '@vendure/core';
import type { Request, Response } from 'express';

type MpPayment = { id: string; status: 'approved' | 'rejected' | 'in_process' | string };

@Injectable()
class MercadoPagoService {
  constructor(private orderService: OrderService) {}

  async fetchPayment(mpId: string, accessToken: string): Promise<MpPayment | null> {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as MpPayment;
  }

  async settleByPaymentId(ctx: RequestContext, mpId: string, accessToken: string): Promise<void> {
    const mp = await this.fetchPayment(mpId, accessToken);
    if (!mp) return;
    const orderCode = (mp as any).external_reference as string | undefined;
    if (!orderCode) return;
    const order = await this.orderService.findOneByCode(ctx, orderCode);
    if (!order) return;

    const status = mp.status;
    // Idempotencia best-effort: si el pago ya fue agregado con ese mpId, no duplicar
    const alreadyPaid = (order as any)?.payments?.some?.((p: any) => p?.metadata?.mpId === mpId) || false;
    if (status === 'approved') {
      if (!alreadyPaid) {
        await this.orderService.addPaymentToOrder(ctx, order.id, {
          method: 'mercado-pago',
          metadata: { mpId },
        });
      }
      return;
    }
    if (status === 'rejected') {
      // Podríamos cancelar o dejar registro; por ahora sólo registrar
      Logger.warn(`Pago rechazado MP id=${mpId} order=${orderCode}`);
      return;
    }
    if (status === 'in_process' || status === 'pending') {
      Logger.info(`Pago pendiente MP id=${mpId} order=${orderCode}`);
      return;
    }
  }
}

export const mercadoPagoHandler = new PaymentMethodHandler({
  code: 'mercado-pago',
  description: [{ languageCode: LanguageCode.es, value: 'Mercado Pago (Checkout API)' }],
  args: {
    accessToken: { type: 'string' },
    webhookSecret: { type: 'string', required: false },
    successUrl: { type: 'string' },
    failureUrl: { type: 'string' },
    pendingUrl: { type: 'string' },
  },
  createPayment: async (ctx, order, amount, args, metadata) => {
    const token = args.accessToken as string;
    const body = {
      items: order.lines.map(l => ({ title: l.productVariant.name, quantity: l.quantity, unit_price: (l.unitPriceWithTax / 100) })),
      external_reference: order.code,
      back_urls: {
        success: (args.successUrl as string) || process.env.MP_SUCCESS_URL,
        failure: (args.failureUrl as string) || process.env.MP_FAILURE_URL,
        pending: (args.pendingUrl as string) || process.env.MP_PENDING_URL,
      },
      auto_return: 'approved',
    };
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const initPoint = data.init_point || data.sandbox_init_point;
    return {
      amount,
      state: 'Authorized' as const,
      transactionId: data.id,
      metadata: { initPoint },
    };
  },
  settlePayment: async () => ({ success: true, state: 'Settled' } as any),
});

@VendurePlugin({
  imports: [],
  providers: [MercadoPagoService],
})
export class MercadoPagoPlugin {
  static init(app: any) {
    const logger = (msg: string, meta?: any) => {
      // minimal logger; can be replaced by pino
      // eslint-disable-next-line no-console
      console.info(`[MP] ${msg}`, meta || '');
    };
    app.post('/payments/mercadopago/webhook', expressJson(), async (req: Request, res: Response) => {
      try {
        const signature = req.headers['x-signature'] as string | undefined;
        const secret = process.env.MP_WEBHOOK_SECRET || '';
        if (!validateSignature(signature, secret, req)) {
          logger('firma inválida');
          return res.status(400).send('invalid');
        }
        const accessToken = process.env.MP_ACCESS_TOKEN || '';
        const id = (req.body?.data?.id || req.body?.id) as string;
        const service = app.get(MercadoPagoService);
        const rctx: RequestContextService = app.get(RequestContextService);
        const adminCtx: RequestContext = rctx.create({ apiType: 'admin' } as any);
        await service.settleByPaymentId(adminCtx, id, accessToken);
        logger('webhook procesado', { id });
        res.status(200).send('ok');
      } catch (e) {
        Logger.error('webhook error', (e as Error).message);
        res.status(500).send('error');
      }
    });
  }
}

function expressJson() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bodyParser = require('body-parser');
  return bodyParser.json({ type: '*/*' });
}

function validateSignature(signature: string | undefined, secret: string, req: Request): boolean {
  if (!secret) return true; // dev only
  if (!signature) return false;
  try {
    const crypto = require('crypto');
    const payload = JSON.stringify(req.body || {});
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return signature === hmac;
  } catch {
    return false;
  }
}


