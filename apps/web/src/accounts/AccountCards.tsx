import { useCallback, useEffect, useState } from 'react'
import './accounts.css'
import { AccountCardSlot, CardSkeleton } from './AccountCardSlot'
import { fetchAccounts } from './api'
import { NoAccounts } from './NoAccounts'
import type { LinkedAccount } from './types'

type State = { status: 'loading' } | { status: 'loaded'; accounts: LinkedAccount[] } | { status: 'failed' }

export function AccountCards({ onLinkAccount }: { onLinkAccount: () => void }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchAccounts(controller.signal).then(
      (accounts) => setState({ status: 'loaded', accounts }),
      () => {
        if (!controller.signal.aborted) setState({ status: 'failed' })
      },
    )
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  if (state.status === 'loading') {
    return (
      <div role="status" aria-live="polite">
        <p className="muted">Loading your accounts…</p>
        <div className="cards-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div className="stack">
        <div className="alert alert-danger" role="alert">
          <span>We could not load your accounts. Please try again.</span>
        </div>
        <div>
          <button className="btn btn-secondary" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (state.accounts.length === 0) return <NoAccounts onLinkAccount={onLinkAccount} />

  return (
    <div className="cards-3" aria-live="polite">
      {state.accounts.map((account) => (
        <AccountCardSlot key={account.id} account={account} />
      ))}
    </div>
  )
}
