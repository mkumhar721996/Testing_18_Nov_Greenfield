export interface LeaveBalanceDto {
  leaveTypeId: string;
  leaveTypeName: string;
  /** Whole days for a non-negative balance; a negative balance is shown as-is. */
  balanceDays: number;
  /** Shown separately, never subtracted. */
  pendingDays: number;
  pendingFrom: string | null;
  pendingTo: string | null;
}

export interface LeaveBalancesResponse {
  asOf: string;
  balances: LeaveBalanceDto[];
}
