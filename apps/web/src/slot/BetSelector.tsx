import { useRef, useState } from 'react'
import { Icon } from '../dashboard/Icon'
import type { BetSize } from './types'

// The sizes shown are the ones the API accepts; the API stays the authority on validity.
const BET_OPTIONS: BetSize[] = [1, 5, 10, 25, 50]

type Props = { bet: BetSize; onChange: (bet: BetSize) => void }

export function BetSelector({ bet, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selector = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    selector.current?.focus()
  }

  return (
    <>
      <div className="bet-row" data-wf-id="bet-row">
        <span className="bet-label">Bet size</span>
        <button
          ref={selector}
          type="button"
          className={open ? 'btn btn-secondary is-open' : 'btn btn-secondary'}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          Bet {bet} <Icon name="chevron-down" />
        </button>
      </div>
      {open && (
        <ul
          className="bet-options"
          aria-label="Bet size"
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
          }}
        >
          {BET_OPTIONS.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="bet-option"
                aria-pressed={option === bet}
                onClick={() => {
                  onChange(option)
                  close()
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
