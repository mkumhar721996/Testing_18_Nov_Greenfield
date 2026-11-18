import { useCallback, useEffect, useState } from 'react'
import { AccountCard } from './AccountCard'
import { AccountCardFailed } from './AccountCardFailed'
import { fetchAccountBalance } from './api'
import type { AccountBalance, LinkedAccount } from './types'

type State = { status: 'loading' } | { status: 'loaded'; balance: AccountBalance } | { status: 'failed' }

/** Owns one account's balance load, so a failure or retry never touches its siblings. */
export function AccountCardSlot({ account }: { account: LinkedAccount }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchAccountBalance(account.id, controller.signal).then(
      (balance) => setState({ status: 'loaded', balance }),
      () => {
        if (!controller.signal.aborted) setState({ status: 'failed' })
      },
    )
    return () => controller.abort()
  }, [account.id, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  if (state.status === 'loaded') return <AccountCard account={state.balance} />
  if (state.status === 'failed') return <AccountCardFailed account={account} onRetry={retry} retrying={false} />
  // A retry keeps the placeholder on screen (button busy) instead of swapping in a skeleton.
  return attempt > 0 ? (
    <AccountCardFailed account={account} onRetry={retry} retrying />
  ) : (
    <CardSkeleton />
  )
}

export function CardSkeleton() {
  return (
    <div className="card sk-stack">
      <span className="skeleton" style={{ width: '60%' }} />
      <span className="skeleton" style={{ height: 'var(--space-4)', width: '80%' }} />
      <span className="skeleton" style={{ width: '40%' }} />
    </div>
  )
}
