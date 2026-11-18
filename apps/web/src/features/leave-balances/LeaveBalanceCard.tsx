import type { LeaveBalance } from '../../api/leaveBalances'
import { formatDays, formatPendingRange } from './formatPendingRange'

export default function LeaveBalanceCard({ balance }: { balance: LeaveBalance }) {
  const hasPending = balance.pendingDays > 0
  return (
    <div className="card" role="listitem">
      <h2 className="lb-type">{balance.leaveTypeName}</h2>
      <p className="lb-days">
        <span>{balance.balanceDays}</span> <small>days</small>
      </p>
      <p className="lb-label">Available balance</p>
      <div className="divider"></div>
      <div className="lb-row">
        <span>Pending request</span>
        {hasPending ? (
          <span className="badge badge-warning lb-pending">
            {formatDays(balance.pendingDays)} pending
          </span>
        ) : (
          <span className="text-muted">None</span>
        )}
      </div>
      {hasPending && balance.pendingFrom && balance.pendingTo && (
        <p className="lb-detail">{formatPendingRange(balance.pendingFrom, balance.pendingTo)}</p>
      )}
    </div>
  )
}
