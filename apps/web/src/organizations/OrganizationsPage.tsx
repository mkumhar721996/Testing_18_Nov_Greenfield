import { useCallback, useEffect, useState } from 'react'
import { fetchOrganizations } from './api'
import AssignedOrganizationPanel from './AssignedOrganizationPanel'
import type { Organization } from './types'
import UnassignedOrganizationPanel from './UnassignedOrganizationPanel'

type Status = 'loading' | 'error' | 'ready'

export default function OrganizationsPage() {
  const [status, setStatus] = useState<Status>('loading')
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback((signal?: AbortSignal) => {
    setStatus('loading')
    fetchOrganizations(signal).then(
      (list) => {
        if (signal?.aborted) return
        setOrgs(list)
        setSelectedId((id) => (list.some((o) => o.id === id) ? id : null))
        setStatus('ready')
      },
      () => {
        if (!signal?.aborted) setStatus('error')
      },
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const selected = orgs.find((o) => o.id === selectedId) ?? null

  return (
    <div>
      <div className="lr-head">
        <div>
          <h1>Organizations</h1>
          <p aria-live="polite">
            {status === 'ready' ? `${orgs.length} ${orgs.length === 1 ? 'organization' : 'organizations'}` : ''}
          </p>
        </div>
      </div>

      <div className="og-grid">
        {status === 'loading' && (
          <div role="status" aria-label="Loading organizations" className="card">
            <div className="skeleton og-skel" />
            <div className="skeleton og-skel" />
            <div className="skeleton og-skel" />
          </div>
        )}

        {status === 'error' && (
          <div className="alert alert-danger og-error" role="alert">
            <span>Organizations could not be loaded. Check your connection and try again.</span>
            <button type="button" className="btn btn-secondary" onClick={() => load()}>
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && orgs.length === 0 && (
          <div className="empty-state">
            <p>
              <strong>No organizations yet</strong>
            </p>
          </div>
        )}

        {status === 'ready' && orgs.length > 0 && (
          <>
            <ul className="og-list" aria-label="Organizations">
              {orgs.map((o) => (
                <li key={o.id} className={`og-row${o.id === selectedId ? ' is-selected' : ''}`}>
                  <button
                    type="button"
                    className="og-select"
                    aria-current={o.id === selectedId ? 'true' : undefined}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <span>{o.name}</span>
                    {o.admin === null && <span className="badge">Admin unassigned</span>}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon og-more"
                    aria-label={`Open details for ${o.name}`}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <svg className="og-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <div>
              {selected === null ? (
                <div className="og-prompt">
                  <p>
                    <strong>Select an organization</strong>
                  </p>
                  <p>Choose a row to read its address, admin and contact.</p>
                </div>
              ) : selected.admin === null ? (
                <UnassignedOrganizationPanel organization={selected} />
              ) : (
                <AssignedOrganizationPanel organization={{ ...selected, admin: selected.admin }} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
