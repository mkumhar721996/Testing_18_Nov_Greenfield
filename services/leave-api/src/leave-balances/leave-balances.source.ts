export const LEAVE_BALANCES_SOURCE = Symbol('LEAVE_BALANCES_SOURCE');

export interface LeaveBalanceSourceRow {
  leaveTypeId: string;
  leaveTypeName: string;
  /** null = HR has not entered an opening balance. */
  openingDays: number | null;
  /** Sum of approved requests of this type. */
  approvedDays: number;
  /** Sum of pending requests of this type. */
  pendingDays: number;
  /** ISO date of the earliest pending request. */
  pendingFrom: string | null;
  pendingTo: string | null;
}

/**
 * Reads leave types, opening balances and requests for one employee. An implementation must
 * return one row per configured leave type, including types with no opening balance.
 */
export interface LeaveBalancesSource {
  findForEmployee(employeeId: string): Promise<LeaveBalanceSourceRow[]>;
}
