import { render, screen } from '@testing-library/react'
import LeaveBalanceCard from './LeaveBalanceCard'

const balance = {
  leaveTypeId: 'annual',
  leaveTypeName: 'Annual leave',
  balanceDays: 10,
  pendingDays: 3,
  pendingFrom: '2026-12-08',
  pendingTo: '2026-12-10',
}

describe('LeaveBalanceCard', () => {
  it('shows the balance and the pending days separately', () => {
    render(<LeaveBalanceCard balance={balance} />)
    expect(screen.getByRole('heading', { name: 'Annual leave' })).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('3 days pending')).toBeInTheDocument()
    expect(screen.getByText('Tue 8 Dec – Thu 10 Dec')).toBeInTheDocument()
  })

  it('says None when nothing is pending', () => {
    render(<LeaveBalanceCard balance={{ ...balance, pendingDays: 0, pendingFrom: null, pendingTo: null }} />)
    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.queryByText(/pending$/)).not.toBeInTheDocument()
  })

  it('uses the singular for one pending day', () => {
    render(<LeaveBalanceCard balance={{ ...balance, pendingDays: 1, pendingTo: '2026-12-08' }} />)
    expect(screen.getByText('1 day pending')).toBeInTheDocument()
    expect(screen.getByText('Tue 8 Dec')).toBeInTheDocument()
  })

  it('shows a negative balance exactly as returned', () => {
    render(<LeaveBalanceCard balance={{ ...balance, balanceDays: -0.5 }} />)
    expect(screen.getByText('-0.5')).toBeInTheDocument()
  })
})
