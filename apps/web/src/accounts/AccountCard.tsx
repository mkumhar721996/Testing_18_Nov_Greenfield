import { formatMoney } from './format'
import type { AccountBalance } from './types'

export function AccountCard({ account }: { account: AccountBalance }) {
  const isCredit = account.type === 'credit_card'
  const limit = account.creditLimitMinor
  const showLimit = isCredit && limit !== undefined && limit > 0
  const usedPercent = showLimit ? Math.min(100, Math.round((account.balanceMinor / limit) * 100)) : 0

  return (
    <div className="card acct-card">
      <span className="muted">{account.displayName}</span>
      <div className="amount">{formatMoney(account.balanceMinor, account.currency)}</div>
      <span className="muted">{isCredit ? 'Outstanding balance' : 'Balance'}</span>
      {showLimit && (
        <>
          <br />
          <span className="muted acct-limit">{`Limit ${formatMoney(limit, account.currency)}`}</span>
          <div className="meter" role="img" aria-label={`${usedPercent} percent of limit used`}>
            <span style={{ width: `${usedPercent}%` }} />
          </div>
        </>
      )}
    </div>
  )
}
