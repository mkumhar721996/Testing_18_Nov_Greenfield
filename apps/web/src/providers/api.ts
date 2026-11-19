// VITE_API_BASE_URL (build-time, optional): base URL of the Leave API. Unset means same-origin requests.
export interface ProviderListing {
  id: string
  name: string
  services: string[]
  towns: string[]
  averageRating: number | null
  reviewCount: number
}

// The API returns providers already ordered; the client never re-sorts.
export async function fetchProviders(signal?: AbortSignal): Promise<ProviderListing[]> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/providers`, { signal })
  if (!res.ok) throw new Error(`Providers request failed: ${res.status}`)
  const body = (await res.json()) as { providers: ProviderListing[] }
  return body.providers
}
