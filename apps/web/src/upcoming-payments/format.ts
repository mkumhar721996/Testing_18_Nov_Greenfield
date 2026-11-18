import type { PaymentType, UpcomingPayment } from './api'

const TYPE_LABELS: Record<PaymentType, string> = {
  card_due: 'Card due',
  loan_instalment: 'Loan instalment',
  scheduled_bill: 'Scheduled bill',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function typeLabel(type: PaymentType): string {
  return TYPE_LABELS[type]
}

/** "Due 24 Nov 2026, in 6 days" — the calendar date is formatted from the string, never via a time zone. */
export function formatDue(dueDate: string, daysUntilDue: number): string {
  const [year, month, day] = dueDate.split('-').map(Number)
  const when = daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`
  return `Due ${day} ${MONTHS[month - 1]} ${year}, ${when}`
}

export function formatAmount(amount: number): string {
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Placeholder route: the payment screen belongs to Transfers & bill payments. */
export function payUrl(payment: UpcomingPayment): string {
  return `/transfers-bill-payments/pay?paymentId=${encodeURIComponent(payment.id)}&type=${payment.type}`
}
