import { fireEvent, render, screen } from '@testing-library/react'
import { LeaveBalancesPage } from './LeaveBalancesPage'

const balance = {
  leaveTypeId: 'annual',
  leaveTypeName: 'Annual leave',
  balanceDays: 7,
  pendingDays: 3,
  pendingFrom: '2026-12-08',
  pendingTo: '2026-12-10',
}

function respond(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body } as Response
}

afterEach(() => vi.unstubAllGlobals())

describe('LeaveBalancesPage', () => {
  it('shows a loading region, then a card per leave type (AC1)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond({ asOf: '2026-11-18T09:00:00Z', balances: [balance] })))
    render(<LeaveBalancesPage />)
    expect(screen.getByRole('status', { name: 'Loading your leave balances' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Annual leave' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Updated Wed 18 Nov 2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'My leave balances' })).toBeInTheDocument()
  })

  it('shows the empty state when no leave types are configured (AC7)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond({ asOf: '2026-11-18', balances: [] })))
    render(<LeaveBalancesPage />)
    expect(await screen.findByText('No leave types are set up for you yet.')).toBeInTheDocument()
    expect(screen.getByText('Contact HR if you expect to see leave balances here.')).toBeInTheDocument()
  })

  it('shows an error and retries on Try again', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond({}, false))
      .mockResolvedValueOnce(respond({ asOf: '2026-11-18', balances: [balance] }))
    vi.stubGlobal('fetch', fetchMock)
    render(<LeaveBalancesPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Annual leave' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('refetches on Refresh', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond({ asOf: '2026-11-18', balances: [balance] }))
    vi.stubGlobal('fetch', fetchMock)
    render(<LeaveBalancesPage />)
    await screen.findByRole('heading', { name: 'Annual leave' })
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await screen.findByRole('heading', { name: 'Annual leave' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
