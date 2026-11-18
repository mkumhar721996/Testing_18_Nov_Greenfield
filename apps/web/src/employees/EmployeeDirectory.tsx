import { useEffect, useState } from 'react'
import { listEmployees, type Employee, type StatusFilter } from '../api/employees'
import NoManagerAlert from './NoManagerAlert'

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'all', label: 'All' },
]

export default function EmployeeDirectory({ onOpen }: { onOpen: (id: string) => void }) {
  const [status, setStatus] = useState<StatusFilter>('active')
  const [employees, setEmployees] = useState<Employee[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let current = true
    setEmployees(null)
    setFailed(false)
    listEmployees(status)
      .then((rows) => current && setEmployees(rows))
      .catch(() => current && setFailed(true))
    return () => {
      current = false
    }
  }, [status])

  return (
    <section>
      <h1 style={{ fontSize: 'var(--font-size-xl)' }}>Employees</h1>
      <div style={{ display: 'flex', gap: 'var(--space-2)', margin: 'var(--space-3) 0' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip"
            aria-pressed={status === f.id}
            onClick={() => setStatus(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {failed ? (
        <div className="alert alert-danger" role="alert">
          Could not load employees.
        </div>
      ) : employees === null ? (
        <div className="skeleton" role="status" aria-label="Loading employees" />
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <h3>No employees</h3>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>
                    <button type="button" className="chip" onClick={() => onOpen(e.id)}>
                      {e.displayName}
                    </button>
                  </td>
                  <td>{e.manager?.displayName ?? ''}</td>
                  <td>
                    <span className={e.status === 'active' ? 'badge badge-success' : 'badge'}>
                      {e.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{e.flags.noManager && <NoManagerAlert />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
