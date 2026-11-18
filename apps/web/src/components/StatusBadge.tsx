import type { LeaveRequestStatus } from '../api/leaveApi'

const BADGE: Record<LeaveRequestStatus, { className: string; label: string }> = {
  pending: { className: 'badge badge-warning', label: 'Pending' },
  approved: { className: 'badge badge-success', label: 'Approved' },
  rejected: { className: 'badge badge-danger', label: 'Rejected' },
  cancelled: { className: 'badge', label: 'Cancelled' },
}

export function StatusBadge({ status }: { status: LeaveRequestStatus }) {
  const { className, label } = BADGE[status]
  return <span className={className}>{label}</span>
}
