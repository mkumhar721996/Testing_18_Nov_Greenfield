import type { LeaveBalance } from '../../api/leaveBalances'
import { formatDays, formatPendingRange } from './formatPendingRange'

export function LeaveBalanceCard({ balance }: { balance: LeaveBalance }) {
  const { leaveTypeName, balanceDays, pendingDays, pendingFrom, pendingTo } = balance
  return (
    <div className="card" role="listitem">
      <h2 className="lb-type">{leaveTypeName}</h2>
      <p className="lb-days">
        {balanceDays === null ? (
          'Not set'
        ) : (
          <>
            <span>{balanceDays}</span> <small>days</small>
          </>
        )}
      </p>
      <p className="lb-label">Available balance</p>
      <div className="divider" />
      <div className="lb-row">
        <span>Pending request</span>
        {pendingDays > 0 ? (
          <span className="badge badge-warning lb-pending">{formatDays(pendingDays)} pending</span>
        ) : (
          <span className="text-muted">None</span>
        )}
      </div>
      {pendingDays > 0 && pendingFrom && pendingTo && (
        <p className="lb-detail">{formatPendingRange(pendingFrom, pendingTo)}</p>
      )}
    </div>
  )
}
