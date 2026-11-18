const DAY_MS = 24 * 60 * 60 * 1000;

/** Next occurrence of "HH:MM" UTC strictly after `now`. */
export function nextRunAt(now: Date, timeUtc: string): Date {
  const [h, m] = timeUtc.split(':').map(Number);
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m));
  return next.getTime() > now.getTime() ? next : new Date(next.getTime() + DAY_MS);
}

export interface SchedulerOptions {
  /** False when the Entra settings are unset: the scheduler logs a warning and stays off. */
  enabled: boolean;
  timeUtc: string;
  runOnStart: boolean;
  run: () => Promise<unknown>;
  now?: () => Date;
  log?: (message: string) => void;
}

/** Runs the job daily with a timer. Returns a stop function. */
export function startScheduler(opts: SchedulerOptions): () => void {
  const { now = () => new Date(), log = console.log } = opts;
  if (!opts.enabled) {
    log('warning: Entra settings are not set, the employee sync scheduler is off');
    return () => {};
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guarded = () => opts.run().catch(() => log('entra sync run crashed'));
  const schedule = () => {
    const delay = nextRunAt(now(), opts.timeUtc).getTime() - now().getTime();
    timer = setTimeout(async () => {
      await guarded();
      schedule();
    }, delay);
  };
  if (opts.runOnStart) void guarded();
  schedule();
  return () => clearTimeout(timer);
}
