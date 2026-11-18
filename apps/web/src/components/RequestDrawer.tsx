import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError, type FormField, type LeaveRequestOptions, type SubmitRequestInput } from '../api/leaveApi'
import { countWorkingDays, formatDate, heldHolidays, plural } from '../lib/dates'

interface RequestDrawerProps {
  open: boolean
  options: LeaveRequestOptions
  onSubmit: (input: SubmitRequestInput) => Promise<void>
  onClose: () => void
}

interface Refusal {
  message: string
  field?: FormField
}

export function RequestDrawer(props: RequestDrawerProps) {
  // Mounting the form only while open resets it for every new request.
  return props.open ? <DrawerForm {...props} /> : null
}

function DrawerForm({ options, onSubmit, onClose }: RequestDrawerProps) {
  const [leaveTypeId, setLeaveTypeId] = useState(options.leaveTypes[0]?.id ?? '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const typeRef = useRef<HTMLSelectElement>(null)

  useEffect(() => typeRef.current?.focus(), [])

  const leaveType = options.leaveTypes.find((t) => t.id === leaveTypeId)
  const ready = startDate !== '' && endDate !== '' && endDate >= startDate

  let summary = 'Choose your first and last day to see how many days this takes.'
  if (ready && leaveType) {
    const holidays = new Set(options.holidays.map((h) => h.date))
    const days = countWorkingDays(startDate, endDate, holidays)
    summary = `${plural(days)} of ${leaveType.name} (${plural(leaveType.availableDays)} available).`
    const held = heldHolidays(startDate, endDate, options.holidays)
    if (held.length) {
      summary += ` ${held.map((h) => `${formatDate(h.date)} is ${h.name}`).join(', ')}, a company holiday that is not counted.`
    }
  }

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setRefusal(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setRefusal(null)
    setSending(true)
    try {
      await onSubmit({ leaveTypeId, startDate, endDate, ...(note.trim() ? { note: note.trim() } : {}) })
    } catch (error) {
      setRefusal(
        error instanceof ApiError
          ? { message: error.message, field: error.field }
          : { message: 'Your request could not be sent. Check your connection and try again.' },
      )
      setSending(false)
    }
  }

  const invalid = (field: FormField) => (refusal?.field === field ? { 'aria-invalid': true } : {})
  const fieldError = (field: FormField) =>
    refusal?.field === field ? (
      <span className="field-error" id={`f-${field}-err`}>
        {refusal.message}
      </span>
    ) : null

  return (
    <>
      <div className="backdrop is-open" onClick={onClose} />
      <aside
        className="drawer is-open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
      >
        <form className="lr-drawer" onSubmit={submit} noValidate>
          <div className="lr-drawer-head">
            <h2 id="drawer-title">Request leave</h2>
            <button type="button" className="btn btn-ghost btn-icon" aria-label="Close request form" onClick={onClose}>
              ×
            </button>
          </div>

          {refusal && (
            <div className="alert alert-danger" role="alert">
              {refusal.message}
            </div>
          )}

          <div className="field">
            <label htmlFor="f-type">Leave type</label>
            <select
              ref={typeRef}
              className={`select${refusal?.field === 'type' ? ' is-invalid' : ''}`}
              id="f-type"
              value={leaveTypeId}
              onChange={(e) => edit(setLeaveTypeId)(e.target.value)}
              aria-describedby="f-type-hint f-type-err"
              {...invalid('type')}
            >
              {options.leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({plural(t.availableDays)} available)
                </option>
              ))}
            </select>
            <span className="field-hint" id="f-type-hint">
              Days available are shown for each type.
            </span>
            {fieldError('type')}
          </div>

          <div className="lr-dates">
            <div className="field">
              <label htmlFor="f-start">First day</label>
              <input
                className={`input${refusal?.field === 'start' ? ' is-invalid' : ''}`}
                type="date"
                id="f-start"
                value={startDate}
                onChange={(e) => edit(setStartDate)(e.target.value)}
                aria-describedby="f-start-err"
                {...invalid('start')}
              />
              {fieldError('start')}
            </div>
            <div className="field">
              <label htmlFor="f-end">Last day</label>
              <input
                className={`input${refusal?.field === 'end' ? ' is-invalid' : ''}`}
                type="date"
                id="f-end"
                value={endDate}
                onChange={(e) => edit(setEndDate)(e.target.value)}
                aria-describedby="f-end-err"
                {...invalid('end')}
              />
              {fieldError('end')}
            </div>
          </div>
          <p className="field-hint">Whole days only. Weekends and company holidays are not counted.</p>

          <p className="lr-summary" aria-live="polite">
            {summary}
          </p>

          <div className="field">
            <label htmlFor="f-note">Note for {options.approverName} (optional)</label>
            <textarea className="textarea" id="f-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="lr-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Sending request
                </>
              ) : (
                'Send request'
              )}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
