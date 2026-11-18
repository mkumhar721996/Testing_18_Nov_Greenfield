import { useEffect, useState } from 'react'
import { Dashboard } from './dashboard/Dashboard'
import type { Destination } from './dashboard/navigation'
import { CustomerContext, useCustomer } from './session/customer'
import { Slot } from './slot/Slot'

function navigateTo(destination: Destination) {
  window.location.hash = `#/${destination}`
}

function useHash() {
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
  const hash = useHash()
  return (
    <CustomerContext.Provider value={customer}>
      {hash === '#/slot' ? <Slot /> : <Dashboard onNavigate={navigateTo} />}
    </CustomerContext.Provider>
  )
}
