import { Inject, Injectable } from '@nestjs/common';
import type { LeaveBalancesResponse } from './leave-balances.dto';
import { LEAVE_BALANCES_SOURCE } from './leave-balances.source';
import type { LeaveBalancesSource } from './leave-balances.source';

@Injectable()
export class LeaveBalancesService {
  constructor(@Inject(LEAVE_BALANCES_SOURCE) private readonly source: LeaveBalancesSource) {}

  async getForEmployee(employeeId: string): Promise<LeaveBalancesResponse> {
    const rows = await this.source.findForEmployee(employeeId);
    return {
      asOf: new Date().toISOString(),
      balances: rows.map((row) => ({
        leaveTypeId: row.leaveTypeId,
        leaveTypeName: row.leaveTypeName,
        // Derived on every read, never stored; trunc keeps whole days and never overstates a shortfall.
        balanceDays:
          row.openingDays === null
            ? null
            : Math.trunc(row.openingDays - row.approvedDays - row.pendingDays),
        pendingDays: row.pendingDays,
        pendingFrom: row.pendingFrom,
        pendingTo: row.pendingTo,
      })),
    };
  }
}
