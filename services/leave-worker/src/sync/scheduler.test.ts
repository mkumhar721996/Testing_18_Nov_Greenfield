import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextRunAt, startScheduler } from './scheduler.js';

afterEach(() => vi.useRealTimers());

describe('nextRunAt', () => {
  it('is the next day when today has passed', () => {
    const next = nextRunAt(new Date('2026-01-10T21:00:00Z'), '20:30');
    expect(next.toISOString()).toBe('2026-01-11T20:30:00.000Z');
  });

  it('is today when still ahead', () => {
    const next = nextRunAt(new Date('2026-01-10T01:00:00Z'), '20:30');
    expect(next.toISOString()).toBe('2026-01-10T20:30:00.000Z');
  });
});

describe('startScheduler', () => {
  it('runs daily at the configured time', async () => {
    vi.useFakeTimers({ now: new Date('2026-01-10T21:00:00Z') });
    const run = vi.fn().mockResolvedValue(undefined);
    const stop = startScheduler({ enabled: true, timeUtc: '20:30', runOnStart: false, run, log: vi.fn() });

    await vi.advanceTimersByTimeAsync(23 * 3600_000);
    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3600_000);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(24 * 3600_000);
    expect(run).toHaveBeenCalledTimes(2);
    stop();
  });

  it('does not start when disabled and warns', async () => {
    vi.useFakeTimers({ now: new Date('2026-01-10T21:00:00Z') });
    const run = vi.fn();
    const log = vi.fn();
    startScheduler({ enabled: false, timeUtc: '20:30', runOnStart: true, run, log });
    await vi.advanceTimersByTimeAsync(48 * 3600_000);
    expect(run).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('warning'));
  });

  it('runs once at start when asked', () => {
    vi.useFakeTimers({ now: new Date('2026-01-10T21:00:00Z') });
    const run = vi.fn().mockResolvedValue(undefined);
    const stop = startScheduler({ enabled: true, timeUtc: '20:30', runOnStart: true, run, log: vi.fn() });
    expect(run).toHaveBeenCalledTimes(1);
    stop();
  });
});
