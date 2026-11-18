import { useCallback, useEffect, useState } from 'react'
import { fetchMyLeaveBalances, type LeaveBalancesResponse } from '../../api/leaveBalances'
import LeaveBalanceCard from './LeaveBalanceCard'
import { formatFullDate } from './formatPendingRange'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: LeaveBalancesResponse }

export default function LeaveBalancesPage() {
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback((signal?: AbortSignal) => {
    setState({ status: 'loading' })
    fetchMyLeaveBalances(signal).then(
      (data) => setState({ status: 'ready', data }),
      () => {
        if (!signal?.aborted) setState({ status: 'error' })
      },
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return (
    <div>
      <div className="lb-head">
        <h1>My leave balances</h1>
        <p>Showing balances for you only. Balances are shown in whole days.</p>
      </div>

      {state.status === 'loading' && (
        <div className="grid" role="status" aria-label="Loading your leave balances">
          {[0, 1, 2].map((i) => (
            <div className="card lb-skel-card" key={i}>
              <div className="skeleton lb-skel is-short"></div>
              <div className="skeleton lb-skel is-tall"></div>
              <div className="skeleton lb-skel"></div>
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div>
          <div className="alert alert-danger" role="alert">
            Your leave balances could not be loaded. Check your connection and try again.
          </div>
          <p className="lb-note">
            <button type="button" className="btn btn-primary" onClick={() => load()}>
              Try again
            </button>
          </p>
        </div>
      )}

      {state.status === 'ready' && state.data.balances.length === 0 && (
        <div className="empty-state">
          <p>
            <strong>No leave types are set up for you yet.</strong>
          </p>
          <p className="text-muted">Contact HR if you expect to see leave balances here.</p>
        </div>
      )}

      {state.status === 'ready' && state.data.balances.length > 0 && (
        <div>
          <div className="lb-bar">
            <span className="text-sm text-muted">Updated {formatFullDate(state.data.asOf)}</span>
            <button type="button" className="btn btn-secondary" onClick={() => load()}>
              Refresh
            </button>
          </div>
          <div className="grid" role="list">
            {state.data.balances.map((balance) => (
              <LeaveBalanceCard key={balance.leaveTypeId} balance={balance} />
            ))}
          </div>
          <p className="lb-note">Pending days are not deducted from your balance until approved.</p>
        </div>
      )}
    </div>
  )
}
