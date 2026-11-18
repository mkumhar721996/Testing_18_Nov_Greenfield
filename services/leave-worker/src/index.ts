import pg from 'pg';
import { loadConfig } from './config.js';
import { fetchEntraUsers } from './entra/graph-client.js';
import { createApp } from './server.js';
import { PgSyncStore } from './sync/pg-sync-store.js';
import { runSyncWithRetry } from './sync/run-sync.js';
import { startScheduler } from './sync/scheduler.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const host = arg('host') ?? process.env.HOST ?? '127.0.0.1';
const port = Number(arg('port') ?? process.env.PORT ?? 3000);
const config = loadConfig();

createApp().listen(port, host, () => {
  console.log(`leave-worker listening on ${host}:${port}`);
});

const entra = config.entra;
const databaseUrl = config.databaseUrl;
const enabled = entra !== null && databaseUrl !== undefined;
const store = enabled ? new PgSyncStore(new pg.Pool({ connectionString: databaseUrl })) : null;

startScheduler({
  enabled,
  timeUtc: config.syncTimeUtc,
  runOnStart: config.syncRunOnStart,
  run: () =>
    runSyncWithRetry({
      fetch: () => fetchEntraUsers(entra!),
      store: store!,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    }),
});
