import { useCallback, useEffect, useState } from 'react'
import { fetchServiceCategories, type ServiceCategory } from './api'
import './catalog.css'

type State = { status: 'loading' | 'error' | 'ready'; categories: ServiceCategory[] }

const SKELETON_IDS = ['one', 'two', 'three', 'four']

export function Catalog() {
  const [state, setState] = useState<State>({ status: 'loading', categories: [] })

  const load = useCallback((signal?: AbortSignal) => {
    setState({ status: 'loading', categories: [] })
    fetchServiceCategories(signal).then(
      (categories) => setState({ status: 'ready', categories }),
      () => {
        if (!signal?.aborted) setState({ status: 'error', categories: [] })
      },
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const { status, categories } = state

  return (
    <>
      <header className="catalog-topbar">
        <strong className="catalog-logo">Service catalog</strong>
        <nav className="catalog-nav" aria-label="Main">
          <a href="#/catalog" aria-current="page">
            Browse services
          </a>
        </nav>
      </header>
      <main className="catalog-page">
        <div className="stack" aria-busy={status === 'loading'}>
          <h1>Service categories</h1>
          {status === 'loading' && (
            <>
              <p className="catalog-intro">Loading service categories…</p>
              <div className="grid">
                {SKELETON_IDS.map((id) => (
                  <div key={id} className="card catalog-skeleton">
                    <span className="skeleton" style={{ width: '40%' }} />
                    <span className="skeleton" />
                    <span className="skeleton" style={{ width: '80%' }} />
                  </div>
                ))}
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="alert alert-danger" role="alert">
                <strong>We couldn't load the service categories.</strong> Check your connection and try again.
              </div>
              <div>
                <button className="btn btn-secondary" type="button" onClick={() => load()}>
                  Try again
                </button>
              </div>
            </>
          )}
          {status === 'ready' && categories.length === 0 && (
            <div className="empty-state">
              <h3>No service categories are available right now.</h3>
              <p className="text-muted">Check back soon.</p>
            </div>
          )}
          {status === 'ready' && categories.length > 0 && (
            <>
              <p className="catalog-intro">Pick the kind of help you need. Each category shows what it covers.</p>
              <div className="grid" role="list">
                {categories.map((c) => (
                  <div key={c.id} className="card stack catalog-category" role="listitem">
                    <h3 className="card-title">{c.name}</h3>
                    <p>{c.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
