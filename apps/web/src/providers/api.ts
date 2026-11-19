// VITE_API_BASE_URL (build-time, optional): base URL of the Leave API. Unset means same-origin requests.
export interface ProviderListing {
  id: string
  name: string
  services: string[]
  towns: string[]
  averageRating: number | null
  reviewCount: number
}

export interface Town {
  id: string
  name: string
}

export interface ProviderFilter {
  service: string
  town: string
}

// The API filters (service AND town) and orders; the client never re-filters or re-sorts. No credentials: the search is public.
export async function fetchProviders(filter?: ProviderFilter, signal?: AbortSignal): Promise<ProviderListing[]> {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const query = filter ? `?service=${encodeURIComponent(filter.service)}&town=${encodeURIComponent(filter.town)}` : ''
  const res = await fetch(`${base}/providers${query}`, { signal })
  if (!res.ok) throw new Error(`Providers request failed: ${res.status}`)
  const body = (await res.json()) as { providers: ProviderListing[] }
  return body.providers
}

export async function fetchTowns(signal?: AbortSignal): Promise<Town[]> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/towns`, { signal })
  if (!res.ok) throw new Error(`Towns request failed: ${res.status}`)
  const body = (await res.json()) as { towns: Town[] }
  return body.towns
}
