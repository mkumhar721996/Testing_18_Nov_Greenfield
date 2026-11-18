import { useCustomer } from '../session/customer'
import './dashboard.css'
import { greetingFor } from './greeting'
import type { Destination } from './navigation'
import { QuickActions } from './QuickActions'
import { SideNav } from './SideNav'
import { TopBar } from './TopBar'

type Props = {
  now?: Date
  onNavigate: (d: Destination) => void
  onSignOut?: () => void
}

export function Dashboard({ now = new Date(), onNavigate, onSignOut }: Props) {
  const customer = useCustomer()
  if (!customer) return null

  return (
    <>
      <TopBar customer={customer} onNavigate={onNavigate} onSignOut={onSignOut} />
      <div className="layout">
        <SideNav onNavigate={onNavigate} />
        <main className="main" id="content">
          <div className="page-header">
            <h1 aria-live="polite">{greetingFor(customer.firstName, now)}</h1>
            <QuickActions onNavigate={onNavigate} />
          </div>
        </main>
      </div>
    </>
  )
}
