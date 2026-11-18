import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  cancelRequest,
  getOptions,
  listRequests,
  submitRequest,
  type LeaveRequest,
  type LeaveRequestOptions,
  type SubmitRequestInput,
} from '../api/leaveApi'
import { CancelModal } from '../components/CancelModal'
import { RequestDrawer } from '../components/RequestDrawer'
import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import { formatDate, formatRange, plural } from '../lib/dates'

type Load =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'ready'; requests: LeaveRequest[]; options: LeaveRequestOptions }

export function MyLeavePage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  const refresh = useCallback(async () => {
    try {
      const [requests, options] = await Promise.all([listRequests(), getOptions()])
      setLoad({ state: 'ready', requests, options })
    } catch {
      setLoad({ state: 'error' })
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const retry = () => {
    setLoad({ state: 'loading' })
    void refresh()
  }

  async function send(input: SubmitRequestInput) {
    await submitRequest(input)
    setDrawerOpen(false)
    if (load.state === 'ready') {
      setToast(`Request sent to ${load.options.approverName}. You'll be emailed when it's decided.`)
    }
    await refresh()
  }

  async function confirmCancel() {
    if (!cancelId) return
    setCancelling(true)
    try {
      await cancelRequest(cancelId)
      setToast('Request cancelled. It now shows as cancelled in your list.')
    } catch (error) {
      setToast(error instanceof ApiError ? error.message : 'Your request could not be cancelled. Try again.')
    }
    setCancelling(false)
    setCancelId(null)
    await refresh()
  }

  const ready = load.state === 'ready' ? load : null

  return (
    <div className="lr-page">
      <div className="lr-head">
        <div>
          <h1>My leave requests</h1>
          <p>Showing requests for you only. Leave is booked in whole days.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setDrawerOpen(true)} disabled={!ready}>
          Request leave
        </button>
      </div>

      {load.state === 'loading' && (
        <div role="status" aria-label="Loading your leave requests" className="card">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton lr-skel" />
          ))}
        </div>
      )}

      {load.state === 'error' && (
        <>
          <div className="alert alert-danger" role="alert">
            Your leave requests could not be loaded. Check your connection and try again.
          </div>
          <p style={{ marginTop: 'var(--space-3)' }}>
            <button type="button" className="btn btn-secondary" onClick={retry}>
              Try again
            </button>
          </p>
        </>
      )}

      {ready && ready.requests.length === 0 && (
        <div className="empty-state">
          <p>
            <strong>You haven't requested any leave yet.</strong>
          </p>
          <p>Your requests and their status will show here.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setDrawerOpen(true)}>
            Request leave
          </button>
        </div>
      )}

      {ready && ready.requests.length > 0 && (
        <div className="table-wrap">
          <table className="table" aria-label="Your leave requests">
            <thead>
              <tr>
                <th scope="col">Leave type</th>
                <th scope="col">Dates</th>
                <th scope="col">Days</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {ready.requests.map((r) => (
                <tr key={r.id}>
                  <td>{ready.options.leaveTypes.find((t) => t.id === r.leaveTypeId)?.name ?? r.leaveTypeId}</td>
                  <td>{formatRange(r.startDate, r.endDate)}</td>
                  <td>{plural(r.days)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{formatDate(r.submittedOn, true)}</td>
                  <td>
                    {r.status === 'pending' ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={`Cancel request for ${formatRange(r.startDate, r.endDate)}`}
                        onClick={() => setCancelId(r.id)}
                      >
                        Cancel request
                      </button>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ready && (
        <>
          <RequestDrawer open={drawerOpen} options={ready.options} onSubmit={send} onClose={() => setDrawerOpen(false)} />
          <CancelModal
            open={cancelId !== null}
            approverName={ready.options.approverName}
            busy={cancelling}
            onConfirm={confirmCancel}
            onClose={() => setCancelId(null)}
          />
        </>
      )}
      <Toast message={toast} onDone={clearToast} />
    </div>
  )
}
