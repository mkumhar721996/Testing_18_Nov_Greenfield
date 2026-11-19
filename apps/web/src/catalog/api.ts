// VITE_API_BASE_URL (build-time, optional): base URL of the Leave API. Unset means same-origin requests.
export interface ServiceCategory {
  id: string
  name: string
  description: string
}

export async function fetchServiceCategories(signal?: AbortSignal): Promise<ServiceCategory[]> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/service-categories`, { signal })
  if (!res.ok) throw new Error(`Service categories request failed: ${res.status}`)
  const body = (await res.json()) as { categories: ServiceCategory[] }
  return body.categories
}
