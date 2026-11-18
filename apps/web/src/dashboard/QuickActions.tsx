import type { Destination } from './navigation'

const ACTIONS: { id: string; label: string; destination: Destination; className: string }[] = [
  { id: 'transfer-money', label: 'Transfer money', destination: 'transfers', className: 'btn btn-primary' },
  { id: 'pay-bill', label: 'Pay a bill', destination: 'bill-pay', className: 'btn btn-secondary' },
  { id: 'play-slot', label: 'Play slot', destination: 'slot', className: 'btn btn-secondary' },
]

export function QuickActions({ onNavigate }: { onNavigate: (d: Destination) => void }) {
  return (
    <div className="quick-actions" role="group" aria-label="Quick actions">
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className={action.className}
          onClick={() => onNavigate(action.destination)}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
