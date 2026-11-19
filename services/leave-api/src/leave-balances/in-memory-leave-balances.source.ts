import { Injectable } from '@nestjs/common';
import type { LeaveBalanceSourceRow, LeaveBalancesSource } from './leave-balances.source';

/** Interim source until HR Reporting & Administration and Leave Request supply real data. Empty by default. */
@Injectable()
export class InMemoryLeaveBalancesSource implements LeaveBalancesSource {
  private readonly rows = new Map<string, LeaveBalanceSourceRow[]>();

  seed(employeeId: string, rows: LeaveBalanceSourceRow[]): void {
    this.rows.set(employeeId, rows);
  }

  async findForEmployee(employeeId: string): Promise<LeaveBalanceSourceRow[]> {
    return this.rows.get(employeeId) ?? [];
  }
}
