import { useState } from 'react'
import { useCustomer } from '../session/customer'
import { playSpin } from './api'
import { BetSelector } from './BetSelector'
import { Reels } from './Reels'
import './slot.css'
import { SpinResult } from './SpinResult'
import type { BetSize, SpinResult as Spin } from './types'

export function Slot() {
  const customer = useCustomer()
  const [bet, setBet] = useState<BetSize>(25)
  const [spin, setSpin] = useState<Spin | null>(null)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!customer) return null

  const onSpin = async () => {
    setPending(true)
    setFailed(false)
    try {
      setSpin(await playSpin(bet))
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="slot" id="content">
      <div className="slot-head">
        <h1>Slot</h1>
        <span className="text-muted">Spin the reels</span>
      </div>
      <div className="slot-body">
        <BetSelector bet={bet} onChange={setBet} />
        <Reels spin={spin} />
        {spin ? (
          <SpinResult spin={spin} />
        ) : (
          <p className="text-muted">Pick a bet and press Spin to play.</p>
        )}
        {failed && (
          <div className="alert alert-danger" role="alert">
            The spin did not go through. Try again.
          </div>
        )}
        <button type="button" className="btn btn-primary" disabled={pending} onClick={onSpin}>
          {pending && <span className="spinner" aria-hidden="true" />}
          Spin · bet {bet}
        </button>
      </div>
    </main>
  )
}
