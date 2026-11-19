import { Module } from '@nestjs/common';
import { InMemoryLeaveBalancesSource } from './in-memory-leave-balances.source';
import { LeaveBalancesController } from './leave-balances.controller';
import { LeaveBalancesService } from './leave-balances.service';
import { LEAVE_BALANCES_SOURCE } from './leave-balances.source';

@Module({
  controllers: [LeaveBalancesController],
  providers: [
    LeaveBalancesService,
    {
      provide: LEAVE_BALANCES_SOURCE,
      useFactory: () => {
        const source = new InMemoryLeaveBalancesSource();
        if (process.env.LEAVE_BALANCES_DEV_SEED === 'true') {
          source.seed('dev-employee', [
            { leaveTypeId: 'annual', leaveTypeName: 'Annual leave', openingDays: 10, approvedDays: 0, pendingDays: 3, pendingFrom: '2026-12-08', pendingTo: '2026-12-10' },
            { leaveTypeId: 'sick', leaveTypeName: 'Sick leave', openingDays: 4.5, approvedDays: 0, pendingDays: 0, pendingFrom: null, pendingTo: null },
            { leaveTypeId: 'casual', leaveTypeName: 'Casual leave', openingDays: null, approvedDays: 0, pendingDays: 0, pendingFrom: null, pendingTo: null },
          ]);
        }
        return source;
      },
    },
  ],
})
export class LeaveBalancesModule {}
