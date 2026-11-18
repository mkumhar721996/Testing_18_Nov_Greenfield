export type OfferType = 'personal-loan' | 'card-upgrade'
export interface EligibleOffer {
  type: OfferType
  headline?: string
}

export async function fetchEligibleOffers(signal?: AbortSignal): Promise<EligibleOffer[]> {
  const res = await fetch('/offers', { signal })
  if (!res.ok) {
    throw new Error(`Offers request failed with status ${res.status}`)
  }
  const body = (await res.json()) as { offers: EligibleOffer[] }
  return body.offers
}
