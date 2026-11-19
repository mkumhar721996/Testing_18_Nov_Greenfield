import type { ReactNode } from 'react'
import { Icon } from '../Icon'
import { useSectionLoader } from './useSectionLoader'

const SKELETON_WIDTHS = ['70%', '45%', '80%', '50%']

type SectionCardProps<T> = {
  title: string
  label: string
  plural?: boolean
  load: () => Promise<T>
  children: (data: T) => ReactNode
  action?: ReactNode
}

export function SectionCard<T>({ title, label, plural, load, children, action }: SectionCardProps<T>) {
  const { state, retry } = useSectionLoader(load)

  if (state.status === 'loaded') {
    return (
      <div className="card">
        <div className="card-head">
          <h2>{title}</h2>
          {action}
        </div>
        {children(state.data)}
      </div>
    )
  }

  return (
    <div className="card section-status" aria-busy={state.status === 'loading' ? 'true' : undefined}>
      <div className="card-head">
        <h2>{title}</h2>
      </div>
      {state.status === 'loading' ? (
        <div role="status" aria-live="polite" className="sk-stack">
          <p className="muted section-note">Loading {label}…</p>
          {SKELETON_WIDTHS.map((width) => (
            <span key={width} className="skeleton" style={{ width }} />
          ))}
        </div>
      ) : (
        <>
          <div className="alert alert-danger" role="alert">
            <Icon name="alert" />
            <span>We couldn't load your {label}. Your other sections are not affected.</span>
          </div>
          <div className="empty-state">
            <p>
              {title} {plural ? 'are' : 'is'} temporarily unavailable.
            </p>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={state.retrying}
              aria-busy={state.retrying ? 'true' : undefined}
              onClick={retry}
            >
              {state.retrying ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Trying again…
                </>
              ) : (
                'Try again'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
