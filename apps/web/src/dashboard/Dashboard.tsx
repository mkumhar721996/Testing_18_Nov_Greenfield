import { useEffect, useState } from 'react'
import { fetchTransactions } from './api'
import { RecentTransactions } from './RecentTransactions'
import { selectRecentTransactions, type Transaction } from './transactions'

export function Dashboard({
  loadTransactions = fetchTransactions,
  onViewAllTransactions = () => {},
}: {
  loadTransactions?: () => Promise<Transaction[]>
  onViewAllTransactions?: () => void
}) {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)

  useEffect(() => {
    let active = true
    loadTransactions()
      // A failed load shows the empty state: no section error state in this story.
      .catch(() => [] as Transaction[])
      .then((result) => {
        if (active) setTransactions(selectRecentTransactions(result))
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main>
      <h1>Overview</h1>
      <RecentTransactions
        transactions={transactions ?? []}
        loading={transactions === null}
        onViewAll={onViewAllTransactions}
      />
    </main>
  )
}
