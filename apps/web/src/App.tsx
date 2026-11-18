import { Dashboard } from './dashboard/Dashboard'
import type { Destination } from './dashboard/navigation'
import { CustomerContext, useCustomer } from './session/customer'

function navigateTo(destination: Destination) {
  window.location.hash = `#/${destination}`
}

export default function App() {
  const customer = useCustomer()
  return (
    <CustomerContext.Provider value={customer}>
      <Dashboard onNavigate={navigateTo} />
    </CustomerContext.Provider>
  )
}
