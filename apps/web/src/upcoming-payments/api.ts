export type PaymentType = 'card_due' | 'loan_instalment' | 'scheduled_bill'

export interface UpcomingPayment {
  id: string
  type: PaymentType
  name: string
  /** YYYY-MM-DD */
  dueDate: string
  /** whole INR */
  amount: number
  daysUntilDue: number
}

export interface UpcomingPayments {
  windowDays: number
  payments: UpcomingPayment[]
}

export async function fetchUpcomingPayments(signal?: AbortSignal): Promise<UpcomingPayments> {
  const res = await fetch('/dashboard/upcoming-payments', { signal })
  if (!res.ok) throw new Error(`Upcoming payments request failed (${res.status})`)
  return res.json()
}
