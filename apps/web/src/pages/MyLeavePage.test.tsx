import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import * as api from '../api/leaveApi'
import type { LeaveRequest, LeaveRequestStatus } from '../api/leaveApi'
import { MyLeavePage } from './MyLeavePage'

vi.mock('../api/leaveApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/leaveApi')>()),
  listRequests: vi.fn(),
  getOptions: vi.fn(),
  submitRequest: vi.fn(),
  cancelRequest: vi.fn(),
}))

const options: api.LeaveRequestOptions = {
  approverName: 'Arjun Mehta',
  leaveTypes: [{ id: 'annual', name: 'Annual leave', availableDays: 10 }],
  holidays: [],
}

const request = (status: LeaveRequestStatus, id: string, submittedOn: string): LeaveRequest => ({
  id,
  employeeId: 'emp-a',
  leaveTypeId: 'annual',
  startDate: '2026-12-08',
  endDate: '2026-12-10',
  days: 3,
  status,
  submittedOn,
})

const all = [
  request('pending', 'r-pending', '2026-11-16'),
  request('approved', 'r-approved', '2026-11-03'),
  request('rejected', 'r-rejected', '2026-10-01'),
  request('cancelled', 'r-cancelled', '2026-09-01'),
]

const rowFor = (status: string) => screen.getByText(new RegExp(`^${status}$`, 'i')).closest('tr') as HTMLElement

describe('MyLeavePage', () => {
  beforeEach(() => {
    vi.mocked(api.getOptions).mockResolvedValue(options)
    vi.mocked(api.listRequests).mockResolvedValue(all)
  })
  afterEach(() => vi.resetAllMocks())

  it('shows a loading status first', () => {
    vi.mocked(api.listRequests).mockReturnValue(new Promise(() => {}))
    render(<MyLeavePage />)
    expect(screen.getByRole('status', { name: 'Loading your leave requests' })).toBeInTheDocument()
  })

  it('AC6: shows each request with a badge matching its status', async () => {
    render(<MyLeavePage />)
    await screen.findByRole('table', { name: 'Your leave requests' })
    expect(within(rowFor('pending')).getByText(/pending/i)).toHaveClass('badge-warning')
    expect(within(rowFor('approved')).getByText(/approved/i)).toHaveClass('badge-success')
    expect(within(rowFor('rejected')).getByText(/rejected/i)).toHaveClass('badge-danger')
    const cancelled = within(rowFor('cancelled')).getByText(/cancelled/i)
    expect(cancelled).toHaveClass('badge')
    expect(cancelled).not.toHaveClass('badge-warning', 'badge-success', 'badge-danger')
  })

  it('shows dates written out and days as working days', async () => {
    render(<MyLeavePage />)
    await screen.findByRole('table')
    const row = rowFor('pending')
    expect(within(row).getByText('Tue 8 Dec – Thu 10 Dec')).toBeInTheDocument()
    expect(within(row).getByText('3 days')).toBeInTheDocument()
  })

  it('AC8: a pending request is shown as pending with no pending note or reminder', async () => {
    render(<MyLeavePage />)
    await screen.findByRole('table')
    expect(within(rowFor('pending')).getByText('Pending')).toBeInTheDocument()
    expect(screen.queryByText(/remind/i)).toBeNull()
  })

  it('AC11: offers cancel on the pending row only', async () => {
    render(<MyLeavePage />)
    await screen.findByRole('table')
    expect(within(rowFor('pending')).getAllByRole('button', { name: /cancel request/i })).toHaveLength(1)
    for (const status of ['approved', 'rejected', 'cancelled']) {
      expect(within(rowFor(status)).queryByRole('button', { name: /cancel request/i })).toBeNull()
    }
  })

  it('AC10: cancels a pending request after confirmation and shows Cancelled', async () => {
    vi.mocked(api.cancelRequest).mockResolvedValue({ ...all[0], status: 'cancelled' })
    vi.mocked(api.listRequests).mockResolvedValueOnce(all).mockResolvedValue([{ ...all[0], status: 'cancelled' }])
    render(<MyLeavePage />)
    await screen.findByRole('table')
    fireEvent.click(within(rowFor('pending')).getByRole('button', { name: /cancel request/i }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel request' }))
    await waitFor(() => expect(screen.queryByText('Pending')).toBeNull())
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(api.cancelRequest).toHaveBeenCalledWith('r-pending')
  })

  it('shows the empty state with a Request leave action', async () => {
    vi.mocked(api.listRequests).mockResolvedValue([])
    render(<MyLeavePage />)
    expect(await screen.findByText("You haven't requested any leave yet.")).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows an alert on failure and retries on "Try again"', async () => {
    vi.mocked(api.listRequests).mockRejectedValueOnce(new Error('down')).mockResolvedValue(all)
    render(<MyLeavePage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be loaded/)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('AC1: sending a request refreshes the list and confirms with a toast naming the approver', async () => {
    vi.mocked(api.listRequests).mockResolvedValueOnce([]).mockResolvedValue([all[0]])
    vi.mocked(api.submitRequest).mockResolvedValue(all[0])
    render(<MyLeavePage />)
    await screen.findByText("You haven't requested any leave yet.")
    fireEvent.click(screen.getAllByRole('button', { name: 'Request leave' })[0])
    fireEvent.change(await screen.findByLabelText('First day'), { target: { value: '2026-12-08' } })
    fireEvent.change(screen.getByLabelText('Last day'), { target: { value: '2026-12-10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByText("Request sent to Arjun Mehta. You'll be emailed when it's decided.")).toBeInTheDocument()
    expect(await screen.findByText('Pending')).toBeInTheDocument()
  })
})
