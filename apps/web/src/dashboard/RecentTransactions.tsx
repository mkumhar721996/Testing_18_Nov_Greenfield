import './dashboard.css'
import { formatTxnAmount, formatTxnDate, type Transaction } from './transactions'

export function RecentTransactions({
  transactions,
  loading = false,
  onViewAll,
}: {
  transactions: Transaction[]
  loading?: boolean
  onViewAll: () => void
}) {
  return (
    <section className="recent-card" aria-labelledby="recent-transactions-title">
      <div className="recent-card__head">
        <h2 id="recent-transactions-title" className="recent-card__title">
          Recent transactions
        </h2>
        <button type="button" className="recent-card__link" onClick={onViewAll}>
          View all
        </button>
      </div>
      <div aria-live="polite">
        {loading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="recent-card__skeleton" />)
        ) : transactions.length === 0 ? (
          <div className="recent-card__empty">
            <strong>No transactions yet</strong>
            <span className="recent-card__muted">
              Activity from your accounts will show up here.
            </span>
          </div>
        ) : (
          <ul className="recent-card__list">
            {transactions.map((txn) => (
              <li key={txn.id} className="recent-card__row">
                <span className="recent-card__main">
                  <span>{txn.description}</span>
                  <span className="recent-card__muted">
                    {formatTxnDate(txn.postedOn)}, {txn.category}
                  </span>
                </span>
                <span className="recent-card__badge">{txn.accountName}</span>
                <span className="recent-card__amount">{formatTxnAmount(txn.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
