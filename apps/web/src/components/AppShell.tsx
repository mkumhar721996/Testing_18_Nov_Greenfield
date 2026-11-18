import { useState, type ReactNode } from 'react'

export type SectionId = 'overview' | 'my-leave' | 'calendar' | 'approvals' | 'account'

const SECTIONS: { id: SectionId; label: string; managerOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'my-leave', label: 'My leave' },
  { id: 'calendar', label: 'Team calendar' },
  { id: 'approvals', label: 'Approvals', managerOnly: true },
  { id: 'account', label: 'Account' },
]

interface AppShellProps {
  current: SectionId
  isManager?: boolean
  onNavigate: (id: SectionId) => void
  children: ReactNode
}

export function AppShell({ current, isManager = false, onNavigate, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const sections = SECTIONS.filter((s) => !s.managerOnly || isManager)

  const links = (
    <>
      {sections.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            className="lr-nav-link"
            aria-current={s.id === current ? 'page' : undefined}
            onClick={() => {
              setMenuOpen(false)
              onNavigate(s.id)
            }}
          >
            {s.label}
          </button>
        </li>
      ))}
    </>
  )

  return (
    <>
      <header className="lr-nav">
        <div className="lr-nav-bar">
          <strong>Leave Manager</strong>
          <ul className="lr-nav-list" aria-label="Main">
            {links}
          </ul>
          <button
            type="button"
            className="btn btn-ghost btn-icon lr-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="nav-mobile"
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
        {menuOpen && (
          <ul className="lr-nav-mobile" id="nav-mobile" aria-label="Main">
            {links}
          </ul>
        )}
      </header>
      <main>{children}</main>
    </>
  )
}
