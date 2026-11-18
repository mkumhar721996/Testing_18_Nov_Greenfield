import { fireEvent, render, screen } from '@testing-library/react'
import { ApiError, type LeaveRequestOptions } from '../api/leaveApi'
import { RequestDrawer } from './RequestDrawer'

const options: LeaveRequestOptions = {
  approverName: 'Arjun Mehta',
  leaveTypes: [
    { id: 'annual', name: 'Annual leave', availableDays: 10 },
    { id: 'casual', name: 'Casual leave', availableDays: 3 },
    { id: 'sick', name: 'Sick leave', availableDays: 2 },
  ],
  holidays: [{ date: '2026-12-25', name: 'Christmas Day' }],
}

function fill(type: string, start: string, end: string) {
  fireEvent.change(screen.getByLabelText('Leave type'), { target: { value: type } })
  fireEvent.change(screen.getByLabelText('First day'), { target: { value: start } })
  fireEvent.change(screen.getByLabelText('Last day'), { target: { value: end } })
}

describe('RequestDrawer', () => {
  it('AC2: offers whole days only, with no half-day or time control', () => {
    render(<RequestDrawer open options={options} onSubmit={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByText(/half/i)).toBeNull()
    expect(screen.queryByText(/\b(am|pm|morning|afternoon)\b/i)).toBeNull()
    expect(document.querySelector('input[type="time"], input[type="datetime-local"]')).toBeNull()
    expect(screen.getByLabelText('First day')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Last day')).toHaveAttribute('type', 'date')
  })

  it('names each leave type with its days available', () => {
    render(<RequestDrawer open options={options} onSubmit={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('option', { name: 'Annual leave (10 days available)' })).toBeInTheDocument()
  })

  it('AC13: counts working days and names the holiday that is not counted', () => {
    render(<RequestDrawer open options={options} onSubmit={vi.fn()} onClose={vi.fn()} />)
    fill('sick', '2026-12-23', '2026-12-25')
    const summary = screen.getByText(/2 days of Sick leave/)
    expect(summary).toHaveTextContent(/Christmas Day/)
    expect(summary).toHaveTextContent(/not counted/)
  })

  it('AC1: submits the chosen leave type, dates and note', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<RequestDrawer open options={options} onSubmit={onSubmit} onClose={vi.fn()} />)
    fill('casual', '2026-11-30', '2026-12-02')
    fireEvent.change(screen.getByLabelText(/Note for Arjun Mehta/), { target: { value: 'Trip' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        leaveTypeId: 'casual',
        startDate: '2026-11-30',
        endDate: '2026-12-02',
        note: 'Trip',
      }),
    )
  })

  it('AC3: shows a refusal in an alert and marks the leave type field, staying open', async () => {
    const message = 'You have 3 days of Casual leave available and this request needs 4. Shorten your dates.'
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(422, 'insufficient_balance', message, 'type'))
    const onClose = vi.fn()
    render(<RequestDrawer open options={options} onSubmit={onSubmit} onClose={onClose} />)
    fill('casual', '2026-11-23', '2026-11-26')
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/have 3 days of Casual leave available/i)
    expect(screen.getByLabelText('Leave type')).toHaveAttribute('aria-invalid', 'true')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('AC5: marks the first day when the dates overlap', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(422, 'overlap', 'You already have approved leave.', 'start'))
    render(<RequestDrawer open options={options} onSubmit={onSubmit} onClose={vi.fn()} />)
    fill('annual', '2027-03-10', '2027-03-11')
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/already have approved leave/)
    expect(screen.getByLabelText('First day')).toHaveAttribute('aria-invalid', 'true')
  })

  it('AC12: shows the past-date refusal', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(422, 'in_the_past', "Leave can't start before today (Wed 18 Nov).", 'start'))
    render(<RequestDrawer open options={options} onSubmit={onSubmit} onClose={vi.fn()} />)
    fill('annual', '2026-11-16', '2026-11-17')
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/before today/i)
  })

  it('shows an alert without marking a field when the refusal names none', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(500, 'unknown', 'Something went wrong. Try again.'))
    render(<RequestDrawer open options={options} onSubmit={onSubmit} onClose={vi.fn()} />)
    fill('annual', '2026-12-08', '2026-12-08')
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Something went wrong/)
  })

  it('closes on Escape and on the backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(<RequestDrawer open options={options} onSubmit={vi.fn()} onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    fireEvent.click(container.querySelector('.backdrop') as Element)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('renders nothing when closed', () => {
    render(<RequestDrawer open={false} options={options} onSubmit={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
