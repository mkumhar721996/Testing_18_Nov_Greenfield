import { useCallback, useEffect, useState } from 'react'
import { fetchMyLeaveBalances } from '../../api/leaveBalances'
import type { LeaveBalances } from '../../api/leaveBalances'
import { formatDay } from './formatPendingRange'
import { LeaveBalanceCard } from './LeaveBalanceCard'
import './leave-balances.css'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: LeaveBalances }

function Skeleton() {
  return (
    <>
      <div className="lb-bar">
        <div className="skeleton lb-skel is-short" />
      </div>
      <div className="grid" role="status" aria-label="Loading your leave balances">
        {[0, 1, 2].map((i) => (
          <div className="card lb-skel-card" key={i}>
            <div className="skeleton lb-skel is-short" />
            <div className="skeleton lb-skel is-tall" />
            <div className="skeleton lb-skel" />
          </div>
        ))}
      </div>
    </>
  )
}

export function LeaveBalancesPage() {
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    fetchMyLeaveBalances().then(
      (data) => setState({ status: 'ready', data }),
      () => setState({ status: 'error' }),
    )
  }, [])

  useEffect(load, [load])

  return (
    <div>
      <div className="lb-head">
        <h1>My leave balances</h1>
        <p>Showing balances for you only. Balances are shown in whole days.</p>
      </div>

      {state.status === 'loading' && <Skeleton />}

      {state.status === 'error' && (
        <>
          <div className="alert alert-danger" role="alert">
            Your leave balances could not be loaded. Check your connection and try again.
          </div>
          <p className="lb-retry">
            <button type="button" className="btn btn-primary" onClick={load}>
              Try again
            </button>
          </p>
        </>
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
        <>
          <div className="lb-bar">
            <span className="text-sm text-muted">Updated {formatDay(state.data.asOf)} {new Date(state.data.asOf).getUTCFullYear()}</span>
            <button type="button" className="btn btn-secondary" onClick={load}>
              Refresh
            </button>
          </div>
          <div className="grid" role="list">
            {state.data.balances.map((balance) => (
              <LeaveBalanceCard key={balance.leaveTypeId} balance={balance} />
            ))}
          </div>
          <p className="lb-note">Pending days are already taken off your available balance.</p>
        </>
      )}
    </div>
  )
}
