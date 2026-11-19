import { useCallback, useEffect, useState } from 'react'
import { fetchProviders, type ProviderListing } from './api'
import './providers.css'

type State = { status: 'loading' | 'error' | 'ready'; providers: ProviderListing[] }

const SKELETON_IDS = ['one', 'two', 'three']

function StarIcon() {
  return (
    <svg className="icon providers-star" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  )
}

export function Providers() {
  const [state, setState] = useState<State>({ status: 'loading', providers: [] })

  const load = useCallback((signal?: AbortSignal) => {
    setState({ status: 'loading', providers: [] })
    fetchProviders(signal).then(
      (providers) => setState({ status: 'ready', providers }),
      () => {
        if (!signal?.aborted) setState({ status: 'error', providers: [] })
      },
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const { status, providers } = state

  return (
    <>
      <header className="providers-topbar">
        <strong>Service catalog</strong>
        <nav aria-label="Main">
          <a href="#/catalog">Browse services</a>
        </nav>
      </header>
      <main className="providers-page">
        <div className="providers-head">
          <h1>Providers</h1>
          <p>Best rated first. Providers with no ratings yet are listed last, A-Z.</p>
        </div>
        {status === 'loading' && (
          <div className="providers-list" aria-busy="true">
            <p className="text-muted">Loading providers…</p>
            {SKELETON_IDS.map((id) => (
              <div key={id} className="card stack">
                <span className="skeleton" style={{ width: '40%' }} />
                <span className="skeleton" style={{ width: '70%' }} />
                <span className="skeleton" style={{ width: '55%' }} />
              </div>
            ))}
          </div>
        )}
        {status === 'error' && (
          <div className="providers-list">
            <div className="alert alert-danger" role="alert">
              <strong>We couldn't load the providers.</strong> Check your connection and try again.
            </div>
            <div>
              <button className="btn btn-secondary" type="button" onClick={() => load()}>
                Try again
              </button>
            </div>
          </div>
        )}
        {status === 'ready' && providers.length === 0 && (
          <div className="empty-state">
            <h3>No providers match this service and town yet.</h3>
            <p className="text-muted">Try another town or a different service.</p>
          </div>
        )}
        {status === 'ready' && providers.length > 0 && (
          <div className="providers-list" role="list" aria-label="Providers, best rated first">
            {providers.map((p) => (
              <div key={p.id} className="card providers-listing" role="listitem">
                <div className="providers-listing-main">
                  <h2>{p.name}</h2>
                  <span>Covers: {p.services.join(', ')}</span>
                  <span>Towns: {p.towns.join(', ')}</span>
                </div>
                <div className="providers-listing-rating">
                  {p.averageRating === null ? (
                    <span className="chip">No ratings yet</span>
                  ) : (
                    <>
                      <span className="badge badge-success">
                        <StarIcon />
                        {p.averageRating} average
                      </span>
                      <small>
                        ({p.reviewCount} {p.reviewCount === 1 ? 'review' : 'reviews'})
                      </small>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
