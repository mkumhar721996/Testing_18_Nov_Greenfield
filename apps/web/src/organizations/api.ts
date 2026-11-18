import type { Organization } from './types'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchOrganizations(signal?: AbortSignal): Promise<Organization[]> {
  const res = await fetch(`${baseUrl}/organizations`, { signal })
  if (!res.ok) throw new Error(`Organizations request failed: ${res.status}`)
  return res.json()
}
