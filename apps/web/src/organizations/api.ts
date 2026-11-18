import type { Organization } from './types'

export async function fetchOrganizations(signal?: AbortSignal): Promise<Organization[]> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api'}/organizations`, { signal })
  if (!res.ok) throw new Error(`Organizations request failed: ${res.status}`)
  return (await res.json()) as Organization[]
}
