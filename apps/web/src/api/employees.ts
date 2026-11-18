export type StatusFilter = 'active' | 'inactive' | 'all'

export interface Employee {
  id: string
  displayName: string
  email: string | null
  jobTitle: string | null
  department: string | null
  status: 'active' | 'inactive'
  manager: { id: string; displayName: string } | null
  flags: { noManager: boolean }
}

export interface LeaveApproval {
  id: string
  status: string
  routedManagerId: string | null
  createdAt: string
}

export interface EmployeeRecordData extends Employee {
  approvals: LeaveApproval[]
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`)
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return (await res.json()) as T
}

export function listEmployees(status: StatusFilter = 'active'): Promise<Employee[]> {
  return getJson(`/employees?status=${status}`)
}

export function getEmployee(id: string): Promise<EmployeeRecordData> {
  return getJson(`/employees/${encodeURIComponent(id)}`)
}
