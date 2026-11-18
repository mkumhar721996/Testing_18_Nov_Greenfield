import { useEffect, useRef, useState } from 'react'
import { type Customer, initialsOf } from '../session/customer'
import { Icon } from './Icon'
import type { Destination } from './navigation'

type Props = {
  customer: Customer
  onNavigate: (d: Destination) => void
  onSignOut?: () => void
}

export function UserMenu({ customer, onNavigate, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    const onPointer = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  const pick = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <div className="user-wrap" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className="user-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${customer.fullName}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar" aria-hidden="true">
          {initialsOf(customer.fullName)}
        </span>
        <span className="user-name">{customer.fullName}</span>
        <Icon name="chevron-down" />
      </button>
      {open && (
        <div className="user-menu-pop" role="menu">
          <button
            type="button"
            className="menu-item"
            role="menuitem"
            onClick={() => pick(() => onNavigate('profile'))}
          >
            Your profile
          </button>
          <button
            type="button"
            className="menu-item"
            role="menuitem"
            onClick={() => pick(() => onSignOut?.())}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
