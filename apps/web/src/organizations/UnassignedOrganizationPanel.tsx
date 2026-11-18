import type { Organization } from './types'

export default function UnassignedOrganizationPanel({ organization }: { organization: Organization }) {
  return (
    <div className="card og-panel" aria-live="polite" data-testid="org-detail-panel-unassigned">
      <div className="og-field">
        <span className="og-label">Organization</span>
        <h2>{organization.name}</h2>
      </div>
      <div className="og-field">
        <span className="og-label">Address</span>
        <span>{organization.address}</span>
      </div>
      <div className="og-field">
        <span className="og-label">Admin</span>
        <span className="text-muted">Unassigned</span>
      </div>
      <div className="og-field">
        <span className="og-label">Created by</span>
        <span>{organization.createdBy}</span>
      </div>
      <div className="og-contact">
        <span className="og-label">Fundraising Consultant</span>
        <strong>{organization.contact.name}</strong>
        <span>{organization.contact.details}</span>
      </div>
    </div>
  )
}
