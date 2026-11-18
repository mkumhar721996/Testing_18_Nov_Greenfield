import { describe, expect, it, vi } from 'vitest';
import type { EntraUser, ExistingEmployee, PendingApproval, SyncPlan } from './plan-sync.js';
import { runSyncWithRetry, type RunCounts, type RunStatus, type SyncStore } from './run-sync.js';

function user(over: Partial<EntraUser> = {}): EntraUser {
  return {
    id: 'e1',
    displayName: 'Asha Rao',
    email: 'asha@example.test',
    jobTitle: null,
    department: null,
    accountEnabled: true,
    managerId: null,
    ...over,
  };
}

class MemoryStore implements SyncStore {
  employees = new Map<string, ExistingEmployee>();
  approvals = new Map<string, PendingApproval>();
  runs: { status: RunStatus; attempt: number; counts: RunCounts; error: string | null }[] = [];
  applied = 0;

  async load() {
    return { employees: [...this.employees.values()], approvals: [...this.approvals.values()] };
  }
  async apply(plan: SyncPlan) {
    this.applied++;
    for (const id of plan.deactivate) {
      for (const e of this.employees.values()) if (e.id === id) e.active = false;
    }
    for (const c of plan.create) {
      this.employees.set(c.entraId, { id: `${c.entraId}-uuid`, ...c });
    }
  }
  async startRun(attempt: number) {
    this.runs.push({ status: 'failed', attempt, counts: {} as RunCounts, error: null });
    return String(this.runs.length - 1);
  }
  async finishRun(runId: string, status: RunStatus, counts: RunCounts, error: string | null) {
    Object.assign(this.runs[Number(runId)], { status, counts, error });
  }
}

const setup = (fetchUsers: () => Promise<EntraUser[]>) => {
  const store = new MemoryStore();
  const sleep = vi.fn().mockResolvedValue(undefined);
  const log = vi.fn();
  return { store, sleep, log, run: () => runSyncWithRetry({ fetch: fetchUsers, store, sleep, log }) };
};

describe('runSyncWithRetry', () => {
  it('retries with backoff until the fetch succeeds', async () => {
    const fetchUsers = vi
      .fn()
      .mockRejectedValueOnce(new Error('x'))
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValue([user()]);
    const { store, sleep, run } = setup(fetchUsers);

    expect(await run()).toBe('succeeded');

    expect(fetchUsers).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 60_000);
    expect(sleep).toHaveBeenNthCalledWith(2, 300_000);
    expect(store.runs.map((r) => r.status)).toEqual(['failed', 'failed', 'succeeded']);
  });

  it('gives up after four failures and applies nothing', async () => {
    const { store, run } = setup(vi.fn().mockRejectedValue(new Error('down')));
    expect(await run()).toBe('failed');
    expect(store.runs).toHaveLength(4);
    expect(store.runs.at(-1)?.status).toBe('failed');
    expect(store.applied).toBe(0);
  });

  it('does not retry a non-retryable error', async () => {
    const err = Object.assign(new Error('forbidden'), { retryable: false });
    const fetchUsers = vi.fn().mockRejectedValue(err);
    const { run } = setup(fetchUsers);
    await run();
    expect(fetchUsers).toHaveBeenCalledTimes(1);
  });

  it('treats an empty snapshot as a failed fetch and applies nothing', async () => {
    const { store, run } = setup(vi.fn().mockResolvedValue([]));
    expect(await run()).toBe('failed');
    expect(store.applied).toBe(0);
  });

  it('records partial with skipped counted when entries have no id', async () => {
    const { store, run } = setup(vi.fn().mockResolvedValue([user(), user({ id: '' })]));
    expect(await run()).toBe('partial');
    expect(store.runs.at(-1)?.counts).toMatchObject({ fetched: 2, created: 1, skipped: 1 });
  });

  it('AC12: a deactivated employee and their approvals stay in the store', async () => {
    const { store, run } = setup(vi.fn().mockResolvedValue([user({ id: 'other' })]));
    store.employees.set('e1', {
      id: 'e1-uuid',
      entraId: 'e1',
      displayName: 'Asha Rao',
      email: null,
      jobTitle: null,
      department: null,
      managerEntraId: null,
      active: true,
    });
    store.approvals.set('a1', { id: 'a1', employeeId: 'e1-uuid', status: 'pending', routedManagerId: null });

    await run();

    expect(store.employees.get('e1')).toBeDefined();
    expect(store.employees.get('e1')?.active).toBe(false);
    expect(store.approvals.get('a1')).toBeDefined();
  });

  it('logs no display name or email', async () => {
    const { log, run } = setup(vi.fn().mockResolvedValue([user()]));
    await run();
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain('Asha');
    expect(logged).not.toContain('asha@example.test');
  });
});
