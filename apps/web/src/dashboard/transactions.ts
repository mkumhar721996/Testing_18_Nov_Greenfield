export interface Transaction {
  id: string
  description: string
  /** ISO date, e.g. '2026-11-17' */
  postedOn: string
  category: string
  /** e.g. 'Current account ••0937' */
  accountName: string
  /** Signed, whole rupees; negative = debit */
  amount: number
}

export const RECENT_LIMIT = 4

export function selectRecentTransactions(
  all: Transaction[],
  limit = RECENT_LIMIT,
): Transaction[] {
  return [...all]
    .sort((a, b) => (a.postedOn < b.postedOn ? 1 : a.postedOn > b.postedOn ? -1 : 0))
    .slice(0, limit)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatTxnDate(postedOn: string): string {
  const [, month, day] = postedOn.split('-')
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`
}

const formatRupees = (value: number, digits: number) =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

export function formatTxnAmount(amount: number): string {
  const sign = amount < 0 ? '−' : '+'
  const abs = Math.abs(amount)
  return `${sign}₹${formatRupees(abs, Number.isInteger(abs) ? 0 : 2)}`
}
