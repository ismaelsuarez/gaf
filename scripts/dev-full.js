const { spawn } = require('child_process');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

(async () => {
  try {
    await run('docker', ['compose', '-f', 'infra/docker-compose.yml', 'up', '-d', '--build']);
    // Optional: wait a bit for healthchecks
    console.log('[dev:full] Compose levantado. Iniciando sync-service (RUN_ONCE=true)...');
    await run('cross-env', ['RUN_ONCE=true', 'npm', '-w', '@gaf/sync-service', 'run', 'dev']).catch(() => {});
    console.log('[dev:full] Listo. Admin: http://localhost:3000/admin | Storefront: http://localhost:4000');
    console.log('[dev:full] Métricas sync (si dev): http://localhost:9090/metrics');
  } catch (e) {
    console.error('[dev:full] Error', e.message);
    process.exit(1);
  }
})();


