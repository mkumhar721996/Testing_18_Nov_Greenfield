# Employee sync from Entra ID

Entra ID is the source of truth for employee name, details, manager and enabled state. The Leave Worker
refreshes them into the shared PostgreSQL database every night. The app has no way to edit a name or manager.

## Schedule and retries

- Runs daily at `ENTRA_SYNC_TIME_UTC` (default `20:30` UTC, which is 02:00 IST).
- Up to 4 attempts per run, waiting 1, 5 and 15 minutes between attempts. A non-retryable Graph error
  (for example 403) is not retried.
- Every attempt is recorded in `entra_sync_runs` (`succeeded`, `partial` or `failed`) with counts only.
  `partial` means entries without an id or display name were skipped.
- Logs hold counts and the error class, never names or emails.
- An empty snapshot is treated as a failed fetch and applies nothing. The whole change is applied in one
  transaction, so a failure leaves the previous data intact.

## Behaviour

- New users are created, changed name, details and manager are overwritten from Entra ID.
- A user who is disabled or missing from Entra ID becomes inactive. Nothing is deleted, so HR details and leave
  history stay on the record (foreign keys are `ON DELETE RESTRICT`).
- An active employee with no manager gets a "No manager in Entra ID" flag. HR fixes it in Entra ID.
- Pending leave approvals are `blocked` when the employee's manager is missing, disabled or removed, and are
  routed to the new manager on the next run after HR assigns one.

## Settings

| Setting | Used by | Default |
|---|---|---|
| `DATABASE_URL` | Leave API, Leave Worker | none (the API fails fast without it) |
| `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET` | Worker | none; if any is unset the scheduler stays off with a warning |
| `ENTRA_SYNC_TIME_UTC` | Worker | `20:30` |
| `ENTRA_SYNC_RUN_ON_START` | Worker | `false`; set `true` to run once on start |
| `VITE_API_BASE_URL` | Web App | `/api` |

The client secret is never logged.

## Provisioning

- An Entra app registration with the Microsoft Graph `User.Read.All` application permission and admin consent.
- Run `pnpm migrate` in `services/leave-api` before deploying the API, then the Worker, then the Web App.
- Manual rollback of the schema: `services/leave-api/migrations/0001_employees.down.sql` (not run by the runner).
