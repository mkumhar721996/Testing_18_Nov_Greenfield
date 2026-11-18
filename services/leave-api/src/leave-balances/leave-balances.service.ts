import { Inject, Injectable } from '@nestjs/common';
import { LeaveBalanceDto, LeaveBalancesResponse } from './leave-balances.dto';
import {
  LEAVE_BALANCES_SOURCE,
  LeaveBalanceSourceRow,
  LeaveBalancesSource,
} from './leave-balances.source';

@Injectable()
export class LeaveBalancesService {
  constructor(@Inject(LEAVE_BALANCES_SOURCE) private readonly source: LeaveBalancesSource) {}

  async getForEmployee(employeeId: string): Promise<LeaveBalancesResponse> {
    const rows = await this.source.findForEmployee(employeeId);
    return {
      asOf: new Date().toISOString().slice(0, 10),
      balances: rows.map(toDto),
    };
  }
}

function toDto(row: LeaveBalanceSourceRow): LeaveBalanceDto {
  // Derived on every read; pending days never enter the formula.
  const underlying = row.openingDays - row.approvedDays;
  return {
    leaveTypeId: row.leaveTypeId,
    leaveTypeName: row.leaveTypeName,
    balanceDays: underlying >= 0 ? Math.floor(underlying) : underlying,
    pendingDays: row.pendingDays,
    pendingFrom: row.pendingFrom,
    pendingTo: row.pendingTo,
  };
}
