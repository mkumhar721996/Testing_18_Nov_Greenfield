import { planSync, type EntraUser, type ExistingEmployee, type PendingApproval, type SyncPlan } from './plan-sync.js';

export type RunStatus = 'succeeded' | 'partial' | 'failed';

export interface RunCounts {
  fetched: number;
  created: number;
  updated: number;
  deactivated: number;
  skipped: number;
}

export interface SyncStore {
  /** Returns a release function, or null when another instance is already syncing. */
  tryLock(): Promise<(() => Promise<void>) | null>;
  load(): Promise<{ employees: ExistingEmployee[]; approvals: PendingApproval[] }>;
  /** Applies the whole plan atomically: on failure nothing changes. */
  apply(plan: SyncPlan): Promise<void>;
  startRun(attempt: number): Promise<string>;
  finishRun(runId: string, status: RunStatus, counts: RunCounts, error: string | null): Promise<void>;
}

export interface RunSyncDeps {
  fetch: () => Promise<EntraUser[]>;
  store: SyncStore;
  sleep: (ms: number) => Promise<void>;
  backoffMs?: number[];
  log?: (message: string) => void;
}

const NO_COUNTS: RunCounts = { fetched: 0, created: 0, updated: 0, deactivated: 0, skipped: 0 };

/** Takes the cross-instance lock, so a concurrent run is skipped rather than interleaved. */
export async function runSyncWithRetry(deps: RunSyncDeps): Promise<RunStatus | 'skipped'> {
  const release = await deps.store.tryLock();
  if (!release) {
    (deps.log ?? console.log)('entra sync skipped: already running on another instance');
    return 'skipped';
  }
  try {
    return await attemptSync(deps);
  } finally {
    await release();
  }
}

/** Runs the sync up to backoffMs.length + 1 times; every attempt is recorded. Logs counts and error class only. */
async function attemptSync(deps: RunSyncDeps): Promise<RunStatus> {
  const { store, sleep, backoffMs = [60_000, 300_000, 900_000], log = console.log } = deps;
  const attempts = backoffMs.length + 1;
  let status: RunStatus = 'failed';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const runId = await store.startRun(attempt);
    let counts = NO_COUNTS;
    let errorClass: string | null = null;
    try {
      const users = await deps.fetch();
      if (users.length === 0) throw new Error('empty snapshot');
      const { employees, approvals } = await store.load();
      const plan = planSync(users, employees, approvals);
      counts = {
        fetched: users.length,
        created: plan.create.length,
        updated: plan.update.length,
        deactivated: plan.deactivate.length,
        skipped: plan.skipped,
      };
      if (plan.skipped === users.length) throw new Error('no usable entries');
      await store.apply(plan);
      status = plan.skipped > 0 ? 'partial' : 'succeeded';
    } catch (err) {
      status = 'failed';
      errorClass = err instanceof Error ? err.name : 'UnknownError';
      counts = NO_COUNTS;
      // Class only: driver errors can carry row values (e.g. Entra object ids) in their message.
      await store.finishRun(runId, status, counts, errorClass);
      log(`entra sync attempt ${attempt}/${attempts} failed (${errorClass})`);
      const retryable = !(err instanceof Error && (err as { retryable?: boolean }).retryable === false);
      if (!retryable || attempt === attempts) break;
      await sleep(backoffMs[attempt - 1]);
      continue;
    }
    await store.finishRun(runId, status, counts, null);
    log(`entra sync ${status}: ${JSON.stringify(counts)}`);
    return status;
  }
  return status;
}
