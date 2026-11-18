import { useState, type ReactNode } from 'react'

interface NavItem {
  id: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'my-leave', label: 'My leave' },
  { id: 'calendar', label: 'Team calendar' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'account', label: 'Account' },
]

interface AppShellProps {
  children: ReactNode
  currentId?: string
  /** Approvals is for manager and approver roles only; no role data exists yet. */
  showApprovals?: boolean
}

export default function AppShell({ children, currentId = 'my-leave', showApprovals = false }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const items = NAV_ITEMS.filter((item) => item.id !== 'approvals' || showApprovals)

  return (
    <div className="shell">
      <header className="shell-header">
        <a className="shell-brand" href="#">
          Leave Manager
        </a>
        <button
          type="button"
          className="btn btn-secondary btn-icon shell-menu-btn"
          aria-controls="main-nav"
          aria-expanded={menuOpen}
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          &#9776;
        </button>
        <nav className={`shell-nav${menuOpen ? ' is-open' : ''}`} id="main-nav" aria-label="Main">
          <ul className="shell-nav-list">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  className="shell-link"
                  href="#"
                  aria-current={item.id === currentId ? 'page' : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="shell-main" id="content">
        {children}
      </main>
    </div>
  )
}
