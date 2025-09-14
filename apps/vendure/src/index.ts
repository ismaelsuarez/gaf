import 'reflect-metadata';
import 'dotenv/config';
import { bootstrap, Logger, mergeConfig, OrderService, RequestContext, DefaultLogger } from '@vendure/core';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { MercadoPagoPlugin } from './plugins/mercado-pago';

const db = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'vendure',
  password: process.env.DB_PASSWORD || 'vendure',
  database: process.env.DB_NAME || 'vendure',
};

const config = mergeConfig({
  apiOptions: {
    port: Number(process.env.PORT || 3000),
  },
  dbConnectionOptions: {
    type: 'postgres',
    ...db,
    synchronize: true,
    logging: false,
  },
  plugins: [AdminUiPlugin.init({ route: 'admin', port: 3002 }), MercadoPagoPlugin],
});

bootstrap(config)
  .then(app => {
    Logger.useLogger(new DefaultLogger({ level: 'info' }));
    // inicializa webhook express
    // @ts-ignore
    MercadoPagoPlugin.initWebhook(app);
    Logger.info('Vendure iniciado con plugin MercadoPago');
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });


