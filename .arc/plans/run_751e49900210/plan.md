summary: |
  Let a user browse organizations and read one's details. Today the repo is a bare scaffold: the Leave API only has `GET /health`, the Web App is a single "Web App" heading, there is no organization data anywhere, and the design-system tokens are not loaded by the app. This plan adds (1) a read-only `GET /organizations` endpoint in `comp_leave_api` backed by a PostgreSQL `organizations` table, (2) an Organizations screen in `comp_web_app` that lists organizations, selects a row, and shows the assigned or unassigned detail panel, the "Select an organization" prompt, and the loading / empty / failure (with "Try again") states exactly as in the approved prototype, and (3) loading the design-system tokens and component stylesheet once into the app. Edit, delete and create are excluded (the prototype's Edit/Delete buttons and the per-row "..." menu actions belong to later stories). Tests are written first at each layer (vitest for API and web, Playwright API test for the endpoint).
scope:
  - description: |
      **Load design tokens once.** Import `design-system/tokens.css` and `design-system/prototype-utils.css` (defines `.card`, `.badge`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`, `.skeleton`, `.alert`, `.alert-danger`, `.empty-state`, `.text-muted`, `.container`, `.cluster`, `.stack`) at the top of `apps/web/src/index.css`, right after `@import 'tailwindcss';`:
      ```css
      @import 'tailwindcss';
      @import '../../../design-system/tokens.css';
      @import '../../../design-system/prototype-utils.css';
      @import './organizations/organizations.css';
      ```
      Today `index.css` is only `@import 'tailwindcss';` (apps/web/src/index.css:1) and `main.tsx` imports `./index.css` (apps/web/src/main.tsx:4), so nothing from `design-system/` reaches the app yet.
    files:
      - apps/web/src/index.css
    rationale: |
      UI guidelines require every UI step to style only with design-system tokens; the app does not load them at all today.
  - description: |
      **API: Organization read model and migration.** Add a SQL migration creating `organizations` (`id uuid primary key`, `name text not null`, `address text not null`, `admin_name text null`, `admin_email text null`, `created_by text not null`, `contact_name text not null`, `contact_details text not null`, `created_at timestamptz not null default now()`). "Assigned" is derived: an organization has an admin when `admin_name is not null`. Add `services/leave-api/src/organizations/organization.ts`:
      ```ts
      export interface Organization {
        id: string;
        name: string;
        address: string;
        admin: { name: string; email: string } | null;
        createdBy: string;
        contact: { name: string; details: string };
      }
      ```
      and a `OrganizationsRepository` abstract class (`findAll(): Promise<Organization[]>`) with a `PgOrganizationsRepository` implementation (`pg` Pool from `DATABASE_URL`, `select ... from organizations order by name, id`, mapping rows to the interface). Add a small migration runner script `services/leave-api/scripts/migrate.ts` (applies `migrations/*.sql` in filename order, tracked in a `schema_migrations` table) exposed as `pnpm migrate`.
    files:
      - services/leave-api/migrations/0001_create_organizations.sql
      - services/leave-api/scripts/migrate.ts
      - services/leave-api/src/organizations/organization.ts
      - services/leave-api/src/organizations/organizations.repository.ts
      - services/leave-api/src/organizations/pg-organizations.repository.ts
      - services/leave-api/package.json
    rationale: |
      The data the screen shows does not exist yet; the stack mandates PostgreSQL owned by the Leave API (ADR-0004), and no DB client or migration tooling is present in `services/leave-api/package.json` (read it: only nestjs, reflect-metadata, rxjs).
  - description: |
      **API: `GET /organizations`.** Add `OrganizationsController` (`@Controller('organizations')`, `@Get() list(): Promise<Organization[]>`), `OrganizationsService` (delegates to the repository), and `OrganizationsModule` (provides `OrganizationsRepository` via `PgOrganizationsRepository`); register the module in `services/leave-api/src/app.module.ts` (currently `controllers: [AppController]`, `providers: [AppService]`). Returns the full list ordered by name (see open question on paging). Personal data (admin email, contact details) is never logged (ADR-0011). Role check: see open question about the missing auth layer (ADR-0010).
    files:
      - services/leave-api/src/organizations/organizations.controller.ts
      - services/leave-api/src/organizations/organizations.service.ts
      - services/leave-api/src/organizations/organizations.module.ts
      - services/leave-api/src/app.module.ts
    rationale: |
      The Web App talks only to the Leave API (ADR-0001); the list and details need one endpoint. Detail is carried by the list items, so no separate `GET /organizations/:id` is needed for the ACs.
  - description: |
      **Web: API client and types.** `apps/web/src/organizations/api.ts` exports
      ```ts
      export async function fetchOrganizations(signal?: AbortSignal): Promise<Organization[]>
      ```
      which GETs `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/organizations` and throws on a non-2xx response. `types.ts` mirrors the API `Organization` shape. Add a dev proxy `/api` → the Leave API in `apps/web/vite.config.ts`.
    files:
      - apps/web/src/organizations/types.ts
      - apps/web/src/organizations/api.ts
      - apps/web/vite.config.ts
    rationale: |
      Keeps the page testable by mocking one function and keeps business rules out of the Web App (ADR-0001).
  - description: |
      **Web: Organizations screen** (prototype screen "Organizations"). `OrganizationsPage.tsx` holds state `{ status: 'loading' | 'error' | 'ready'; orgs; selectedId | null }` and loads on mount via `fetchOrganizations`. Rendering, taken from the prototype:
      - Page head `.lr-head`: `<h1>Organizations</h1>` (`--font-size-xl`) and a live-region count line (`aria-live="polite"`, e.g. "3 organizations") in `.text-muted`.
      - `.og-grid` two columns from 48em (`minmax(0,1fr) minmax(0,1.2fr)`), one column below; loading/empty/error blocks span all columns.
      - Ready, list: `<ul class="og-list" aria-label="Organizations">`, one `<li class="og-row">` per organization containing a `<button class="og-select">` with the name (plus `<span class="badge">Admin unassigned</span>` when `admin === null`) and a ghost icon button `.btn .btn-ghost .btn-icon .og-more` with `aria-label="Open details for {name}"` that selects the same row. Selected row gets `.is-selected` and `aria-current="true"` on its select button.
      - Detail area, nothing selected: `.og-prompt` with "**Select an organization**" and "Choose a row to read its address, admin and contact." (AC 11).
      - Detail, admin assigned: `AssignedOrganizationPanel` — `.card.og-panel` (`aria-live="polite"`) with fields Organization (`<h2>` name), Address, Admin (name + email), Created by, and the `.og-contact` block (label "Fundraising Consultant", contact name, contact details).
      - Detail, no admin: `UnassignedOrganizationPanel` — same card, but the Admin field shows muted text "Unassigned" (`.text-muted`); no email line (AC 3, 4). The two panels are separate components so tests can tell them apart (`data-testid="org-detail-panel"` vs `org-detail-panel-unassigned`, matching the prototype's `data-wf-id`s).
      - Excluded from the panels: the prototype's Edit (`.btn-primary`) and Delete (`.btn-secondary`) buttons — they only fire "opens in the edit/delete story" toasts and edit/delete are out of scope. The row "..." button only opens details (as in the prototype), no menu.
      - Loading: `<div role="status" aria-label="Loading organizations" class="card">` with three `.skeleton.og-skel` rows (AC 7).
      - Empty: `.empty-state` with only `<p><strong>No organizations yet</strong></p>` — no button/link (AC 5, 6; also the settled decision that there is no create control).
      - Error: `<div class="alert alert-danger og-error" role="alert">` with "Organizations could not be loaded. Check your connection and try again." and `<button class="btn btn-secondary">Try again</button>`; pressing it sets status back to `loading` immediately (skeleton) and refetches (AC 8-10).
      Selected organization is kept by id and cleared if a reload no longer contains it.
    files:
      - apps/web/src/organizations/OrganizationsPage.tsx
      - apps/web/src/organizations/AssignedOrganizationPanel.tsx
      - apps/web/src/organizations/UnassignedOrganizationPanel.tsx
      - apps/web/src/organizations/organizations.css
    rationale: |
      Implements every AC against the approved prototype. `organizations.css` ports the prototype's own inline `og-*` / `lr-head` rules (they are not in `design-system/`), using only tokens: `--space-1..6`, `--size-content`, `--size-control-lg`, `--border-width`, `--border-width-strong`, `--radius-md`, `--radius-lg`, `--color-border`, `--color-border-strong`, `--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-subtle`, `--color-primary-subtle-fg`, `--color-fg`, `--color-fg-muted`, `--font-size-sm`, `--font-size-lg`, `--font-size-xl`, `--font-weight-medium`, `--line-height-tight`, `--outline-offset`. No hex/px literals; the only non-token value is the 48em breakpoint, which the design itself uses.
  - description: |
      **Web: mount the screen in the shell.** Replace the placeholder body of `apps/web/src/App.tsx` (a "Web App" heading, apps/web/src/App.tsx:1-7) with the top-bar shell from the prototype (brand "Leave Manager"; nav Overview, My leave, Team calendar, Approvals, Account; `Account` as `aria-current="page"`) and render `<OrganizationsPage />` in `<main class="shell-main">`. The prototype assumes Organizations sits under Account; no router exists, so this is the only screen and it renders directly. Update `App.test.tsx` accordingly (the old "Web App" heading assertion is replaced).
    files:
      - apps/web/src/App.tsx
      - apps/web/src/App.test.tsx
    rationale: |
      Makes the screen reachable. The prototype's shell styles (`.shell-*`) are inlined in the prototype, not in `design-system/`; they are defined in `apps/web/src/organizations/organizations.css`' sibling `shell.css` only if the implementer finds `design-system/app-shell.html` defines them, otherwise the shell is kept to minimal Tailwind-free markup using the same tokens. Collapse of nav behind a menu button below 48em is out of this story unless the shell already exists (none does today).
tests:
  - |
    AC1 (API, vitest) — `services/leave-api/src/organizations/organizations.controller.spec.ts`, written first, fails because the controller does not exist:
    ```ts
    const repo = { findAll: vi.fn().mockResolvedValue([orgA, orgB, orgC]) };
    const controller = new OrganizationsController(new OrganizationsService(repo));
    expect(await controller.list()).toHaveLength(3);
    ```
    Plus Playwright API test `services/leave-api/e2e/organizations.e2e.ts` (pattern of `e2e/health.e2e.ts`): seed 3 rows, `const res = await request.get('/organizations'); expect(res.status()).toBe(200); expect(await res.json()).toHaveLength(3);`.
  - |
    API mapping — `pg-organizations.repository.spec.ts`: a row with `admin_name = null` maps to `admin: null`; a row with admin maps to `admin: { name, email }`; `expect(result[0].contact).toEqual({ name: 'Morgan Gould', details: 'mgould@wfchocolate.com · (555) 218-4400' })`. Empty table returns `[]`.
  - |
    AC1 (web) — `OrganizationsPage.test.tsx`, mock `./api`: `vi.mocked(fetchOrganizations).mockResolvedValue([a, b, c]); render(<OrganizationsPage />); expect(await screen.findAllByRole('listitem')).toHaveLength(3);`
  - |
    AC2 — select an assigned org: `await user.click(await screen.findByRole('button', { name: 'Hollywood Youth Arts Center' }));` then `const panel = screen.getByTestId('org-detail-panel'); expect(within(panel).getByRole('heading', { name: 'Hollywood Youth Arts Center' })).toBeInTheDocument();` and `within(panel).getByText('6600 Sunset Blvd, Los Angeles CA 90028')`, admin `Tomas Reyes`, created by `Daniel Gonzalez Bermudez`, contact `Aisha Patel` and its contact details all present.
  - |
    AC3 — select an org with `admin: null`: `expect(screen.getByTestId('org-detail-panel-unassigned')).toBeInTheDocument(); expect(screen.queryByTestId('org-detail-panel')).not.toBeInTheDocument();`
  - |
    AC4 — in the unassigned panel: `within(panel).getByText('Watts Community Library')`, address, created by, contact name and details are present, and `expect(within(panel).getByText('Unassigned')).toBeInTheDocument();` for the Admin field.
  - |
    AC5 — `fetchOrganizations` resolves `[]`: `expect(await screen.findByText('No organizations yet')).toBeInTheDocument();`
  - |
    AC6 — same state: `const empty = (await screen.findByText('No organizations yet')).closest('.empty-state')!; expect(within(empty).queryByRole('button')).toBeNull(); expect(within(empty).queryByRole('link')).toBeNull();`
  - |
    AC7 — `fetchOrganizations` returns a never-resolving promise: `expect(screen.getByRole('status', { name: 'Loading organizations' })).toBeInTheDocument(); expect(screen.queryByRole('listitem')).toBeNull();`
  - |
    AC8 — `fetchOrganizations` rejects: `expect(await screen.findByRole('alert')).toBeInTheDocument();`
  - |
    AC9 — `expect(within(await screen.findByRole('alert')).getByRole('button', { name: 'Try again' })).toBeInTheDocument();`
  - |
    AC10 — first call rejects, second call returns a deferred promise: after `await user.click(screen.getByRole('button', { name: 'Try again' }))` assert `expect(fetchOrganizations).toHaveBeenCalledTimes(2); expect(screen.getByRole('status', { name: 'Loading organizations' })).toBeInTheDocument();` then resolve the deferred and `expect(await screen.findAllByRole('listitem')).toHaveLength(3);`
  - |
    AC11 — loaded list, no click: `expect(await screen.findByText('Select an organization')).toBeInTheDocument(); expect(screen.queryByTestId('org-detail-panel')).toBeNull(); expect(screen.queryByTestId('org-detail-panel-unassigned')).toBeNull();`
  - |
    Scope guard — with the list loaded and a row selected: `expect(screen.queryByRole('button', { name: /edit|delete|create|add/i })).toBeNull();`
assumptions_or_open_questions:
  - |
    **Paging / very many organizations (deferred question).** The ACs only require all 3 rows to show, and ADR-0006 sizes for 5,000 employees (not organizations). Assumed: `GET /organizations` returns the whole list ordered by name with no paging or search in this story. If the reviewer wants server paging (`limit`/`offset` or cursor) or a virtualised list, say so and it is added as a follow-up or to this plan.
  - |
    **Where organization data comes from.** No organizations table, seed or creation flow exists, and creation is excluded here. Real rows will therefore be absent until the creation story (or a seed) lands; the migration creates an empty table and no fixture is shipped, per the "never ship a screen on invented data" rule. Confirm whether a dev/demo seed script is wanted.
  - |
    **No DB layer exists in `comp_leave_api` yet** (only nestjs/rxjs deps; no ORM, migration tool or `DATABASE_URL`). This plan adds plain `pg` plus a minimal SQL migration runner. If the team prefers an ORM/migration tool (TypeORM, Prisma, Drizzle, node-pg-migrate), that is a stack decision to confirm before implementation; it changes only the repository and migration files.
  - |
    **Role check (ADR-0010) and auth.** Sign-in & Access Control is a separate dependency and no auth guard exists in the API. Assumed: the endpoint is added without a guard now, and the sign-in story's guard is applied to it later. Which roles may view organizations is not stated in the item; confirm (likely HR/admin only) before the endpoint is exposed outside development.
  - |
    **Prototype vs ACs.** No conflict found. Deliberate omissions from the prototype: the Edit/Delete buttons in both panels (edit/delete are out of scope) and the toasts they trigger. The prototype shows the unassigned Admin line as "Unassigned"; AC 4 says "unassigned" — the capitalised label is used.
  - |
    **Prototype's "Fundraising Consultant" label vs the AC word "contact".** The ACs call this block "contact"; the prototype labels it "Fundraising Consultant" with a name and contact details. The plan follows the prototype label and treats name + details as "contact". Confirm the label.
  - |
    **Navigation placement.** The prototype assumes Organizations sits under Account (not one of the five documented sections) and the repo has no router. The screen is mounted directly as the app's only page; real navigation is a later concern. Whether the `.shell-*` shell styles exist in `design-system/app-shell.html` was not verified in detail — the implementer should open it and reuse it if so.
  - |
    **Data retention/backup questions** (deleted-organization retention, PostgreSQL backups, leave-record retention) are project-wide and not affected by this read-only story.
  - |
    **Ordering and Created by.** Rows are ordered by name; "Created by" and contact are plain text (no profile links), as in the prototype.
estimated_points: 8
package_dependencies:
  - name: pg
    version: ^8.13.0
    ecosystem: npm
    component_id: comp_leave_api
    rationale: PostgreSQL client for the organizations repository in the Leave API; the stack mandates PostgreSQL but no client is installed yet.
  - name: "@types/pg"
    version: ^8.11.0
    ecosystem: npm
    component_id: comp_leave_api
    rationale: Type declarations for pg (TypeScript project).
  - name: "@testing-library/user-event"
    version: ^14.5.0
    ecosystem: npm
    component_id: comp_web_app
    rationale: Realistic row-click and Try-again interactions in the web tests (only @testing-library/react and jest-dom are installed today).
notes: |
  ### Data & rollout
  - **Existing data**: new table only (`0001_create_organizations.sql`); no existing rows or columns are altered. Nothing already stored is affected.
  - **Backfill / seed**: none. The table starts empty and no seed ships (no creation flow in this story); the migration runner is idempotent via a `schema_migrations` table and safe to re-run.
  - **Settings**: `DATABASE_URL` (Leave API; no default, the API fails fast at startup if unset when the organizations module is active) and `VITE_API_BASE_URL` (Web App; default `/api`). Document both in a `services/leave-api/.env.example` and `apps/web/.env.example`.
  - **Provisioning**: a PostgreSQL database (Amazon RDS, ap-south-1 per ADR-0008/0012) reachable from the Leave API, and `pnpm migrate` run against it.
  - **Order and rollback**: migrate first, then deploy the API, then the Web App. Rollback: redeploy the previous API/Web App; the empty `organizations` table can safely stay (add `down` SQL only if the team wants one).

  ### Why the layers look like this
  The Web App only calls the Leave API (ADR-0001) and holds no business rules; "assigned vs unassigned" is a display choice on `admin === null`, the API owns the shape. Only the Leave API touches PostgreSQL (ADR-0004).

  ### Design tokens
  Tokens are loaded by importing `design-system/tokens.css` at `apps/web/src/index.css` line 2 (new). `apps/web/vite.config.ts` already uses `@tailwindcss/vite`; Tailwind v4 coexists with the plain-CSS imports, and `vite` can serve `design-system/` since the git worktree root is the default fs allow root. Classes named in the plan (`.card`, `.badge`, `.btn*`, `.skeleton`, `.alert-danger`, `.empty-state`, `.text-muted`) are defined in `design-system/prototype-utils.css`; `.og-*` and `.lr-head` are defined only in the prototype's inline style and are re-defined in `organizations.css` on the same tokens.

  ```mermaid
  flowchart TD
    main[apps/web/src/main.tsx] --> App[apps/web/src/App.tsx]
    main --> css[apps/web/src/index.css]
    App --> Page[OrganizationsPage.tsx]
    Page --> Panels[Assigned / Unassigned panels]
    Page --> WebApi[organizations/api.ts]
    WebApi -->|GET /organizations| Ctl[OrganizationsController]
    Ctl --> Svc[OrganizationsService]
    Svc --> Repo[PgOrganizationsRepository]
    Repo --> DB[(PostgreSQL organizations)]
    Mod[app.module.ts] --> Ctl
    css --> DS[design-system/tokens.css + prototype-utils.css]
    classDef touched fill:#f96,color:#000
    class App,css,Page,Panels,WebApi,Ctl,Svc,Repo,Mod,DS touched
  ```
  (`DS` is imported, not modified; `main.tsx` is unchanged.)
review_focus: |
  IN: read-only `GET /organizations` + the Organizations screen (list, select, assigned/unassigned panel, select prompt, loading/empty/error with Try again) and loading design tokens. OUT: edit, delete, create, row "..." menus, Edit/Delete buttons (deliberately dropped from the prototype), paging, auth guard. Riskiest: the new PostgreSQL layer (no DB tooling existed; `pg` + migration runner are new) and the unresolved role check (ADR-0010). Empty-state must have no action and the unassigned panel must be a distinct component from the assigned one — both are deliberate per ACs 3, 4 and 6.
