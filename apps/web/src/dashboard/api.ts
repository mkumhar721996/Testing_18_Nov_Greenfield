import type { Transaction } from './transactions'

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch('/api/transactions')
  if (!res.ok) throw new Error(`Failed to load transactions (${res.status})`)
  return res.json()
}
