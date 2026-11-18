export interface LeaveBalance {
  leaveTypeId: string
  leaveTypeName: string
  balanceDays: number
  pendingDays: number
  pendingFrom: string | null
  pendingTo: string | null
}

export interface LeaveBalancesResponse {
  asOf: string
  balances: LeaveBalance[]
}

export async function fetchMyLeaveBalances(signal?: AbortSignal): Promise<LeaveBalancesResponse> {
  const res = await fetch('/leave-balances/me', { signal })
  if (!res.ok) {
    throw new Error(`Leave balances request failed with ${res.status}`)
  }
  return (await res.json()) as LeaveBalancesResponse
}
