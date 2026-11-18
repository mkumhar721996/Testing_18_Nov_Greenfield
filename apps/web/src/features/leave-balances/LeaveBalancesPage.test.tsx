import { fireEvent, render, screen } from '@testing-library/react'
import LeaveBalancesPage from './LeaveBalancesPage'

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as Response

const body = {
  asOf: '2026-11-18',
  balances: [
    { leaveTypeId: 'annual', leaveTypeName: 'Annual leave', balanceDays: 4, pendingDays: 0, pendingFrom: null, pendingTo: null },
    { leaveTypeId: 'sick', leaveTypeName: 'Sick leave', balanceDays: -0.5, pendingDays: 0, pendingFrom: null, pendingTo: null },
  ],
}

describe('LeaveBalancesPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading state', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    render(<LeaveBalancesPage />)
    expect(screen.getByRole('status', { name: 'Loading your leave balances' })).toBeInTheDocument()
  })

  it('shows one card per leave type, as the API returned them', async () => {
    fetchMock.mockResolvedValue(ok(body))
    render(<LeaveBalancesPage />)
    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(screen.getByText('-0.5')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Updated Wed 18 Nov 2026')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/leave-balances/me',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('shows the empty state', async () => {
    fetchMock.mockResolvedValue(ok({ asOf: '2026-11-18', balances: [] }))
    render(<LeaveBalancesPage />)
    expect(await screen.findByText('No leave types are set up for you yet.')).toBeInTheDocument()
    expect(screen.getByText('Contact HR if you expect to see leave balances here.')).toBeInTheDocument()
  })

  it('shows an error and retries', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 } as Response)
    fetchMock.mockResolvedValueOnce(ok(body))
    render(<LeaveBalancesPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('refetches on Refresh', async () => {
    fetchMock.mockResolvedValue(ok(body))
    render(<LeaveBalancesPage />)
    await screen.findByText('4')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await screen.findByText('4')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
