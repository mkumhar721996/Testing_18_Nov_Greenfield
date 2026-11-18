# ADR Index

One line per decision — the rule, not the reasoning. Read the full ADR (`.arc/decisions/ADR-NNNN-*.md`) for context and rationale.

## Accepted — binding rules

| ADR | Category | Status | Rule |
|---|---|---|---|
| ADR-0001 | component | accepted | The Web App talks only to the Leave API and holds no business rules of its own. |
| ADR-0002 | component | accepted | All leave, balance and policy writes go through the Leave API, which enforces role-based access on every call. |
| ADR-0003 | component | accepted | Accrual, carry-forward and notification jobs run only in the Leave Worker, never in request handlers. |
| ADR-0004 | component | accepted | Only the Leave API and Leave Worker access the PostgreSQL (Amazon RDS) database; no client connects directly. |
| ADR-0005 | component | accepted | All users sign in through Entra ID SSO; the app stores no passwords. |
| ADR-0006 | nfr | accepted | Size the system for up to 5,000 employees without redesign. |
| ADR-0007 | nfr | accepted | Production uptime stays at or above 99.5% per month. |
| ADR-0008 | deployment_target | accepted | Run all components as containers on AWS in ap-south-1 only, one stack per environment. |
| ADR-0009 | integration_surface | accepted | Only the Leave Worker sends email, for leave status notifications; no other external systems are integrated. |
| ADR-0010 | cross_cutting | accepted | Every Leave API endpoint checks the caller's role and, for managers, that the target employee reports to them. |
| ADR-0011 | cross_cutting | accepted | Employee personal data is exposed only to roles that need it and is never written to logs. |
| ADR-0012 | cross_cutting | accepted | Store all data and backups only in AWS ap-south-1 (India); never replicate outside India. |
