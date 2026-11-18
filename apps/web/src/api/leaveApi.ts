export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type FormField = 'start' | 'end' | 'type'

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  days: number
  status: LeaveRequestStatus
  submittedOn: string
  note?: string
}

export interface LeaveTypeOption {
  id: string
  name: string
  availableDays: number
}

export interface Holiday {
  date: string
  name: string
}

export interface LeaveRequestOptions {
  leaveTypes: LeaveTypeOption[]
  holidays: Holiday[]
  approverName: string
}

export interface SubmitRequestInput {
  leaveTypeId: string
  startDate: string
  endDate: string
  note?: string
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly field?: FormField,
  ) {
    super(message)
  }
}

// Stand-in until Entra ID sign-in lands (ADR-0005): the Leave API's non-production guard reads this header.
const EMPLOYEE_ID = import.meta.env.VITE_EMPLOYEE_ID ?? 'emp-demo'

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/leave-requests${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-employee-id': EMPLOYEE_ID },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.code ?? 'unknown',
      body.message ?? 'Something went wrong. Try again.',
      body.field,
    )
  }
  return body as T
}

export const listRequests = () => call<LeaveRequest[]>('')
export const getOptions = () => call<LeaveRequestOptions>('/options')
export const submitRequest = (input: SubmitRequestInput) =>
  call<LeaveRequest>('', { method: 'POST', body: JSON.stringify(input) })
export const cancelRequest = (id: string) =>
  call<LeaveRequest>(`/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
