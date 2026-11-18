import { useState } from 'react'
import type { Customer } from '../session/customer'
import { Icon } from './Icon'
import { type Destination, TOP_NAV_ITEMS } from './navigation'
import { UserMenu } from './UserMenu'

type Props = {
  customer: Customer
  onNavigate: (d: Destination) => void
  onSignOut?: () => void
}

export function TopBar({ customer, onNavigate, onSignOut }: Props) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <header className="topbar" data-testid="top-bar">
      <span className="logo">
        <span className="logo-mark" aria-hidden="true">
          <Icon name="bag" />
        </span>
        Bank Application
      </span>
      <button
        type="button"
        className="btn btn-secondary btn-icon btn-lg menu-btn"
        aria-label="Menu"
        aria-controls="top-nav"
        aria-expanded={navOpen}
        onClick={() => setNavOpen((o) => !o)}
      >
        <Icon name="menu" />
      </button>
      <nav className="topnav" id="top-nav" aria-label="Main" hidden={!navOpen}>
        <ul>
          {TOP_NAV_ITEMS.map((item) => (
            <li key={item.destination}>
              <button
                type="button"
                className="navlink"
                aria-current={item.destination === 'dashboard' ? 'page' : undefined}
                onClick={() => onNavigate(item.destination)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <UserMenu customer={customer} onNavigate={onNavigate} onSignOut={onSignOut} />
    </header>
  )
}
