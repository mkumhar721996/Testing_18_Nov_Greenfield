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

// Base URL of the Leave API. Empty (the default) means same-origin: the Vite dev proxy locally,
// and the reverse proxy that fronts both the Web App and the Leave API when deployed. Set
// VITE_LEAVE_API_BASE_URL at build time to call a separately hosted API (it must allow CORS with
// credentials for the Web App origin).
const baseUrl = (import.meta.env.VITE_LEAVE_API_BASE_URL ?? '').replace(/\/$/, '')

export async function fetchMyLeaveBalances(signal?: AbortSignal): Promise<LeaveBalancesResponse> {
  const res = await fetch(`${baseUrl}/leave-balances/me`, { signal, credentials: 'include' })
  if (!res.ok) {
    throw new Error(`Leave balances request failed with ${res.status}`)
  }
  return (await res.json()) as LeaveBalancesResponse
}
