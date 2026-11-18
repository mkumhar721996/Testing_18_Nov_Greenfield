import { Injectable } from '@nestjs/common';
import { LeaveBalanceSourceRow, LeaveBalancesSource } from './leave-balances.source';

/**
 * Interim source until HR Reporting & Administration and Leave Request own the
 * real data model. Empty unless seeded.
 */
@Injectable()
export class InMemoryLeaveBalancesSource implements LeaveBalancesSource {
  private readonly rowsByEmployee = new Map<string, LeaveBalanceSourceRow[]>();

  seed(employeeId: string, rows: LeaveBalanceSourceRow[]): void {
    this.rowsByEmployee.set(employeeId, rows);
  }

  async findForEmployee(employeeId: string): Promise<LeaveBalanceSourceRow[]> {
    return this.rowsByEmployee.get(employeeId) ?? [];
  }
}
