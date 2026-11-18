summary: |
  Entra ID becomes the source of truth for employees (name, details, manager, enabled/disabled). A nightly job in the Leave Worker (ADR-0003) pulls the full user list plus manager from Microsoft Graph and reconciles it into the shared PostgreSQL database in one transaction: it creates new employees, updates name/details/manager, marks disabled or removed employees inactive without deleting anything, and re-routes pending leave approvals (blocked when the manager is disabled, removed or missing, routed to the new manager once HR fixes it in Entra ID). The Leave API exposes read-only employee endpoints (no write route for name or manager) with a no-manager flag, and the Web App shows a read-only directory and record view with no edit controls. The repo today is a bare scaffold (health endpoint, placeholder page, no database, no auth), so this plan also creates the minimal schema, DB access and migration runner it needs.
scope:
  - description: |
      Migration and schema in the Leave API (it owns the schema; the Worker shares the DB). `migrations/0001_employees.sql` creates:
      - `employees` (id uuid pk default gen_random_uuid(), entra_object_id text UNIQUE NOT NULL, display_name text NOT NULL, email, job_title, department, manager_id uuid NULL REFERENCES employees(id) ON DELETE RESTRICT, active boolean NOT NULL DEFAULT true, deactivated_at timestamptz, synced_at timestamptz NOT NULL).
      - `leave_approvals` (id uuid pk, employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT, status text NOT NULL CHECK (status IN ('pending','blocked','approved','declined','cancelled')), routed_manager_id uuid NULL REFERENCES employees(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now()). This is the minimum the routing rules (AC8, AC9) and "leave history still shown" (AC12) need; the leave-request story may extend it.
      - `entra_sync_runs` (id, started_at, finished_at, status CHECK IN ('running','succeeded','partial','failed'), attempt int, fetched/created/updated/deactivated/skipped ints, error text).
      Plus a small runner `src/db/migrate.ts` (applies `migrations/*.sql` in order, tracked in a `schema_migrations` table, idempotent) and a `pnpm migrate` script. `ON DELETE RESTRICT` and no delete path anywhere guarantee inactive employees keep their history (AC12).
    files:
      - services/leave-api/migrations/0001_employees.sql
      - services/leave-api/src/db/migrate.ts
      - services/leave-api/src/db/pool.provider.ts
      - services/leave-api/package.json
    rationale: |
      No database access exists yet. Plain SQL via `pg` keeps to the confirmed stack (NestJS + PostgreSQL) without choosing an ORM nobody approved.
  - description: |
      Leave API read-only employee endpoints under `src/employees/`: `GET /employees?status=active|inactive|all` (default `active`, AC11) and `GET /employees/:id` returning the record plus its leave approvals (history stays visible for inactive people, AC12). Response shape:
      ```ts
      export interface EmployeeDto {
        id: string;
        displayName: string;
        email: string | null;
        jobTitle: string | null;
        department: string | null;
        status: 'active' | 'inactive';
        manager: { id: string; displayName: string } | null;
        flags: { noManager: boolean }; // active && manager === null
      }
      ```
      There is deliberately NO POST/PUT/PATCH/DELETE route for employees or managers (AC6, AC7): a manager-change attempt gets 404 and the stored manager is unchanged. Access (ADR-0010/0011) goes through a pure `canViewEmployee(caller, employee)` policy: HR sees everyone, a manager sees their direct reports, an employee sees themself. The caller comes from an injected `CallerProvider`; the real SSO-backed implementation belongs to the Entra sign-in story, so the default implementation rejects with 401 and e2e overrides it. Never log names or emails.
    files:
      - services/leave-api/src/employees/employee.types.ts
      - services/leave-api/src/employees/employees.repository.ts
      - services/leave-api/src/employees/employees.service.ts
      - services/leave-api/src/employees/employees.controller.ts
      - services/leave-api/src/employees/employee-access.policy.ts
      - services/leave-api/src/employees/caller.provider.ts
      - services/leave-api/src/employees/employees.module.ts
      - services/leave-api/src/app.module.ts
    rationale: |
      ADR-0001/0002/0010: the Web App only talks to the Leave API, which enforces roles on every call and holds the business rules (the no-manager flag).
  - description: |
      Leave Worker sync core (pure, no I/O) in `src/sync/plan-sync.ts`:
      ```ts
      export interface EntraUser { id: string; displayName: string | null; email: string | null; jobTitle: string | null; department: string | null; accountEnabled: boolean; managerId: string | null }
      export function planSync(snapshot: EntraUser[], existing: ExistingEmployee[], approvals: PendingApproval[]): SyncPlan
      ```
      Rules: key on Entra object id; create unknown users; update name, details and manager when they differ (Entra always wins, nothing HR- or app-entered is read back, AC4/AC5); a user with accountEnabled=false or absent from the snapshot becomes inactive (never deleted, AC10-12); an employee whose manager is null, inactive or absent has `noManager` implied by manager_id = null; each pending/blocked approval is `blocked` when its employee's manager is null or inactive (AC8) and otherwise `pending` with routed_manager_id = current manager (AC9). Entries with no id or no display name are skipped and counted (status `partial`). Safety guards: an empty snapshot is treated as a failed fetch and applies nothing.
    files:
      - services/leave-worker/src/sync/plan-sync.ts
      - services/leave-worker/src/sync/plan-sync.test.ts
    rationale: |
      Keeping the diff logic pure makes every AC checkable in fast vitest tests without a database or network.
  - description: |
      Leave Worker I/O around the core:
      - `src/entra/graph-client.ts`: `fetchEntraUsers(config, fetchImpl = fetch): Promise<EntraUser[]>` using OAuth2 client-credentials and `GET https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,jobTitle,department,accountEnabled&$expand=manager($select=id)&$top=999`, following `@odata.nextLink` until exhausted. Uses Node's built-in `fetch`, so no Graph SDK is added.
      - `src/sync/pg-sync-store.ts`: loads existing employees and open approvals and applies a `SyncPlan` in ONE transaction (pass 1 upsert employees without manager, pass 2 set manager_id by Entra id, then approvals), so a failure leaves the previous data intact.
      - `src/sync/run-sync.ts`: `runSyncWithRetry({ fetch, store, sleep, backoffMs = [60_000, 300_000, 900_000] })` makes up to 4 attempts, records every attempt in `entra_sync_runs` (succeeded, partial or failed) and logs only counts and the error class, never personal data (ADR-0011).
      - `src/sync/scheduler.ts`: computes the next occurrence of `ENTRA_SYNC_TIME_UTC` (default `20:30` UTC, which is 02:00 IST) and runs the sync daily with a timer, no cron dependency.
      - `src/config.ts` and `src/index.ts`: read the settings, start the scheduler next to the existing HTTP server; when the Entra settings are unset the scheduler logs a warning and stays off.
    files:
      - services/leave-worker/src/entra/graph-client.ts
      - services/leave-worker/src/entra/graph-client.test.ts
      - services/leave-worker/src/sync/pg-sync-store.ts
      - services/leave-worker/src/sync/run-sync.ts
      - services/leave-worker/src/sync/run-sync.test.ts
      - services/leave-worker/src/sync/scheduler.ts
      - services/leave-worker/src/sync/scheduler.test.ts
      - services/leave-worker/src/config.ts
      - services/leave-worker/src/index.ts
      - services/leave-worker/package.json
    rationale: |
      ADR-0003 puts scheduled jobs only in the Worker; ADR-0004 lets the Worker use the shared database. Answers the deferred question on cadence, retries and reporting: nightly, up to 4 attempts with backoff, each run recorded in `entra_sync_runs`.
  - description: |
      Web App: load the design system once, then add a read-only employee directory and record view.
      1. `src/index.css` gains `@import '../../../design-system/tokens.css';` and `@import '../../../design-system/prototype-utils.css';` after the tailwind import. Today `index.css` only has `@import 'tailwindcss'` and `main.tsx:4` imports `./index.css`, so tokens are not loaded yet.
      2. `src/api/employees.ts`: `listEmployees(status)` and `getEmployee(id)` over `fetch` to the Leave API (base URL from `VITE_API_BASE_URL`, default `/api`).
      3. `src/employees/EmployeeDirectory.tsx`: `.table-wrap` + `.table` with name, manager, status `.badge` (`badge-success` active, plain `.badge` for inactive), and an `.alert .alert-warning` "No manager in Entra ID. Ask HR to set one there." where `flags.noManager`. Loading uses `.skeleton`, empty uses `.empty-state`, a failed request uses `.alert .alert-danger`.
      4. `src/employees/EmployeeRecord.tsx`: `.card` with name, manager, details, the same flag, and the leave approvals list. It renders NO input, textbox, select or edit/change button (AC6).
      5. `src/App.tsx` switches between directory and record with simple state (no router dependency).
      Tokens used: --space-3, --space-4, --font-size-sm, --font-size-xl, --size-content, --color-fg-muted, --color-warning-subtle and --color-warning-subtle-fg via the design-system classes above; no colour or pixel literals.
    files:
      - apps/web/src/index.css
      - apps/web/src/api/employees.ts
      - apps/web/src/employees/EmployeeDirectory.tsx
      - apps/web/src/employees/EmployeeRecord.tsx
      - apps/web/src/App.tsx
    rationale: |
      ADR-0001: the screens hold no business rules; the flag and status come from the API.
  - description: |
      Document the new settings and the sync behaviour (schedule, retries, run table, required Graph permission) in `docs/entra-sync.md`, and add the manual down script `migrations/0001_employees.down.sql` that drops the tables created by the migration (not run by the migrate runner).
    files:
      - docs/entra-sync.md
      - services/leave-api/migrations/0001_employees.down.sql
    rationale: |
      The Data & rollout section promises both; operators need the settings in one place.
tests:
  - |
    AC1 (leave-worker, `plan-sync.test.ts`) — write first:
    ```ts
    const plan = planSync([user({ id: 'e1', displayName: 'Asha Rao' })], [], []);
    expect(plan.create.map((e) => e.entraId)).toEqual(['e1']);
    ```
    A matching API test in `employees.service.spec.ts` asserts a stored employee is returned by `list('active')`.
  - |
    AC2 (`plan-sync.test.ts` + `employees.service.spec.ts`):
    ```ts
    const plan = planSync([user({ id: 'm1' }), user({ id: 'e1', managerId: 'm1' })], [], []);
    expect(plan.create.find((e) => e.entraId === 'e1')?.managerEntraId).toBe('m1');
    ```
    The service spec asserts `dto.manager` equals `{ id, displayName }` of the manager.
  - |
    AC3 (`plan-sync.test.ts`): existing employee with jobTitle 'Analyst' and snapshot jobTitle 'Lead' gives
    `expect(plan.update[0].changes).toEqual({ jobTitle: 'Lead' })`, and an unchanged employee yields `expect(plan.update).toEqual([])`.
  - |
    AC4 (`plan-sync.test.ts`): existing displayName 'A. Rao' versus Entra 'Asha Rao' gives
    `expect(plan.update[0].changes.displayName).toBe('Asha Rao')`; a second test with HR-style stale app data confirms no field outside the Entra set is read.
  - |
    AC5 (`plan-sync.test.ts`): existing manager m1, snapshot manager m2 gives
    `expect(plan.update[0].changes.managerEntraId).toBe('m2')`.
  - |
    AC6 (`EmployeeRecord.test.tsx`, vitest and Testing Library):
    ```ts
    render(<EmployeeRecord employee={employee} approvals={[]} />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('button', { name: /edit|change|assign/i })).toBeNull();
    ```
    The same assertions run for the directory rows.
  - |
    AC7 (Playwright API test `e2e/employees.e2e.ts`, plus a controller spec): the Nest router has no write route, so
    ```ts
    const res = await request.patch(`/employees/${id}/manager`, { data: { managerId: other } });
    expect(res.status()).toBe(404);
    expect((await (await request.get(`/employees/${id}`)).json()).manager.id).toBe(entraManagerId);
    ```
    A controller spec also asserts `Reflect.getMetadata('path', ...)` shows only GET handlers on `EmployeesController`.
  - |
    AC8 (`plan-sync.test.ts`): pending approval for e1 whose manager m1 is now `accountEnabled: false` (and a second case where m1 is absent from the snapshot, a third where e1 has no manager) gives
    `expect(plan.approvals).toEqual([{ id: 'a1', status: 'blocked', routedManagerId: null }])`.
  - |
    AC9 (`plan-sync.test.ts`): approval a1 is `blocked`, e1's manager in the snapshot is the active m2, so
    `expect(plan.approvals).toEqual([{ id: 'a1', status: 'pending', routedManagerId: 'm2-uuid' }])`.
  - |
    AC10 (`plan-sync.test.ts`): one case where the user is `accountEnabled: false` and one where the user is missing from the snapshot, both giving `expect(plan.deactivate).toEqual(['e1'])`; the service spec asserts `dto.status` is `'inactive'`.
  - |
    AC11 (`employees.service.spec.ts` and e2e): with one active and one inactive employee, `expect((await service.list('active')).map((e) => e.id)).toEqual([activeId])`, and `status=inactive` returns only the inactive one. Directory test asserts the default request is `status=active`.
  - |
    AC12 (`run-sync.test.ts` using an in-memory store, plus e2e): after a run that deactivates e1, the store still holds e1 and its approvals, `expect(store.employees.get('e1')).toBeDefined()`, and `GET /employees/:id` for the inactive employee returns 200 with the `approvals` array intact. A migration check asserts every FK to `employees` is `ON DELETE RESTRICT`.
  - |
    AC13 (`employees.service.spec.ts` + `EmployeeDirectory.test.tsx`): active employee with `manager_id = null` gives `expect(dto.flags.noManager).toBe(true)`, and the UI shows `screen.getByText(/No manager in Entra ID/)`.
  - |
    AC14 (same files): active employee with a manager gives `expect(dto.flags.noManager).toBe(false)` and `expect(screen.queryByText(/No manager in Entra ID/)).toBeNull()`. An inactive employee with no manager also has `noManager === false`.
  - |
    Sync reliability (`run-sync.test.ts`, answers the retry question): fetch fails twice then succeeds gives `expect(fetchUsers).toHaveBeenCalledTimes(3)` and `expect(sleep).toHaveBeenNthCalledWith(1, 60_000)`. Four failures give `expect(runs.at(-1)?.status).toBe('failed')` and nothing applied. An empty snapshot applies nothing. Entries with no id give status `partial` with `skipped` counted. Log output contains no display name or email.
  - |
    Graph client (`graph-client.test.ts`, injected `fetchImpl`): follows `@odata.nextLink` across two pages and maps `manager.id` to `managerId`; a 429 or 5xx response throws a retryable error. Scheduler (`scheduler.test.ts`) with fake timers: next run from 21:00 UTC is 20:30 UTC the next day, and unset Entra settings mean the scheduler does not start.
  - |
    Migration (`services/leave-api/src/db/migrate.spec.ts`): the runner applies files in order, skips ones already in `schema_migrations`, and the SQL declares the three tables with the constraints above. Existing-data check: a migration test seeding rows through the runner and re-running it leaves the rows readable.
  - |
    Existing scaffold tests keep passing; `apps/web/src/App.test.tsx` is updated, because the "Web App" heading is replaced by the directory page.
assumptions_or_open_questions:
  - |
    Cadence, retries and reporting (deferred questions): nightly at 20:30 UTC (02:00 IST), configurable by `ENTRA_SYNC_TIME_UTC`; up to 4 attempts with 1, 5 and 15 minute backoff; every attempt recorded in `entra_sync_runs` and logged as counts only. Alerting on a failed run (who is paged) is not in the story, so it is left as an open question for a human.
  - |
    Conflicts with HR-entered details (deferred question): name, other directory details and manager are overwritten from Entra ID on every run. HR-maintained extra details live in a separate table owned by a sibling story and are never read or written by the sync, so there is nothing to conflict with.
  - |
    OPEN: retention of HR details and leave history after removal from Entra ID (EPIC-004), plus database backup and leave retention (CHORE-015), are not answered. This plan keeps everything indefinitely (inactive, never deleted, FK RESTRICT) and plans no purge job.
  - |
    OPEN: no auth exists yet (ADR-0005 SSO is another story). The employees endpoints enforce role checks through an injected `CallerProvider` whose default rejects with 401, so the real endpoints are unusable until the SSO story supplies it. Needs a human decision: is that acceptable for this story, or must a stub be provided?
  - |
    OPEN: the leave-request model does not exist. `leave_approvals` is the minimum needed for AC8 and AC9 and may clash with the leave-request story's schema; the HR-only details table named in AC12 ("HR details ... still shown") is also not created here, so this story guarantees only that nothing is deleted and the record stays retrievable.
  - |
    "Removed" is detected by absence from a full Graph snapshot, so the sync needs the `User.Read.All` application permission. A disabled or removed manager and a manager who is missing in Entra both block the report's pending approvals, and an inactive employee with no manager gets no flag. Pending approvals also follow the current manager after any manager change.
  - |
    ADR-0009 says the Worker integrates only with email; Microsoft Graph is treated as part of the existing Entra ID identity provider (comp_identity_provider), not a new external system. Please confirm.
  - |
    Vite must be allowed to read `design-system/` outside `apps/web`; the plan assumes the default `server.fs.allow` workspace root (the repo root, which holds `.git`) covers it, and if the build fails on it, `vite.config.ts` is where to fix it.
  - |
    No end-to-end test for the Web App is planned; the Web App unit tests mock `fetch`, and the API e2e covers the contract.
estimated_points: 8
package_dependencies:
  - name: pg
    version: ^8.13.0
    ecosystem: npm
    component_id: comp_leave_api
    rationale: PostgreSQL client for the migration runner and employee repository (the project has no DB driver yet).
  - name: "@types/pg"
    version: ^8.11.0
    ecosystem: npm
    component_id: comp_leave_api
    rationale: Type definitions for pg in the strict TypeScript build.
  - name: pg
    version: ^8.13.0
    ecosystem: npm
    component_id: comp_leave_worker
    rationale: The Worker writes the Entra snapshot to the shared PostgreSQL database.
  - name: "@types/pg"
    version: ^8.11.0
    ecosystem: npm
    component_id: comp_leave_worker
    rationale: Type definitions for pg in the Worker's strict TypeScript build.
notes: |
  ### Data & rollout
  - **Existing data**: the migration only creates new tables (`employees`, `leave_approvals`, `entra_sync_runs`, `schema_migrations`); no existing table is altered, so nothing already stored is affected. Rows the sync later writes are never deleted; people who leave Entra ID become `active = false`.
  - **Backfill / seed**: no seed. The first nightly run fills `employees`. Re-running is idempotent (upsert by `entra_object_id`, approvals recomputed from current state). An operator can trigger the first run by starting the Worker with `ENTRA_SYNC_RUN_ON_START=true` (default false), so HR need not wait a night.
  - **Settings**: `DATABASE_URL` (API and Worker, no default, the process fails fast without it), `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET` (Worker; if any is unset the scheduler stays off with a warning, which is safe), `ENTRA_SYNC_TIME_UTC` (default `20:30`), `ENTRA_SYNC_RUN_ON_START` (default `false`), `VITE_API_BASE_URL` (Web, default `/api`). Documented in a new `docs/entra-sync.md`; the secret is never logged.
  - **Provisioning**: an Entra app registration with the Graph `User.Read.All` application permission and admin consent, and the PostgreSQL instance in ap-south-1 (ADR-0012). Both are infrastructure, not created by this code.
  - **Order and rollback**: run `pnpm migrate` in `services/leave-api`, then deploy the API, then the Worker, then the Web App. Rollback: redeploy the previous images; the new tables are unused by old code, so they can stay. Dropping them is a manual down script (`migrations/0001_employees.down.sql`) that is not needed for normal rollback.

  ```mermaid
  flowchart TD
    Entra[Entra ID via Microsoft Graph]
    Sched[worker sync/scheduler.ts]
    Run[worker sync/run-sync.ts]
    Plan[worker sync/plan-sync.ts]
    Store[worker sync/pg-sync-store.ts]
    Graph[worker entra/graph-client.ts]
    Idx[worker index.ts]
    DB[(PostgreSQL)]
    Mig[api db/migrate.ts + migrations]
    Ctl[api employees.controller.ts]
    Svc[api employees.service.ts]
    Repo[api employees.repository.ts]
    Mod[api app.module.ts]
    Web[web EmployeeDirectory + EmployeeRecord]
    App[web App.tsx]
    Css[web index.css]
    DS[design-system tokens + prototype-utils]
    Idx -->|starts| Sched --> Run
    Run --> Graph --> Entra
    Run --> Plan
    Run --> Store --> DB
    Mig -->|creates schema| DB
    Mod --> Ctl --> Svc --> Repo --> DB
    App --> Web -->|GET /employees| Ctl
    Css --> DS
    classDef touched fill:#f96,color:#000
    class Sched,Run,Plan,Store,Graph,Idx,Mig,Ctl,Svc,Repo,Mod,Web,App,Css touched
  ```
  Touched nodes are orange: all are new files except `index.ts`, `app.module.ts`, `App.tsx` and `index.css`, which are edited to wire the rest in. `Entra`, `DB` and `DS` are context. The worker's existing `server.ts` health route is untouched.

  Test layering: the vitest suites need no database (pure planner, in-memory store and repository fakes, injected `fetch` and `sleep`). The SQL in the two PostgreSQL repositories is verified only by the Playwright API e2e, which needs a PostgreSQL `DATABASE_URL` and so extends `services/leave-api/playwright.config.ts` env and seeds rows directly. This is the least-covered area of the change.
review_focus: |
  IN: the nightly Entra to PostgreSQL sync in the Worker, read-only employee API and UI, and approval blocking/routing. OUT: any in-app editing or manager override, the SSO sign-in, the leave-request model, HR-only details, purge or retention, and alerting. Riskiest area: the transactional apply in `pg-sync-store.ts`, because two-pass manager linking, deactivating on absence from the snapshot and the empty-snapshot guard decide whether a bad Graph response could deactivate everyone. Deliberate choices: no write route exists (404 is the AC7 behaviour), `leave_approvals` is a minimal table that stands in for the later leave model, and the default `CallerProvider` rejects until the SSO story lands.
