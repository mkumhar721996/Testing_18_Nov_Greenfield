summary: |
  Employees open **My leave** and see one card per leave type with their available balance, with any pending days shown beside it (never subtracted). The Leave API serves `GET /leave-balances/me` for the calling employee only (`request.principal.employeeId`). The balance is derived as opening balance minus approved leave days. Non-negative balances are floored to whole days (4.5 shows 4). Negative balances are shown as-is (-0.5 shows -0.5). The Web App renders the approved prototype (cards, loading skeleton, empty state, error alert with retry) from that endpoint only (ADR-0001). This story creates no leave tables. It reads leave types, opening balances and requests through a narrow data-source port, backed for now by an in-memory mock until the HR Reporting & Administration and Leave Request stories supply the real data model.
scope:
  - description: |
      Data-source port and interim in-memory mock. Define the port the service depends on, and bind it with a DI token so the HR and Leave Request stories can later swap in a PostgreSQL implementation without touching the service or controller.

      ```ts
      export const LEAVE_BALANCES_SOURCE = Symbol('LEAVE_BALANCES_SOURCE');
      export interface LeaveBalanceSourceRow {
        leaveTypeId: string;
        leaveTypeName: string;
        openingDays: number;   // may be fractional, entered by HR
        approvedDays: number;  // sum of approved requests of this type
        pendingDays: number;   // sum of pending requests of this type
        pendingFrom: string | null; // ISO date, earliest pending request
        pendingTo: string | null;
      }
      export interface LeaveBalancesSource {
        findForEmployee(employeeId: string): Promise<LeaveBalanceSourceRow[]>;
      }
      ```

      `InMemoryLeaveBalancesSource` implements it from a `Map<employeeId, rows>` with a `seed(employeeId, rows)` method. It is empty by default, so the real app shows the empty state until real data exists. It is seeded only in tests, and in dev when `LEAVE_BALANCES_DEV_SEED=true`, which loads a small fixture. Configured leave types come from HR Reporting & Administration, so the real adapter must return one row per active leave type, including types with no balance row.
    files:
      - services/leave-api/src/leave-balances/leave-balances.source.ts
      - services/leave-api/src/leave-balances/in-memory-leave-balances.source.ts
    rationale: |
      The reviewer decided that this story must not create leave tables, because HR and Leave Request own those entities. The port keeps the dependency explicit and replaceable. Leave data stays out of the web bundle, and nothing is shipped as hard-coded production data.
  - description: |
      Leave API balances module (NestJS). `LeaveBalancesService.getForEmployee(employeeId)` maps source rows to the DTO and holds the business rules. `LeaveBalancesController` exposes `GET /leave-balances/me`. `LeaveBalancesModule` binds `LEAVE_BALANCES_SOURCE` to `InMemoryLeaveBalancesSource` and is registered in `app.module.ts`.

      ```ts
      export interface LeaveBalanceDto {
        leaveTypeId: string;
        leaveTypeName: string;
        balanceDays: number;   // see rule below
        pendingDays: number;   // shown separately, never subtracted
        pendingFrom: string | null;
        pendingTo: string | null;
      }
      export interface LeaveBalancesResponse { asOf: string; balances: LeaveBalanceDto[] }

      // rule
      const underlying = row.openingDays - row.approvedDays;
      const balanceDays = underlying >= 0 ? Math.floor(underlying) : underlying;
      ```
      The balance is always derived and never stored or decremented (reviewer decision). Pending days never enter the formula.
    files:
      - services/leave-api/src/leave-balances/leave-balances.module.ts
      - services/leave-api/src/leave-balances/leave-balances.controller.ts
      - services/leave-api/src/leave-balances/leave-balances.service.ts
      - services/leave-api/src/leave-balances/leave-balances.dto.ts
      - services/leave-api/src/app.module.ts
    rationale: |
      All balance rules live in the API (ADR-0001, ADR-0002). The employee id comes only from the authenticated principal. Only the Leave API will touch PostgreSQL (ADR-0004), through the future adapter.
  - description: |
      Caller identity. Add `AuthenticatedGuard` and a `@CurrentEmployee()` param decorator that read `request.principal.employeeId` (confirmed contract: the authentication layer populates it, and it is the authoritative employee id). The guard returns 401 when the principal is absent. The controller never reads an employee id from a path or query parameter, so AC3 holds structurally. The Entra ID middleware that sets the principal belongs to Sign-in & Access Control (ADR-0005) and is not built here.
    files:
      - services/leave-api/src/auth/authenticated.guard.ts
      - services/leave-api/src/auth/current-employee.decorator.ts
    rationale: |
      ADR-0010 requires every endpoint to check the caller. Only the narrow contract this endpoint consumes is added.
  - description: |
      Web App design-system wiring. `apps/web/src/index.css` currently holds only `@import 'tailwindcss';` (line 1) and is loaded by `main.tsx` (line 4). Add `@import '../../../design-system/tokens.css';` and `@import '../../../design-system/prototype-utils.css';` after it, once. The prototype's `.card`, `.badge`, `.badge-warning`, `.divider`, `.btn`, `.btn-secondary`, `.btn-primary`, `.alert`, `.alert-danger`, `.empty-state`, `.skeleton`, `.grid`, `.stack`, `.cluster`, `.text-muted` and `.text-sm` are defined in `prototype-utils.css` (verified in the prototype's inlined copy). Define the prototype's own inline classes (lb-who, lb-head, lb-bar, lb-type, lb-days, lb-label, lb-row, lb-detail, lb-note, lb-pending, lb-skel-card, lb-skel) and the `.shell-*` classes in the same stylesheet, on the same tokens, copied from the prototype's style blocks. Do not use any hex or px literal.

      **Card grid width.** The prototype's `.lb-grid` uses `minmax(14rem, 1fr)`, a literal no token covers. Do not copy it. Use the design system's existing responsive `.grid` utility, which is `repeat(auto-fit, minmax(min(100%, calc(var(--size-menu) * 1.5)), 1fr))` and so is built from the `--size-menu` token. No new token is needed. The card minimum becomes about 300px instead of 224px, so cards are slightly wider and wrap sooner.
    files:
      - apps/web/src/index.css
    rationale: |
      The app does not load the design tokens today. The implementer must confirm `vite.config.ts` registers `@tailwindcss/vite` (a dev dependency, but the file was not read). Importing from `design-system/` keeps one source of truth.
  - description: |
      Web App balances screen. `LeaveBalancesPage` fetches `GET /leave-balances/me` via `fetchMyLeaveBalances()` in `src/api/leaveBalances.ts` and renders the prototype's four states. **Default**: `h1` "My leave balances" (font-size-xl), subtitle "Showing balances for you only. Balances are shown in whole days.", a bar with "Updated Wed 18 Nov 2026" (from `asOf`) and a `.btn-secondary` "Refresh", then a `.grid` with `role="list"` of `LeaveBalanceCard`, and the note "Pending days are not deducted from your balance until approved." Each `.card` (`role="listitem"`) has an `h2` leave type, the number with a small "days", the label "Available balance", a `.divider`, then a "Pending request" row: a `.badge badge-warning` "3 days pending" plus a detail line with the written-out range (for example "Mon 8 Dec – Wed 10 Dec"), or muted "None". The subtitle's "whole days" wording is kept from the prototype but is inaccurate for a negative balance, so see the open questions. **Loading**: three `.card` skeletons using `.skeleton` in a `role="status"` region labelled "Loading your leave balances". **Empty**: `.empty-state` "No leave types are set up for you yet." and "Contact HR if you expect to see leave balances here." **Error**: `.alert alert-danger role="alert"` "Your leave balances could not be loaded. Check your connection and try again." and a `.btn-primary` "Try again" that refetches. A minimal app shell replaces the placeholder in `App.tsx`: top bar, nav in the order Overview, My leave, Team calendar, Approvals, Account, collapsing behind the menu button below 48em, with My leave current. Approvals is hidden by default, because no role data exists, and is to be shown only to manager or approver roles once role management lands. The web code only formats (dates, "1 day" or "N days") and never rounds or does arithmetic on balances, so a negative value is shown exactly as the API returns it.
    files:
      - apps/web/src/App.tsx
      - apps/web/src/api/leaveBalances.ts
      - apps/web/src/features/leave-balances/LeaveBalancesPage.tsx
      - apps/web/src/features/leave-balances/LeaveBalanceCard.tsx
      - apps/web/src/features/leave-balances/formatPendingRange.ts
      - apps/web/src/shell/AppShell.tsx
    rationale: |
      Implements the approved prototype screen "Leave balances" with its default, loading, empty and error states, against the real endpoint instead of the prototype's inline sample data. The manager name, the approved-days note and the "My requests" button are omitted (reviewer accepted: no acceptance criterion, and the data does not exist yet).
tests:
  - |
    AC1 (service, `leave-balances.service.spec.ts`). Write first, fails until the service exists. With the in-memory source seeded with two leave types:
    ```ts
    source.seed('emp-a', [row('Annual leave', { openingDays: 10 }), row('Sick leave', { openingDays: 5 })]);
    const res = await service.getForEmployee('emp-a');
    expect(res.balances.map(b => b.leaveTypeName)).toEqual(['Annual leave', 'Sick leave']);
    ```
    A row with `openingDays: 0` still appears: `expect(res.balances).toHaveLength(2)`.
  - |
    AC2 and AC7 (service). Whole days, floored, for a non-negative balance:
    ```ts
    source.seed('emp-a', [row('Sick leave', { openingDays: 4.5, approvedDays: 0 })]);
    const [b] = (await service.getForEmployee('emp-a')).balances;
    expect(Number.isInteger(b.balanceDays)).toBe(true);
    expect(b.balanceDays).toBe(4);
    ```
    Negative balances are not rounded (reviewer decision):
    ```ts
    // opening 1, approved 1.5 gives -0.5
    expect(balanceFor({ openingDays: 1, approvedDays: 1.5 })).toBe(-0.5);
    // opening 0, approved 1.25 gives -1.25
    expect(balanceFor({ openingDays: 0, approvedDays: 1.25 })).toBe(-1.25);
    ```
  - |
    AC3 (controller spec, plus guard spec and the Playwright API test `e2e/leave-balances.api.spec.ts`). The controller passes the principal's id and nothing else:
    ```ts
    controller.getMine({ employeeId: 'emp-a' });
    expect(service.getForEmployee).toHaveBeenCalledWith('emp-a');
    expect(service.getForEmployee).not.toHaveBeenCalledWith('emp-b');
    ```
    With the source seeded for A (10 days) and B (99 days), a call as A has no 99 in the response. A call with no principal gives `expect(res.status()).toBe(401)`. The e2e sets the principal through a test-only hook and does not need a real database.
  - |
    AC4 and AC5 (service). Pending is neither subtracted nor merged:
    ```ts
    source.seed('emp-a', [row('Annual leave', { openingDays: 10, approvedDays: 0, pendingDays: 3 })]);
    const [b] = (await service.getForEmployee('emp-a')).balances;
    expect(b.balanceDays).toBe(10);
    expect(b.pendingDays).toBe(3);
    ```
    Web (`LeaveBalanceCard.test.tsx`):
    ```tsx
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3 days pending')).toBeInTheDocument();
    ```
  - |
    AC6 (service). Opening 10 and an approved request of 3 days gives 7, derived and not stored:
    ```ts
    source.seed('emp-a', [row('Annual leave', { openingDays: 10, approvedDays: 3 })]);
    const [b] = (await service.getForEmployee('emp-a')).balances;
    expect(b.balanceDays).toBe(7);
    ```
    Calling `getForEmployee` twice returns the same value (`expect(second).toEqual(first)`), and a test seeds `pendingDays: 3` with `approvedDays: 0` to show pending does not change the balance.
  - |
    Web states (`LeaveBalancesPage.test.tsx`, `fetch` mocked). Each is written before the page exists:
    ```tsx
    // loading
    expect(screen.getByRole('status', { name: 'Loading your leave balances' })).toBeInTheDocument();
    // empty
    expect(await screen.findByText('No leave types are set up for you yet.')).toBeInTheDocument();
    // error + retry
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    ```
    Display of values the API returns, with no client-side rounding:
    ```tsx
    // balanceDays: 4 and balanceDays: -0.5
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('-0.5')).toBeInTheDocument();
    ```
  - |
    Shell (`AppShell.test.tsx`). Approvals is not rendered by default (`expect(screen.queryByText('Approvals')).not.toBeInTheDocument()`), and My leave has `aria-current="page"`.
assumptions_or_open_questions:
  - |
    Until the HR Reporting & Administration and Leave Request stories land, balances come from `InMemoryLeaveBalancesSource` (reviewer decision: use mocks, create no tables). It is empty by default, so a deployed app shows the empty state, and dev-seeded only with `LEAVE_BALANCES_DEV_SEED=true`. Whoever implements the real data model must replace the provider binding in `LeaveBalancesModule` with an adapter that returns one `LeaveBalanceSourceRow` per active leave type. Until then this story is demonstrable but not useful in production.
  - |
    Negative balances (reviewer decision) are shown as-is, for example -0.5 days, which conflicts with AC2 ("whole number of days") for that case. This plan treats negative balances as exempt from AC2, floors only non-negative values, and leaves AC7 unchanged. Whether a negative balance can occur at all depends on HR's pending decision on override.
  - |
    The prototype subtitle says "Balances are shown in whole days." That is not true for a negative balance. Please confirm whether to keep the sentence or reword it (for example "Balances are shown in days.").
  - |
    The card grid now uses the design system's `.grid` utility (minimum width about 300px, from `--size-menu`) instead of the prototype's `14rem` literal, as the reviewer asked for an existing token or responsive rule. No new design-system token was added.
  - |
    Authentication layer sets `request.principal.employeeId` (confirmed). If Sign-in & Access Control is not merged when this is implemented, the e2e test uses a test-only hook to set the principal.
  - |
    Project-wide open questions (database backup and recovery, leave record retention) do not affect this read-only story. How HR enters opening balances (the write path) is a separate story and out of scope.
estimated_points: 5
package_dependencies: []
notes: |
  ### Data & rollout

  None — no schema, migration or stored data changes. This story reads through an in-memory mock, so there are no existing rows to migrate or backfill. The only new setting is the optional `LEAVE_BALANCES_DEV_SEED`, default off (the API starts with an empty source), documented in `services/leave-api/.env.example`. Nothing needs provisioning. Deploy the API and then the Web App, and roll back by redeploying the previous versions. When the real adapter replaces the mock, that story owns its own migration and data-rollout notes.

  Repo facts read while planning: `services/leave-api/src/app.module.ts` registers only `AppController` and `AppService`. `apps/web/src/index.css` is `@import 'tailwindcss';` only. `apps/web/src/main.tsx` imports `./index.css`. `design-system/` holds `tokens.css`, `prototype-utils.css`, `app-shell.html`, `style-guide.html`, `tokens.json` and `UI-GUIDELINES.md`. Tests use vitest (`pnpm test` runs `vitest run` in both the API and the web app) and Playwright for the API e2e. Narrow forms of the test command, for example `(cd services/leave-api && pnpm vitest run src/leave-balances)` and `(cd apps/web && pnpm vitest run src/features/leave-balances)`.

  Prototype elements used (read from the design file): shell with top bar and nav (My leave current), `.lb-who` signed-in line, `.lb-head` title and subtitle, `.lb-bar` with updated-at and Refresh, a grid of `.card`, `.lb-note`, and the loading, empty and error states.

  ```mermaid
  flowchart TD
    Main[main.tsx] --> App[App.tsx]
    App --> Shell[AppShell.tsx]
    Shell --> Page[LeaveBalancesPage.tsx]
    Page --> Client[api/leaveBalances.ts]
    Page --> Card[LeaveBalanceCard.tsx]
    Main --> Css[index.css]
    Css --> Tokens[design-system/tokens.css]
    Client -->|GET /leave-balances/me| Ctrl[leave-balances.controller.ts]
    Ctrl --> Guard[authenticated.guard.ts]
    Ctrl --> Svc[leave-balances.service.ts]
    Svc --> Port[leave-balances.source.ts]
    Port --> Mock[in-memory-leave-balances.source.ts]
    Mod[app.module.ts] --> Ctrl
    classDef touched fill:#f96,color:#000
    class App,Shell,Page,Client,Card,Css,Ctrl,Guard,Svc,Port,Mock,Mod touched
  ```
review_focus: |
  IN scope: the read-only balances endpoint and screen for the signed-in employee (AC1 to AC7), a replaceable data-source port with an in-memory mock, and a caller-identity guard. OUT of scope: any leave table or migration (owned by the HR and Leave Request stories), HR entry of opening balances, requests and approval, the Entra ID sign-in, and the prototype's manager name, approved-days note and "My requests" button. The riskiest areas are the rule `underlying >= 0 ? Math.floor(underlying) : underlying` (negatives are deliberately shown as-is, so do not flag them as breaking AC2), and keeping the employee id sourced only from the principal. The mock source is deliberate and temporary, and the card grid uses the existing `.grid` utility on purpose instead of the prototype's `14rem`.
