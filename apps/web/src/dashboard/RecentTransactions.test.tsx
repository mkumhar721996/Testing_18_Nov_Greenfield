import { fireEvent, render, screen, within } from '@testing-library/react'
import { RecentTransactions } from './RecentTransactions'
import type { Transaction } from './transactions'

const swiggy: Transaction = {
  id: '1',
  description: 'Swiggy order',
  postedOn: '2026-11-17',
  category: 'Food',
  accountName: 'Current account ••0937',
  amount: -642.5,
}
const salary: Transaction = {
  id: '2',
  description: 'Salary',
  postedOn: '2026-11-14',
  category: 'Income',
  accountName: 'Savings account ••4821',
  amount: 12500,
}

describe('RecentTransactions', () => {
  it('lists rows from both accounts, each with its account name', () => {
    render(<RecentTransactions transactions={[swiggy, salary]} onViewAll={() => {}} />)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('Current account ••0937')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Savings account ••4821')).toBeInTheDocument()
    expect(within(rows[0]).getByText('−₹642.50')).toBeInTheDocument()
  })

  it('always shows View all and calls the handler', () => {
    const onViewAll = vi.fn()
    render(<RecentTransactions transactions={[]} onViewAll={onViewAll} />)
    fireEvent.click(screen.getByRole('button', { name: 'View all' }))
    expect(onViewAll).toHaveBeenCalledTimes(1)
  })

  it('shows View all while loading', () => {
    render(<RecentTransactions transactions={[]} loading onViewAll={() => {}} />)
    expect(screen.getByRole('button', { name: 'View all' })).toBeInTheDocument()
    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument()
  })

  it('shows the empty message', () => {
    render(<RecentTransactions transactions={[]} onViewAll={() => {}} />)
    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
  })
})
