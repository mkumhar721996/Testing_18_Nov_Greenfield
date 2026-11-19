import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryLeaveBalancesSource } from './in-memory-leave-balances.source';
import { LeaveBalancesService } from './leave-balances.service';
import type { LeaveBalanceSourceRow } from './leave-balances.source';

function row(name: string, over: Partial<LeaveBalanceSourceRow> = {}): LeaveBalanceSourceRow {
  return {
    leaveTypeId: name.toLowerCase().replace(/\s+/g, '-'),
    leaveTypeName: name,
    openingDays: 10,
    approvedDays: 0,
    pendingDays: 0,
    pendingFrom: null,
    pendingTo: null,
    ...over,
  };
}

describe('LeaveBalancesService', () => {
  let source: InMemoryLeaveBalancesSource;
  let service: LeaveBalancesService;

  beforeEach(() => {
    source = new InMemoryLeaveBalancesSource();
    service = new LeaveBalancesService(source);
  });

  it('shows a balance for each configured leave type, including opening 0 (AC1)', async () => {
    source.seed('emp-a', [row('Annual leave', { openingDays: 10 }), row('Sick leave', { openingDays: 0 })]);
    const res = await service.getForEmployee('emp-a');
    expect(res.balances.map((b) => b.leaveTypeName)).toEqual(['Annual leave', 'Sick leave']);
    expect(res.balances[1].balanceDays).toBe(0);
  });

  it('shows whole days, truncating 4.5 to 4 (AC2, AC4)', async () => {
    source.seed('emp-a', [row('Sick leave', { openingDays: 4.5 })]);
    const [b] = (await service.getForEmployee('emp-a')).balances;
    expect(Number.isInteger(b.balanceDays)).toBe(true);
    expect(b.balanceDays).toBe(4);
  });

  it('shows only the requesting employee’s balances (AC3)', async () => {
    source.seed('emp-a', [row('Annual leave', { openingDays: 10 })]);
    source.seed('emp-b', [row('Annual leave', { openingDays: 99 })]);
    const res = await service.getForEmployee('emp-a');
    expect(res.balances).toHaveLength(1);
    expect(res.balances[0].balanceDays).toBe(10);
  });

  it('deducts pending days from the balance and returns them separately (AC5, AC6)', async () => {
    source.seed('emp-a', [
      row('Annual leave', { openingDays: 10, pendingDays: 3, pendingFrom: '2026-12-08', pendingTo: '2026-12-10' }),
    ]);
    const [b] = (await service.getForEmployee('emp-a')).balances;
    expect(b.balanceDays).toBe(7);
    expect(b.pendingDays).toBe(3);
    expect(b.pendingFrom).toBe('2026-12-08');
    expect(b.pendingTo).toBe('2026-12-10');
  });

  it('deducts approved days too', async () => {
    source.seed('emp-a', [row('Annual leave', { openingDays: 10, approvedDays: 3 })]);
    const [b] = (await service.getForEmployee('emp-a')).balances;
    expect(b.balanceDays).toBe(7);
  });

  it('returns no balances when no leave types are configured (AC7)', async () => {
    expect((await service.getForEmployee('emp-none')).balances).toEqual([]);
  });

  it('returns a null balance when HR entered no opening balance (AC8)', async () => {
    source.seed('emp-a', [row('Annual leave', { openingDays: null })]);
    expect((await service.getForEmployee('emp-a')).balances[0].balanceDays).toBeNull();
  });
});
