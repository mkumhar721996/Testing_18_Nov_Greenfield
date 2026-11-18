import type { EntraConfig } from './entra/graph-client.js';

export interface WorkerConfig {
  databaseUrl?: string;
  entra: EntraConfig | null;
  syncTimeUtc: string;
  syncRunOnStart: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const { ENTRA_TENANT_ID, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET } = env;
  const entra =
    ENTRA_TENANT_ID && ENTRA_CLIENT_ID && ENTRA_CLIENT_SECRET
      ? { tenantId: ENTRA_TENANT_ID, clientId: ENTRA_CLIENT_ID, clientSecret: ENTRA_CLIENT_SECRET }
      : null;
  return {
    databaseUrl: env.DATABASE_URL,
    entra,
    syncTimeUtc: env.ENTRA_SYNC_TIME_UTC ?? '20:30',
    syncRunOnStart: env.ENTRA_SYNC_RUN_ON_START === 'true',
  };
}
