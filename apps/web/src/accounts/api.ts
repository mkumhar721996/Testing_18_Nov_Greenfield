import type { AccountBalance, LinkedAccount } from './types'

const baseUrl = import.meta.env.VITE_API_URL ?? ''

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { signal })
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return (await response.json()) as T
}

export function fetchAccounts(signal?: AbortSignal): Promise<LinkedAccount[]> {
  return getJson<LinkedAccount[]>('/accounts', signal)
}

export function fetchAccountBalance(id: string, signal?: AbortSignal): Promise<AccountBalance> {
  return getJson<AccountBalance>(`/accounts/${encodeURIComponent(id)}`, signal)
}
