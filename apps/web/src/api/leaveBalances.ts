export type LeaveBalance = {
  leaveTypeId: string
  leaveTypeName: string
  /** Whole days, already worked out by the API; null = HR has not set an opening balance. */
  balanceDays: number | null
  pendingDays: number
  pendingFrom: string | null
  pendingTo: string | null
}

export type LeaveBalances = { asOf: string; balances: LeaveBalance[] }

export async function fetchMyLeaveBalances(): Promise<LeaveBalances> {
  const response = await fetch('/leave-balances/me')
  if (!response.ok) throw new Error(`Leave balances request failed (${response.status})`)
  return (await response.json()) as LeaveBalances
}
