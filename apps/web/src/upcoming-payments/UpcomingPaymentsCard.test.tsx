import { fireEvent, render, screen } from '@testing-library/react'
import { UpcomingPaymentsCard } from './UpcomingPaymentsCard'

const payments = [
  { id: 'card', type: 'card_due', name: 'Credit card ••5510 minimum due', dueDate: '2026-11-24', amount: 945, daysUntilDue: 6 },
  { id: 'loan', type: 'loan_instalment', name: 'Home loan ••7714 EMI', dueDate: '2026-12-01', amount: 32450, daysUntilDue: 13 },
  { id: 'bill', type: 'scheduled_bill', name: 'ACT Fibernet broadband', dueDate: '2026-12-05', amount: 1179, daysUntilDue: 17 },
]

const okResponse = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('UpcomingPaymentsCard', () => {
  it('lists every payment with type, amount, due date and its own Pay now (AC 1, 3, 9)', async () => {
    fetchMock.mockReturnValue(okResponse({ windowDays: 30, payments }))
    render(<UpcomingPaymentsCard onPayNow={vi.fn()} />)
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /^Pay now/ })).toHaveLength(3)
    expect(screen.getByText('Loan instalment')).toBeInTheDocument()
    expect(screen.getByText('₹ 32,450.00')).toBeInTheDocument()
    expect(screen.getByText('Due 1 Dec 2026, in 13 days')).toBeInTheDocument()
    expect(screen.getByText('Due in the next 30 days')).toBeInTheDocument()
  })

  it('Pay now hands the payment over and makes no further request (AC 4, 5)', async () => {
    fetchMock.mockReturnValue(okResponse({ windowDays: 30, payments }))
    const onPayNow = vi.fn()
    render(<UpcomingPaymentsCard onPayNow={onPayNow} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Pay now, Home loan ••7714 EMI' }))
    expect(onPayNow).toHaveBeenCalledWith(expect.objectContaining({ id: 'loan' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls.every(([, init]) => !init || init.method === undefined || init.method === 'GET')).toBe(true)
  })

  it('shows the empty message (AC 6)', async () => {
    fetchMock.mockReturnValue(okResponse({ windowDays: 30, payments: [] }))
    render(<UpcomingPaymentsCard onPayNow={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'No upcoming payments' })).toBeInTheDocument()
    expect(screen.getByText('Nothing is due in the next 30 days.')).toBeInTheDocument()
  })

  it('has no control to change the window (AC 8)', async () => {
    fetchMock.mockReturnValue(okResponse({ windowDays: 30, payments }))
    render(<UpcomingPaymentsCard onPayNow={vi.fn()} />)
    await screen.findAllByRole('listitem')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('shows skeleton placeholders while loading', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const { container } = render(<UpcomingPaymentsCard onPayNow={vi.fn()} />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('shows an error and refetches on Try again', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline')).mockReturnValue(okResponse({ windowDays: 30, payments }))
    render(<UpcomingPaymentsCard onPayNow={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
