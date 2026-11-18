import type { LinkedAccount } from './types'

interface Props {
  account: LinkedAccount
  onRetry: () => void
  retrying: boolean
}

export function AccountCardFailed({ account, onRetry, retrying }: Props) {
  return (
    <div className="card acct-fail">
      <strong>
        <svg className="acct-icon" aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Couldn't load
      </strong>
      <span>{account.displayName}</span>
      <span className="muted">We couldn't load this account. Your other accounts are not affected.</span>
      <button className="btn btn-secondary" type="button" onClick={onRetry} disabled={retrying}>
        {retrying ? (
          <>
            <span className="spinner" aria-hidden="true" /> Trying again…
          </>
        ) : (
          'Try again'
        )}
      </button>
    </div>
  )
}
