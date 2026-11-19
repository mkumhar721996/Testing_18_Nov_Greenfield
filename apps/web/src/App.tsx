import { useEffect, useState } from 'react'
import { Catalog } from './catalog/Catalog'
import { Dashboard } from './dashboard/Dashboard'
import type { Destination } from './dashboard/navigation'
import { Providers } from './providers/Providers'
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
  const hash = useHash()
  // The catalog is public: it renders before (and independent of) the signed-in Dashboard.
  if (hash === '#/catalog') return <Catalog />
  if (hash === '#/providers') return <Providers />
  return (
    <CustomerContext.Provider value={customer}>
      <Dashboard onNavigate={navigateTo} />
    </CustomerContext.Provider>
  )
}
