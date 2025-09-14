import 'reflect-metadata';
import 'dotenv/config';
import { bootstrap, Logger, DefaultLogger, LogLevel, mergeConfig, defaultConfig } from '@vendure/core';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
// import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
// import { MercadoPagoPlugin, mercadoPagoHandler } from './plugins/mercadopago/MercadoPagoPlugin.js';
//

const db: Omit<PostgresConnectionOptions, 'type'> = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'vendure',
  password: process.env.DB_PASSWORD || 'vendure',
  database: process.env.DB_NAME || 'vendure',
};

const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
const config = mergeConfig(defaultConfig, {
  apiOptions: {
    port: Number(process.env.PORT || 3000),
    cors: allowedOrigin
      ? { origin: [allowedOrigin], credentials: true, methods: 'GET,POST,PUT,DELETE,OPTIONS' }
      : { origin: true, credentials: true },
  },
  dbConnectionOptions: {
    type: 'postgres',
    ...db,
    synchronize: true,
    logging: false,
  },
  paymentOptions: {
    paymentMethodHandlers: [],
  },
  plugins: [],
});

bootstrap(config)
  .then(app => {
    Logger.useLogger(new DefaultLogger({ level: LogLevel.Info }));
    Logger.info('Vendure iniciado');
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });


