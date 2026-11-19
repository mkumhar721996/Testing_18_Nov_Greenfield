import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchServiceCategories } from '../catalog/api'
import { fetchProviders, fetchTowns, type ProviderListing } from './api'
import './providers.css'

type Status = 'start' | 'loading' | 'ready' | 'empty' | 'error'
type Options = { status: 'loading' | 'ready' | 'error'; services: string[]; towns: string[] }
type Search = { service: string; town: string }

const SKELETON_IDS = ['one', 'two']

function StarIcon() {
  return (
    <svg className="icon providers-star" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  )
}

export function Providers() {
  const [options, setOptions] = useState<Options>({ status: 'loading', services: [], towns: [] })
  const [service, setService] = useState('')
  const [town, setTown] = useState('')
  const [status, setStatus] = useState<Status>('start')
  const [providers, setProviders] = useState<ProviderListing[]>([])
  // The search that produced the current results, so the heading does not change while the customer edits the form.
  const [searched, setSearched] = useState<Search | null>(null)
  const serviceRef = useRef<HTMLSelectElement>(null)
  const searchAbort = useRef<AbortController | null>(null)

  const loadOptions = useCallback((signal?: AbortSignal) => {
    setOptions({ status: 'loading', services: [], towns: [] })
    Promise.all([fetchServiceCategories(signal), fetchTowns(signal)]).then(
      ([categories, towns]) => {
        const services = categories.map((c) => c.name)
        const townNames = towns.map((t) => t.name)
        setOptions({ status: 'ready', services, towns: townNames })
        setService(services[0] ?? '')
        setTown(townNames[0] ?? '')
      },
      () => {
        if (!signal?.aborted) setOptions({ status: 'error', services: [], towns: [] })
      },
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadOptions(controller.signal)
    return () => controller.abort()
  }, [loadOptions])

  useEffect(() => () => searchAbort.current?.abort(), [])

  const runSearch = useCallback((chosen: Search) => {
    searchAbort.current?.abort()
    const controller = new AbortController()
    searchAbort.current = controller
    setSearched(chosen)
    setStatus('loading')
    fetchProviders(chosen, controller.signal).then(
      (found) => {
        setProviders(found)
        setStatus(found.length === 0 ? 'empty' : 'ready')
      },
      () => {
        if (!controller.signal.aborted) setStatus('error')
      },
    )
  }, [])

  const canSearch = options.status === 'ready' && service !== '' && town !== ''
  const count = providers.length

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
          <h1>Find a provider</h1>
          <p>Choose the service you need and the town where the job is. Anyone can search without signing in.</p>
        </div>
        <form
          className="card providers-search-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSearch) runSearch({ service, town })
          }}
        >
          <div className="field">
            <label htmlFor="service">Service</label>
            <select id="service" className="select" ref={serviceRef} value={service} onChange={(e) => setService(e.target.value)}>
              {options.services.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="town">City or town</label>
            <select
              id="town"
              className="select"
              aria-describedby="town-hint"
              value={town}
              onChange={(e) => setTown(e.target.value)}
            >
              {options.towns.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <span id="town-hint" className="field-hint">
              Only towns we cover are listed.
            </span>
          </div>
          <button className="btn btn-primary" type="submit" disabled={!canSearch || status === 'loading'}>
            {status === 'loading' ? 'Searching…' : 'Search providers'}
          </button>
        </form>

        {options.status === 'error' && (
          <div className="providers-state-box">
            <div className="alert alert-danger" role="alert">
              <strong>We couldn't search providers.</strong> Check your connection and try again.
            </div>
            <button className="btn btn-secondary" type="button" onClick={() => loadOptions()}>
              Try again
            </button>
          </div>
        )}
        {options.status !== 'error' && status === 'start' && (
          <p className="providers-start">
            Choose a service and a city or town to see providers who can do the job where you live.
          </p>
        )}
        {status === 'loading' && (
          <div className="providers-list" aria-busy="true">
            <p className="text-muted">Searching providers…</p>
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
          <div className="providers-state-box">
            <div className="alert alert-danger" role="alert">
              <strong>We couldn't search providers.</strong> Check your connection and try again. Your service and town are
              still selected.
            </div>
            <button className="btn btn-secondary" type="button" onClick={() => searched && runSearch(searched)}>
              Try again
            </button>
          </div>
        )}
        {status === 'empty' && searched && (
          <div className="empty-state">
            <h3>
              No providers match {searched.service} in {searched.town}.
            </h3>
            <p className="text-muted">Change the service or town and search again.</p>
            <button className="btn btn-secondary" type="button" onClick={() => serviceRef.current?.focus()}>
              Change search
            </button>
          </div>
        )}
        {status === 'ready' && searched && (
          <>
            <div className="providers-results-head" aria-live="polite">
              <h2>
                {searched.service} in {searched.town} · {count} {count === 1 ? 'provider' : 'providers'}
              </h2>
              <p>Best rated first</p>
            </div>
            <div className="providers-list" role="list" aria-label="Providers, best rated first">
              {providers.map((p) => (
                <div key={p.id} className="card providers-listing" role="listitem">
                  <div className="providers-listing-main">
                    <h3>{p.name}</h3>
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
          </>
        )}
      </main>
    </>
  )
}
