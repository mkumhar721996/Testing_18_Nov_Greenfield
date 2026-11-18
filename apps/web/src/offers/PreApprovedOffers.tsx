import { useCallback, useEffect, useState } from 'react'
import { OFFER_COPY, OFFER_ORDER, type Journey } from './offerCopy'
import { fetchEligibleOffers, type EligibleOffer, type OfferType } from './offersApi'

export type { Journey }

export interface PreApprovedOffersProps {
  load?: (signal?: AbortSignal) => Promise<EligibleOffer[]>
  onStartJourney?: (offer: OfferType, journey: Journey) => void
}

export function navigateToOffersJourney(offer: OfferType, journey: Journey): void {
  window.location.assign(`/offers-applications/${journey}?offer=${offer}`)
}

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; offers: EligibleOffer[] }

export function PreApprovedOffers({
  load = fetchEligibleOffers,
  onStartJourney = navigateToOffersJourney,
}: PreApprovedOffersProps) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [opening, setOpening] = useState<OfferType | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    load(controller.signal).then(
      (offers) => {
        if (!controller.signal.aborted) setState({ status: 'ready', offers })
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [load, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  if (state.status === 'loading') {
    return (
      <div className="offers" aria-hidden="true">
        <div className="offer-tiles">
          <span className="skeleton offer-skeleton" />
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="alert alert-danger offers" role="alert">
        <p>We couldn't load your offers.</p>
        <button type="button" className="btn btn-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    )
  }

  const tiles = OFFER_ORDER.flatMap((type) => {
    const offer = state.offers.find((o) => o.type === type)
    return offer ? [offer] : []
  })
  if (tiles.length === 0) return null

  return (
    <section className="offers" data-wf-id="pre-approved-offers">
      <h2>Pre-approved for you</h2>
      <div className="offer-tiles">
        {tiles.map((offer) => {
          const copy = OFFER_COPY[offer.type]
          const isOpening = opening === offer.type
          return (
            <div key={offer.type} className="card offer-tile" data-offer={offer.type}>
              <h3>{copy.title}</h3>
              {offer.headline && <div className="amount">{offer.headline}</div>}
              <span className="muted">{copy.description}</span>
              <button
                type="button"
                className={`btn ${copy.buttonClass}`}
                data-wf-id={copy.wfId}
                disabled={isOpening}
                onClick={() => {
                  setOpening(offer.type)
                  onStartJourney(offer.type, copy.journey)
                }}
              >
                {isOpening ? (
                  <>
                    <span className="spinner" aria-hidden="true" /> Opening…
                  </>
                ) : (
                  copy.action
                )}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
