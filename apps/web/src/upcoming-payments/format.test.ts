import { formatAmount, formatDue, payUrl, typeLabel } from './format'

describe('upcoming payment formatting', () => {
  it('labels each payment type', () => {
    expect(typeLabel('card_due')).toBe('Card due')
    expect(typeLabel('loan_instalment')).toBe('Loan instalment')
    expect(typeLabel('scheduled_bill')).toBe('Scheduled bill')
  })

  it('formats the due line', () => {
    expect(formatDue('2026-12-01', 13)).toBe('Due 1 Dec 2026, in 13 days')
    expect(formatDue('2026-11-24', 6)).toBe('Due 24 Nov 2026, in 6 days')
    expect(formatDue('2026-11-19', 1)).toBe('Due 19 Nov 2026, in 1 day')
    expect(formatDue('2026-11-18', 0)).toBe('Due 18 Nov 2026, today')
  })

  it('formats rupee amounts with two decimals', () => {
    expect(formatAmount(32450)).toBe('₹ 32,450.00')
    expect(formatAmount(945)).toBe('₹ 945.00')
  })

  it('builds the payment screen url from id and type', () => {
    const url = payUrl({ id: 'a b', type: 'card_due', name: 'x', dueDate: '2026-11-24', amount: 1, daysUntilDue: 6 })
    expect(url).toBe('/transfers-bill-payments/pay?paymentId=a%20b&type=card_due')
  })
})
