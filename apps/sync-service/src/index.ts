import 'dotenv/config';
import cron from 'node-cron';
import { runSync } from './sync';

async function main() {
  const schedule = process.env.SYNC_CRON || '0 */6 * * *';
  const runOnce = process.env.RUN_ONCE === 'true';

  if (runOnce) {
    await runSync();
    return;
  }

  console.log(`[SYNC] Programando cron: ${schedule}`);
  cron.schedule(schedule, async () => {
    try {
      await runSync();
    } catch (e) {
      console.error('[SYNC] Error en ejecución programada', e);
    }
  });
}

main().catch((e) => {
  console.error('[FATAL]', e);
  process.exit(1);
});



