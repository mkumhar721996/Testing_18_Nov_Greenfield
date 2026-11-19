import { useEffect, useState } from 'react'
import { Dashboard } from './dashboard/Dashboard'
import type { Destination } from './dashboard/navigation'
import { LeaveBalancesPage } from './features/leave-balances/LeaveBalancesPage'
import { CustomerContext, useCustomer } from './session/customer'

function navigateTo(destination: Destination) {
  window.location.hash = `#/${destination}`
}

function useHash(): string {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const customer = useCustomer()
  const myLeave = useHash() === '#/my-leave'
  return (
    <CustomerContext.Provider value={customer}>
      {myLeave ? (
        <Dashboard current="my-leave" onNavigate={navigateTo}>
          <LeaveBalancesPage />
        </Dashboard>
      ) : (
        <Dashboard onNavigate={navigateTo} />
      )}
    </CustomerContext.Provider>
  )
}
