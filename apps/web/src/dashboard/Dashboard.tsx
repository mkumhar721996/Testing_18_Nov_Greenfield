import type { ReactNode } from 'react'
import { useCustomer } from '../session/customer'
import './dashboard.css'
import { greetingFor } from './greeting'
import type { Destination } from './navigation'
import { QuickActions } from './QuickActions'
import { SideNav } from './SideNav'
import { TopBar } from './TopBar'

type Props = {
  now?: Date
  current?: Destination
  /** Replaces the dashboard's own content inside the shell. */
  children?: ReactNode
  onNavigate: (d: Destination) => void
  onSignOut?: () => void
}

export function Dashboard({ now = new Date(), current = 'dashboard', children, onNavigate, onSignOut }: Props) {
  const customer = useCustomer()
  if (!customer) return null

  return (
    <>
      <TopBar customer={customer} current={current} onNavigate={onNavigate} onSignOut={onSignOut} />
      <div className="layout">
        <SideNav current={current} onNavigate={onNavigate} />
        <main className="main" id="content">
          {children ?? (
            <div className="page-header">
              <h1 aria-live="polite">{greetingFor(customer.firstName, now)}</h1>
              <QuickActions onNavigate={onNavigate} />
            </div>
          )}
        </main>
      </div>
    </>
  )
}
