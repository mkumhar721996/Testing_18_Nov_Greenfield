import type { Organization } from './types'

export default function AssignedOrganizationPanel({
  org,
}: {
  org: Organization & { admin: NonNullable<Organization['admin']> }
}) {
  return (
    <div className="card og-panel" data-testid="org-detail-panel" aria-live="polite">
      <div className="og-field">
        <span className="og-label">Organization</span>
        <h2>{org.name}</h2>
      </div>
      <div className="og-field">
        <span className="og-label">Address</span>
        <span>{org.address}</span>
      </div>
      <div className="og-field">
        <span className="og-label">Admin</span>
        <span>
          <strong>{org.admin.name}</strong>
          <br />
          <span>{org.admin.email}</span>
        </span>
      </div>
      <div className="og-field">
        <span className="og-label">Created by</span>
        <span>{org.createdBy}</span>
      </div>
      <div className="og-contact">
        <span className="og-label">Fundraising Consultant</span>
        <strong>{org.contact.name}</strong>
        <span>{org.contact.details}</span>
      </div>
    </div>
  )
}
