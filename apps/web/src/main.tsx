import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { CustomerContext } from './session/customer'
import './index.css'

// Only the e2e build (VITE_E2E=true) seeds a signed-in customer; real builds wait for the session flow.
const e2eCustomer = import.meta.env.VITE_E2E === 'true' ? { firstName: 'Ada', fullName: 'Ada Lovelace' } : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomerContext.Provider value={e2eCustomer}>
      <App />
    </CustomerContext.Provider>
  </StrictMode>,
)
