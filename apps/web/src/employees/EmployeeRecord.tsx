import type { Employee, LeaveApproval } from '../api/employees'
import NoManagerAlert from './NoManagerAlert'

// Read-only: name and manager come from Entra ID, so there are no inputs or edit controls here.
export default function EmployeeRecord({ employee, approvals }: { employee: Employee; approvals: LeaveApproval[] }) {
  return (
    <article className="card">
      <h2 className="card-title" style={{ fontSize: 'var(--font-size-xl)' }}>
        {employee.displayName}{' '}
        <span className={employee.status === 'active' ? 'badge badge-success' : 'badge'}>
          {employee.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </h2>
      {employee.flags.noManager && <NoManagerAlert />}
      <dl style={{ display: 'grid', gap: 'var(--space-2)', margin: 'var(--space-3) 0' }}>
        <div>
          <dt style={{ color: 'var(--color-fg-muted)' }}>Manager</dt>
          <dd>{employee.manager?.displayName ?? 'None'}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--color-fg-muted)' }}>Email</dt>
          <dd>{employee.email ?? ''}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--color-fg-muted)' }}>Job title</dt>
          <dd>{employee.jobTitle ?? ''}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--color-fg-muted)' }}>Department</dt>
          <dd>{employee.department ?? ''}</dd>
        </div>
      </dl>
      <h3>Leave approvals</h3>
      {approvals.length === 0 ? (
        <p style={{ color: 'var(--color-fg-muted)' }}>No leave approvals.</p>
      ) : (
        <ul>
          {approvals.map((a) => (
            <li key={a.id}>{a.status}</li>
          ))}
        </ul>
      )}
    </article>
  )
}
