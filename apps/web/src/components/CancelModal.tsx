import { useEffect, useRef } from 'react'

interface CancelModalProps {
  open: boolean
  approverName: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function CancelModal({ open, approverName, busy = false, onConfirm, onClose }: CancelModalProps) {
  const keepRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) keepRef.current?.focus()
  }, [open])

  if (!open) return null
  return (
    <>
      <div className="backdrop is-open" onClick={onClose} />
      <div
        className="modal is-open lr-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        aria-describedby="cancel-body"
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
      >
        <h2 id="cancel-title">Cancel this request?</h2>
        <p id="cancel-body" style={{ margin: '0 0 var(--space-4)' }}>
          The request will show as cancelled and {approverName} will no longer see it to decide. You can send a new
          request any time.
        </p>
        <div className="lr-actions">
          <button ref={keepRef} type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Keep request
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" /> Cancelling request
              </>
            ) : (
              'Cancel request'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
