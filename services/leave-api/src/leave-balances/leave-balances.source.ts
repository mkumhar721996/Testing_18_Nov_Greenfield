export const LEAVE_BALANCES_SOURCE = Symbol('LEAVE_BALANCES_SOURCE');

export interface LeaveBalanceSourceRow {
  leaveTypeId: string;
  leaveTypeName: string;
  /** May be fractional, entered by HR. */
  openingDays: number;
  /** Sum of approved requests of this type. */
  approvedDays: number;
  /** Sum of pending requests of this type. */
  pendingDays: number;
  /** ISO date of the earliest pending request. */
  pendingFrom: string | null;
  pendingTo: string | null;
}

export interface LeaveBalancesSource {
  /** One row per active leave type, including types with no balance yet. */
  findForEmployee(employeeId: string): Promise<LeaveBalanceSourceRow[]>;
}
