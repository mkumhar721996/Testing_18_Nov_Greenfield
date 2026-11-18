import OrganizationsPage from './organizations/OrganizationsPage'

// Nav collapse below 48em is out of scope here; the links stack on narrow screens.
const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'my-leave', label: 'My leave' },
  { id: 'calendar', label: 'Team calendar' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'account', label: 'Account' },
]

const CURRENT_NAV_ID = 'account'

export default function App() {
  return (
    <>
      <header className="shell-header">
        <a className="shell-brand" href="#">
          Leave Manager
        </a>
        <nav className="shell-nav" aria-label="Main">
          <ul className="shell-nav-list">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  className="shell-link"
                  href="#"
                  aria-current={item.id === CURRENT_NAV_ID ? 'page' : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="shell-main" id="content">
        <OrganizationsPage />
      </main>
    </>
  )
}
