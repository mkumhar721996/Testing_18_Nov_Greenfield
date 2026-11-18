import { Icon } from './Icon'
import { type Destination, SIDEBAR_ITEMS } from './navigation'

export function SideNav({ onNavigate }: { onNavigate: (d: Destination) => void }) {
  return (
    <nav className="sidenav" aria-label="Banking areas">
      <ul>
        {SIDEBAR_ITEMS.map((item) => (
          <li key={item.destination}>
            <button
              type="button"
              className="navlink"
              aria-current={item.destination === 'dashboard' ? 'page' : undefined}
              onClick={() => onNavigate(item.destination)}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
