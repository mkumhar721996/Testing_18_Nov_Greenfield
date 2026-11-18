import { useCallback, useEffect, useState } from 'react'
import { fetchOrganizations } from './api'
import AssignedOrganizationPanel from './AssignedOrganizationPanel'
import UnassignedOrganizationPanel from './UnassignedOrganizationPanel'
import type { Organization } from './types'

type Status = 'loading' | 'error' | 'ready'

function MoreIcon() {
  return (
    <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

export default function OrganizationsPage() {
  const [status, setStatus] = useState<Status>('loading')
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchOrganizations(controller.signal).then(
      (loaded) => {
        if (controller.signal.aborted) return
        setOrgs(loaded)
        setSelectedId((id) => (loaded.some((o) => o.id === id) ? id : null))
        setStatus('ready')
      },
      () => {
        if (!controller.signal.aborted) setStatus('error')
      },
    )
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }, [])

  const selected = orgs.find((o) => o.id === selectedId) ?? null
  const count = status === 'ready' ? `${orgs.length} ${orgs.length === 1 ? 'organization' : 'organizations'}` : ''

  return (
    <div className="screen">
      <div className="lr-head">
        <div>
          <h1>Organizations</h1>
          <p aria-live="polite">{count}</p>
        </div>
      </div>

      <div className="og-grid">
        {status === 'loading' && (
          <div className="og-span">
            <div role="status" aria-label="Loading organizations" className="card">
              <div className="skeleton og-skel" />
              <div className="skeleton og-skel" />
              <div className="skeleton og-skel" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="og-span">
            <div className="alert alert-danger og-error" role="alert">
              <span>Organizations could not be loaded. Check your connection and try again.</span>
              <button type="button" className="btn btn-secondary" onClick={retry}>
                Try again
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && orgs.length === 0 && (
          <div className="og-span">
            <div className="empty-state">
              <p>
                <strong>No organizations yet</strong>
              </p>
            </div>
          </div>
        )}

        {status === 'ready' && orgs.length > 0 && (
          <>
            <div>
              <ul className="og-list" aria-label="Organizations">
                {orgs.map((org) => (
                  <li key={org.id} className={`og-row${org.id === selectedId ? ' is-selected' : ''}`}>
                    <button
                      type="button"
                      className="og-select"
                      aria-current={org.id === selectedId ? 'true' : 'false'}
                      onClick={() => setSelectedId(org.id)}
                    >
                      <span>{org.name}</span>
                      {org.admin === null && <span className="badge">Admin unassigned</span>}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon og-more"
                      aria-label={`Open details for ${org.name}`}
                      onClick={() => setSelectedId(org.id)}
                    >
                      <MoreIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {selected === null ? (
                <div className="og-prompt">
                  <p>
                    <strong>Select an organization</strong>
                  </p>
                  <p>Choose a row to read its address, admin and contact.</p>
                </div>
              ) : selected.admin === null ? (
                <UnassignedOrganizationPanel org={selected} />
              ) : (
                <AssignedOrganizationPanel org={{ ...selected, admin: selected.admin }} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
