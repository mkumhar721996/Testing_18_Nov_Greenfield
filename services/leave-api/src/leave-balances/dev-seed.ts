import { InMemoryLeaveBalancesSource } from './in-memory-leave-balances.source';

/** Small fixture for local development, loaded only when LEAVE_BALANCES_DEV_SEED=true. */
export function seedDevBalances(source: InMemoryLeaveBalancesSource): void {
  source.seed('emp-a', [
    {
      leaveTypeId: 'annual',
      leaveTypeName: 'Annual leave',
      openingDays: 10,
      approvedDays: 0,
      pendingDays: 3,
      pendingFrom: '2026-12-08',
      pendingTo: '2026-12-10',
    },
    {
      leaveTypeId: 'sick',
      leaveTypeName: 'Sick leave',
      openingDays: 4.5,
      approvedDays: 0,
      pendingDays: 0,
      pendingFrom: null,
      pendingTo: null,
    },
  ]);
  source.seed('emp-b', [
    {
      leaveTypeId: 'annual',
      leaveTypeName: 'Annual leave',
      openingDays: 99,
      approvedDays: 0,
      pendingDays: 0,
      pendingFrom: null,
      pendingTo: null,
    },
  ]);
}
