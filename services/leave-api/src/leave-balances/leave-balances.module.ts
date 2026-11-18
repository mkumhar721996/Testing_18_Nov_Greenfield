import { Module } from '@nestjs/common';
import { seedDevBalances } from './dev-seed';
import { InMemoryLeaveBalancesSource } from './in-memory-leave-balances.source';
import { LeaveBalancesController } from './leave-balances.controller';
import { LeaveBalancesService } from './leave-balances.service';
import { LEAVE_BALANCES_SOURCE } from './leave-balances.source';

@Module({
  controllers: [LeaveBalancesController],
  providers: [
    LeaveBalancesService,
    {
      // Replace with the PostgreSQL adapter once HR and Leave Request own the data model.
      provide: LEAVE_BALANCES_SOURCE,
      useFactory: () => {
        const source = new InMemoryLeaveBalancesSource();
        if (process.env.LEAVE_BALANCES_DEV_SEED === 'true') {
          seedDevBalances(source);
        }
        return source;
      },
    },
  ],
})
export class LeaveBalancesModule {}
