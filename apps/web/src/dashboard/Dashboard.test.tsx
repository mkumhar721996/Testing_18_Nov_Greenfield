import { render, screen, within } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import type { Transaction } from './transactions'

const t = (id: string, postedOn: string, description = id): Transaction => ({
  id,
  description,
  postedOn,
  category: 'Food',
  accountName: 'A',
  amount: -1,
})

const four = [t('a', '2026-11-12'), t('b', '2026-11-17'), t('c', '2026-11-14'), t('d', '2026-11-15')]
const five = [...four, t('oldest', '2026-10-01')]

describe('Dashboard', () => {
  it('lists newest first', async () => {
    render(
      <Dashboard
        loadTransactions={() =>
          Promise.resolve([
            t('old', '2026-11-12'),
            t('new', '2026-11-17', 'Swiggy order'),
            t('mid', '2026-11-14'),
          ])
        }
      />,
    )
    const rows = await screen.findAllByRole('listitem')
    expect(within(rows[0]).getByText('Swiggy order')).toBeInTheDocument()
  })

  it('shows the empty message when there are no transactions', async () => {
    render(<Dashboard loadTransactions={() => Promise.resolve([])} />)
    expect(await screen.findByText('No transactions yet')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('lists 4 of 5', async () => {
    render(<Dashboard loadTransactions={() => Promise.resolve(five)} />)
    expect(await screen.findAllByRole('listitem')).toHaveLength(4)
  })

  it('lists all of exactly 4', async () => {
    render(<Dashboard loadTransactions={() => Promise.resolve(four)} />)
    expect(await screen.findAllByRole('listitem')).toHaveLength(4)
  })

  it('shows the empty state when the load fails', async () => {
    render(<Dashboard loadTransactions={() => Promise.reject(new Error('x'))} />)
    expect(await screen.findByText('No transactions yet')).toBeInTheDocument()
  })
})
