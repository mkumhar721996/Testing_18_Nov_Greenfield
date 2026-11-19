import { render, screen } from '@testing-library/react'
import { formatPendingRange } from './formatPendingRange'
import { LeaveBalanceCard } from './LeaveBalanceCard'

const base = {
  leaveTypeId: 'annual',
  leaveTypeName: 'Annual leave',
  balanceDays: 10,
  pendingDays: 0,
  pendingFrom: null,
  pendingTo: null,
}

describe('LeaveBalanceCard', () => {
  it('shows the balance and the pending days separately (AC6)', () => {
    render(
      <LeaveBalanceCard
        balance={{ ...base, balanceDays: 7, pendingDays: 3, pendingFrom: '2026-12-08', pendingTo: '2026-12-10' }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Annual leave' })).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('3 days pending')).toBeInTheDocument()
    expect(screen.getByText('Tue 8 Dec – Thu 10 Dec')).toBeInTheDocument()
  })

  it('says None when nothing is pending', () => {
    render(<LeaveBalanceCard balance={base} />)
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('shows Not set in place of a number when HR entered no opening balance (AC8)', () => {
    render(<LeaveBalanceCard balance={{ ...base, balanceDays: null }} />)
    expect(screen.getByText('Not set')).toBeInTheDocument()
    expect(screen.queryByText('days')).not.toBeInTheDocument()
  })

  it('writes 1 day in the singular', () => {
    render(<LeaveBalanceCard balance={{ ...base, pendingDays: 1 }} />)
    expect(screen.getByText('1 day pending')).toBeInTheDocument()
  })
})

describe('formatPendingRange', () => {
  it('writes a single day once', () => {
    expect(formatPendingRange('2026-12-08', '2026-12-08')).toBe('Tue 8 Dec')
  })
})
