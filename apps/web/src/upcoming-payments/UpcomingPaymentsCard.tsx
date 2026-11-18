import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchUpcomingPayments, type UpcomingPayment, type UpcomingPayments } from './api'
import { formatAmount, formatDue, payUrl, typeLabel } from './format'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: UpcomingPayments }

interface Props {
  /** Opens the payment screen; the card itself never pays. */
  onPayNow?: (payment: UpcomingPayment) => void
}

const openPaymentScreen = (payment: UpcomingPayment) => window.location.assign(payUrl(payment))

export function UpcomingPaymentsCard({ onPayNow = openPaymentScreen }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    fetchUpcomingPayments(controller.signal).then(
      (data) => setState({ status: 'ready', data }),
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [attempt])

  // The retry button unmounts when the reload starts; hand focus to the heading once it settles.
  useEffect(() => {
    if (attempt > 0 && state.status !== 'loading') heading.current?.focus()
  }, [attempt, state.status])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return (
    <div className="card" data-wf-id="upcoming-payments">
      <div className="card-head">
        <h2 id="up-title" ref={heading} tabIndex={-1}>Upcoming payments</h2>
      </div>
      <div aria-live="polite" aria-busy={state.status === 'loading'}>
      {state.status === 'loading' && (
        <div className="pay-list">
          <span className="visually-hidden">Loading upcoming payments</span>
          <span className="skeleton pay-skeleton" />
          <span className="skeleton pay-skeleton" />
          <span className="skeleton pay-skeleton" />
        </div>
      )}
      {state.status === 'error' && (
        <div className="pay-empty">
          <p className="text-muted" role="alert">We couldn’t load your upcoming payments.</p>
          <button type="button" className="btn btn-secondary" onClick={retry}>
            Try again
          </button>
        </div>
      )}
      {state.status === 'ready' && <Ready data={state.data} onPayNow={onPayNow} />}
      </div>
    </div>
  )
}

function Ready({ data, onPayNow }: { data: UpcomingPayments; onPayNow: (p: UpcomingPayment) => void }) {
  if (data.payments.length === 0) {
    return (
      <div className="empty-state pay-empty">
        <h3>No upcoming payments</h3>
        <p className="text-muted">Nothing is due in the next {data.windowDays} days.</p>
      </div>
    )
  }
  return (
    <>
      <p className="text-muted pay-window">Due in the next {data.windowDays} days</p>
      <ul className="pay-list" aria-labelledby="up-title">
        {data.payments.map((p) => (
          <li className="pay-row" key={p.id}>
            <div className="pay-info">
              <span className="pay-name">{p.name}</span>
              <span className="text-muted">{formatDue(p.dueDate, p.daysUntilDue)}</span>
              <span className="badge">{typeLabel(p.type)}</span>
            </div>
            <div className="pay-side">
              <span className="pay-amount">{formatAmount(p.amount)}</span>
              <button type="button" className="btn btn-secondary" aria-label={`Pay now, ${p.name}`} onClick={() => onPayNow(p)}>
                Pay now
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
