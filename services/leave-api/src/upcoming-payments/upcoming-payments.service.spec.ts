import { afterEach, describe, expect, it } from 'vitest';
import { DuePayment } from './select-upcoming';
import { UpcomingPaymentsService } from './upcoming-payments.service';

const bill = (id: string, dueDate: string): DuePayment => ({ id, type: 'scheduled_bill', name: 'Bill', dueDate, amount: 100 });
const repo = (items: DuePayment[]) => ({ listDue: async () => items });
const now = new Date('2026-11-18T05:00:00Z');

describe('UpcomingPaymentsService', () => {
  afterEach(() => {
    delete process.env.UPCOMING_PAYMENTS_WINDOW_DAYS;
    delete process.env.UPCOMING_PAYMENTS_TIMEZONE;
  });

  it('returns an empty list when nothing is due in the window', async () => {
    const service = new UpcomingPaymentsService(repo([]));
    expect(await service.forCustomer('c1', now)).toEqual({ windowDays: 30, payments: [] });
  });

  it.each(['abc', '0', '-5', ''])('falls back to 30 days for window %j', async (value) => {
    process.env.UPCOMING_PAYMENTS_WINDOW_DAYS = value;
    const service = new UpcomingPaymentsService(repo([]));
    expect((await service.forCustomer('c1', now)).windowDays).toBe(30);
  });

  it('uses UPCOMING_PAYMENTS_WINDOW_DAYS and drops a day-20 payment at 14', async () => {
    process.env.UPCOMING_PAYMENTS_WINDOW_DAYS = '14';
    const service = new UpcomingPaymentsService(repo([bill('a', '2026-12-08')]));
    expect(await service.forCustomer('c1', now)).toEqual({ windowDays: 14, payments: [] });
  });

  it('computes today on the calendar date in the configured time zone', async () => {
    // 20:00Z on 17 Nov is already 18 Nov in Asia/Kolkata
    const service = new UpcomingPaymentsService(repo([bill('a', '2026-11-18')]));
    const r = await service.forCustomer('c1', new Date('2026-11-17T20:00:00Z'));
    expect(r.payments.map((p) => p.daysUntilDue)).toEqual([0]);
  });
});
