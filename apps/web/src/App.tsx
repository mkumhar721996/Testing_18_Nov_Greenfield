import { useState } from 'react'
import { Dashboard } from './dashboard/Dashboard'

export default function App() {
  const [historyRequested, setHistoryRequested] = useState(false)

  return (
    <>
      <Dashboard
        onViewAllTransactions={() => {
          window.location.hash = '#/accounts/transactions'
          setHistoryRequested(true)
        }}
      />
      {historyRequested && (
        <p role="status">
          The full transaction history page is not available yet. It will open in Accounts &amp;
          statements.
        </p>
      )}
    </>
  )
}
