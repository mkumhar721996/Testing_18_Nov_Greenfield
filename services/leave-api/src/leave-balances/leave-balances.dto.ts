export interface LeaveBalanceDto {
  leaveTypeId: string;
  leaveTypeName: string;
  /** Whole days; null = HR has not set an opening balance. */
  balanceDays: number | null;
  /** Shown separately from the balance. */
  pendingDays: number;
  pendingFrom: string | null;
  pendingTo: string | null;
}

export interface LeaveBalancesResponse {
  asOf: string;
  balances: LeaveBalanceDto[];
}
