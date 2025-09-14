import 'dotenv/config';
import http from 'http';
import cron from 'node-cron';
import { runSync } from './sync';

let lastRunStatus: { created: number; updated: number; errors: number; finishedAt?: string } = {
  created: 0,
  updated: 0,
  errors: 0,
};

function startMetricsServer(port: number) {
  const server = http.createServer((req, res) => {
    if (req.url === '/metrics') {
      const body = `sync_created ${lastRunStatus.created}\n` +
                   `sync_updated ${lastRunStatus.updated}\n` +
                   `sync_errors ${lastRunStatus.errors}\n` +
                   (lastRunStatus.finishedAt ? `sync_finished_timestamp ${Date.parse(lastRunStatus.finishedAt)}\n` : '');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(body);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(port, () => console.log(`[METRICS] http://localhost:${port}/metrics`));
}

async function main() {
  const schedule = process.env.SYNC_CRON || '0 */6 * * *';
  const runOnce = process.env.RUN_ONCE === 'true';

  const metricsPort = Number(process.env.METRICS_PORT ?? 9090);
  startMetricsServer(metricsPort);

  const runWrapper = async () => {
    const before = Date.now();
    let created = 0, updated = 0, errors = 0;
    const originalLog = console.log;
    console.log = (msg?: any, ...args: any[]) => {
      if (typeof msg === 'string') {
        if (msg.includes('[SYNC] Finalizado -')) {
          const m = msg.match(/created=(\d+) updated=(\d+) errors=(\d+)/);
          if (m) { created = Number(m[1]); updated = Number(m[2]); errors = Number(m[3]); }
        }
      }
      originalLog(msg, ...args);
    };
    await runSync();
    lastRunStatus = { created, updated, errors, finishedAt: new Date().toISOString() };
    console.log = originalLog;
    console.log(`[METRICS] run ms=${Date.now() - before} created=${created} updated=${updated} errors=${errors}`);
  };

  if (runOnce) {
    await runWrapper();
    return;
  }

  console.log(`[SYNC] Programando cron: ${schedule}`);
  cron.schedule(schedule, async () => {
    try {
      await runWrapper();
    } catch (e) {
      console.error('[SYNC] Error en ejecución programada', e);
    }
  });
}

main().catch((e) => {
  console.error('[FATAL]', e);
  process.exit(1);
});



