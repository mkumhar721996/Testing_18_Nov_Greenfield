import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryLeaveBalancesSource } from './in-memory-leave-balances.source';
import { LeaveBalanceSourceRow } from './leave-balances.source';
import { LeaveBalancesService } from './leave-balances.service';

const row = (
  leaveTypeName: string,
  overrides: Partial<LeaveBalanceSourceRow> = {},
): LeaveBalanceSourceRow => ({
  leaveTypeId: leaveTypeName.toLowerCase().replace(/\s+/g, '-'),
  leaveTypeName,
  openingDays: 0,
  approvedDays: 0,
  pendingDays: 0,
  pendingFrom: null,
  pendingTo: null,
  ...overrides,
});

describe('LeaveBalancesService', () => {
  let source: InMemoryLeaveBalancesSource;
  let service: LeaveBalancesService;

  beforeEach(() => {
    source = new InMemoryLeaveBalancesSource();
    service = new LeaveBalancesService(source);
  });

  const balanceFor = async (overrides: Partial<LeaveBalanceSourceRow>) => {
    source.seed('emp-a', [row('Sick leave', overrides)]);
    return (await service.getForEmployee('emp-a')).balances[0];
  };

  it('AC1: returns a balance for each configured leave type, including zero', async () => {
    source.seed('emp-a', [
      row('Annual leave', { openingDays: 10 }),
      row('Sick leave', { openingDays: 0 }),
    ]);
    const res = await service.getForEmployee('emp-a');
    expect(res.balances.map((b) => b.leaveTypeName)).toEqual(['Annual leave', 'Sick leave']);
    expect(res.balances).toHaveLength(2);
  });

  it('AC1: returns no balances for an employee with nothing configured', async () => {
    expect((await service.getForEmployee('emp-none')).balances).toEqual([]);
  });

  it('AC2/AC7: shows a non-negative balance as whole days, rounded down', async () => {
    const b = await balanceFor({ openingDays: 4.5 });
    expect(Number.isInteger(b.balanceDays)).toBe(true);
    expect(b.balanceDays).toBe(4);
  });

  it('shows negative balances as they are, without rounding', async () => {
    expect((await balanceFor({ openingDays: 1, approvedDays: 1.5 })).balanceDays).toBe(-0.5);
    expect((await balanceFor({ openingDays: 0, approvedDays: 1.25 })).balanceDays).toBe(-1.25);
  });

  it('AC3: only returns the requested employee balances', async () => {
    source.seed('emp-a', [row('Annual leave', { openingDays: 10 })]);
    source.seed('emp-b', [row('Annual leave', { openingDays: 99 })]);
    const res = await service.getForEmployee('emp-a');
    expect(res.balances.map((b) => b.balanceDays)).toEqual([10]);
  });

  it('AC4/AC5: pending days are neither subtracted nor merged', async () => {
    const b = await balanceFor({
      openingDays: 10,
      pendingDays: 3,
      pendingFrom: '2026-12-08',
      pendingTo: '2026-12-10',
    });
    expect(b.balanceDays).toBe(10);
    expect(b.pendingDays).toBe(3);
    expect(b.pendingFrom).toBe('2026-12-08');
    expect(b.pendingTo).toBe('2026-12-10');
  });

  it('AC6: deducts approved days, derived rather than stored', async () => {
    source.seed('emp-a', [row('Annual leave', { openingDays: 10, approvedDays: 3 })]);
    const first = await service.getForEmployee('emp-a');
    const second = await service.getForEmployee('emp-a');
    expect(first.balances[0].balanceDays).toBe(7);
    expect(second.balances).toEqual(first.balances);
  });
});
