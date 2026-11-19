summary: |
  Employees open **My leave** and see one card per configured leave type with their available balance in whole days, any pending days shown separately, "Not set" where HR has entered no opening balance, and a "no leave types configured" message when there are none. The Leave API serves `GET /leave-balances/me` for the calling employee only (id taken from the authenticated principal, never from the URL). All balance rules live in the API (ADR-0001, ADR-0002). The Web App only renders the approved prototype (cards, loading skeleton, empty state, error alert with retry) from that endpoint. This story creates no leave tables: leave types, opening balances and requests are read through a narrow data-source port, backed for now by an in-memory source until the HR Reporting & Administration and Leave Request stories supply the real data model.
scope:
  - description: |
      Data-source port and interim in-memory source (Leave API). The service depends only on the port, bound by a DI token, so a PostgreSQL adapter can replace the mock later without touching the service or controller.

      ```ts
      export const LEAVE_BALANCES_SOURCE = Symbol('LEAVE_BALANCES_SOURCE');
      export interface LeaveBalanceSourceRow {
        leaveTypeId: string;
        leaveTypeName: string;
        openingDays: number | null; // null = HR has not entered an opening balance (AC8)
        approvedDays: number;       // sum of approved requests of this type
        pendingDays: number;        // sum of pending requests of this type
        pendingFrom: string | null; // ISO date, earliest pending request
        pendingTo: string | null;
      }
      export interface LeaveBalancesSource {
        findForEmployee(employeeId: string): Promise<LeaveBalanceSourceRow[]>;
      }
      ```

      `InMemoryLeaveBalancesSource` implements it from a `Map<employeeId, rows>` with `seed(employeeId, rows)`. It is empty by default, so a real deployment shows the empty state until real data exists. It is seeded in tests, and in dev only when `LEAVE_BALANCES_DEV_SEED=true`. The real adapter must return one row per configured leave type, including types with no opening balance (`openingDays: null`).
    files:
      - services/leave-api/src/leave-balances/leave-balances.source.ts
      - services/leave-api/src/leave-balances/in-memory-leave-balances.source.ts
    rationale: |
      Leave types, policies and opening balances are owned by HR Reporting & Administration, and requests by the Leave Request stories. The port keeps the dependency explicit and replaceable and ships no hard-coded production data.
  - description: |
      Leave API balances module (NestJS). `LeaveBalancesService.getForEmployee(employeeId)` maps source rows to the DTO and holds the rules. `LeaveBalancesController` exposes `GET /leave-balances/me`. `LeaveBalancesModule` binds `LEAVE_BALANCES_SOURCE` to `InMemoryLeaveBalancesSource` and is registered in `AppModule` (today it declares only `AppController` and `AppService`).

      ```ts
      export interface LeaveBalanceDto {
        leaveTypeId: string;
        leaveTypeName: string;
        balanceDays: number | null; // whole days; null = not set (AC8)
        pendingDays: number;        // shown separately (AC6)
        pendingFrom: string | null;
        pendingTo: string | null;
      }
      export interface LeaveBalancesResponse { asOf: string; balances: LeaveBalanceDto[] }

      // rule
      balanceDays = row.openingDays === null
        ? null
        : Math.trunc(row.openingDays - row.approvedDays - row.pendingDays);
      ```
      The balance is derived on every read, never stored. An empty `balances` array means no leave types are configured (AC7). `Math.trunc` is used so 4.5 gives 4 and a shortfall is never overstated (see open questions on negatives and pending).
    files:
      - services/leave-api/src/leave-balances/leave-balances.module.ts
      - services/leave-api/src/leave-balances/leave-balances.controller.ts
      - services/leave-api/src/leave-balances/leave-balances.service.ts
      - services/leave-api/src/leave-balances/leave-balances.dto.ts
      - services/leave-api/src/app.module.ts
    rationale: |
      Business rules stay in the API (ADR-0001, ADR-0002). Only the Leave API will touch PostgreSQL (ADR-0004), through the future adapter.
  - description: |
      Caller identity. Add `AuthenticatedGuard` and a `@CurrentEmployee()` param decorator reading `request.principal.employeeId`. The guard returns 401 when the principal is absent. The controller never reads an employee id from a path or query parameter, so AC3 holds structurally. The Entra ID middleware that sets the principal belongs to Sign-in & Access Control (ADR-0005) and is not built here.

      ```ts
      @Get('me') @UseGuards(AuthenticatedGuard)
      getMine(@CurrentEmployee() employeeId: string): Promise<LeaveBalancesResponse>
      ```
    files:
      - services/leave-api/src/auth/authenticated.guard.ts
      - services/leave-api/src/auth/current-employee.decorator.ts
    rationale: |
      ADR-0010 requires every endpoint to check the caller. Only the narrow contract this endpoint consumes is added. The `request.principal.employeeId` shape is an assumption (see open questions).
  - description: |
      Web App styling. `apps/web/src/index.css` already imports `tailwindcss`, `design-system/tokens.css` and `design-system/prototype-utils.css` (lines 1 to 3), so no wiring is needed. `.card`, `.badge-warning`, `.divider`, `.btn-primary`, `.btn-secondary`, `.alert-danger`, `.empty-state`, `.skeleton`, `.grid` and `.text-muted` are defined in `prototype-utils.css` (verified by reading it). The prototype's own classes (`lb-who`, `lb-head`, `lb-bar`, `lb-type`, `lb-days`, `lb-label`, `lb-row`, `lb-detail`, `lb-note`, `lb-pending`, `lb-skel-card`, `lb-skel`) are inline in the prototype only. Define them in a new `leave-balances.css` imported by the page, on the same tokens (`--space-*`, `--font-size-*`, `--font-weight-*`, `--color-fg-muted`, `--color-primary-subtle`, `--color-primary-subtle-fg`, `--radius-sm`, `--line-height-tight`), copied from the prototype's style block. Before finishing, confirm `.is-short`, `.is-tall` and `.btn-ghost`/`.btn-sm` exist in `prototype-utils.css`; define any that do not on tokens in the same file. No hex or px literals.

      The prototype's `.lb-grid` uses `minmax(14rem, 1fr)`, a literal no token covers. Use the existing `.grid` utility instead (minimum from `--size-menu`); cards are slightly wider and wrap sooner.
    files:
      - apps/web/src/features/leave-balances/leave-balances.css
    rationale: |
      Tokens are already loaded through index.css, so one source of truth is kept.
  - description: |
      Web App balances screen. `fetchMyLeaveBalances()` in `src/api/leaveBalances.ts` calls `GET /leave-balances/me`. `LeaveBalancesPage` renders the prototype's four states. **Default**: `h1` "My leave balances", subtitle "Showing balances for you only. Balances are shown in whole days.", a bar with "Updated Wed 18 Nov 2026" (from `asOf`) and a `.btn-secondary` "Refresh", then a `.grid` with `role="list"` of `LeaveBalanceCard`, and a note under the grid. Each `.card` (`role="listitem"`) has an `h2` leave type, the number with a small "days", the label "Available balance", a `.divider`, then a "Pending request" row: `.badge badge-warning` "3 days pending" plus a detail line with the written-out range (for example "Mon 8 Dec – Wed 10 Dec"), or muted "None". When `balanceDays` is null the number is replaced by "Not set" (AC8). **Loading**: three card skeletons in a `role="status"` region labelled "Loading your leave balances". **Empty**: `.empty-state` "No leave types are set up for you yet." with "Contact HR if you expect to see leave balances here." (AC7). **Error**: `.alert alert-danger role="alert"` "Your leave balances could not be loaded. Check your connection and try again." and `.btn-primary` "Try again" that refetches.

      The web code only formats (dates, "1 day" or "N days") and never rounds or does arithmetic on balances.

      Routing and shell: the app today renders `Dashboard` from `App.tsx` with a `TopBar` and `SideNav` driven by `dashboard/navigation.ts` (banking-style destinations, hash navigation through `navigateTo`). Add a `my-leave` destination with a "My leave" item to `navigation.ts`, and make `App.tsx` render `LeaveBalancesPage` inside the existing layout when `window.location.hash` is `#/my-leave`, with My leave marked `aria-current="page"` in `TopBar.tsx`. Do not restructure the existing dashboard shell here. The prototype's full five-item top bar (Overview, My leave, Team calendar, Approvals, Account) is a shell-level change that conflicts with the existing dashboard and is left out (see open questions). The prototype's manager name, approved-days note and "My requests" button are omitted (no acceptance criterion, data does not exist yet).
    files:
      - apps/web/src/api/leaveBalances.ts
      - apps/web/src/features/leave-balances/LeaveBalancesPage.tsx
      - apps/web/src/features/leave-balances/LeaveBalanceCard.tsx
      - apps/web/src/features/leave-balances/formatPendingRange.ts
      - apps/web/src/dashboard/navigation.ts
      - apps/web/src/dashboard/TopBar.tsx
      - apps/web/src/App.tsx
    rationale: |
      Implements the approved "Leave balances" prototype screen with its default, loading, empty and error states against the real endpoint instead of the prototype's inline sample data (Priya Raman, Annual/Casual/Sick).
tests:
  - |
    AC1 (service, `services/leave-api/src/leave-balances/leave-balances.service.spec.ts`). Write first; fails until the service exists. A balance per configured type, including one with opening 0:
    ```ts
    source.seed('emp-a', [row('Annual leave', { openingDays: 10 }), row('Sick leave', { openingDays: 0 })]);
    const res = await service.getForEmployee('emp-a');
    expect(res.balances.map(b => b.leaveTypeName)).toEqual(['Annual leave', 'Sick leave']);
    ```
  - |
    AC2 and AC4 (service). Whole days; 4.5 shows 4:
    ```ts
    source.seed('emp-a', [row('Sick leave', { openingDays: 4.5, approvedDays: 0, pendingDays: 0 })]);
    const [b] = (await service.getForEmployee('emp-a')).balances;
    expect(Number.isInteger(b.balanceDays)).toBe(true);
    expect(b.balanceDays).toBe(4);
    ```
  - |
    AC3 (controller spec, guard spec). The controller passes the principal's id and nothing else; the guard rejects a missing principal:
    ```ts
    await controller.getMine('emp-a');
    expect(service.getForEmployee).toHaveBeenCalledWith('emp-a');
    expect(service.getForEmployee).not.toHaveBeenCalledWith('emp-b');
    expect(() => guard.canActivate(ctxWithoutPrincipal)).toThrow(UnauthorizedException);
    ```
    Service level, with A seeded at 10 and B at 99: `expect(JSON.stringify(await service.getForEmployee('emp-a'))).not.toContain('99')`.
  - |
    AC5 (service). Opening 10 with a pending request of 3 days shows 7:
    ```ts
    source.seed('emp-a', [row('Annual leave', { openingDays: 10, approvedDays: 0, pendingDays: 3 })]);
    const [b] = (await service.getForEmployee('emp-a')).balances;
    expect(b.balanceDays).toBe(7);
    ```
  - |
    AC6 (service, then web `LeaveBalanceCard.test.tsx`). Pending days are returned separately from the balance:
    ```ts
    expect(b.pendingDays).toBe(3);
    ```
    ```tsx
    render(<LeaveBalanceCard balance={{ ...base, balanceDays: 7, pendingDays: 3 }} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3 days pending')).toBeInTheDocument();
    ```
  - |
    AC7 (service and web). No configured leave types:
    ```ts
    expect((await service.getForEmployee('emp-none')).balances).toEqual([]);
    ```
    ```tsx
    // fetch mocked to { asOf: '2026-11-18', balances: [] }
    expect(await screen.findByText('No leave types are set up for you yet.')).toBeInTheDocument();
    ```
  - |
    AC8 (service and web). No opening balance entered by HR:
    ```ts
    source.seed('emp-a', [row('Annual leave', { openingDays: null })]);
    expect((await service.getForEmployee('emp-a')).balances[0].balanceDays).toBeNull();
    ```
    ```tsx
    render(<LeaveBalanceCard balance={{ ...base, balanceDays: null }} />);
    expect(screen.getByText('Not set')).toBeInTheDocument();
    ```
  - |
    Web states (`LeaveBalancesPage.test.tsx`, `fetch` mocked). Loading and error with retry, written before the page exists:
    ```tsx
    expect(screen.getByRole('status', { name: 'Loading your leave balances' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    ```
  - |
    Navigation (`App.test.tsx`). With the hash `#/my-leave`, the page renders and My leave is current; run the existing dashboard tests unchanged to confirm no regression:
    ```tsx
    window.location.hash = '#/my-leave';
    expect(await screen.findByRole('heading', { name: 'My leave balances' })).toBeInTheDocument();
    ```
  - |
    Narrow commands: `(cd services/leave-api && pnpm vitest run src/leave-balances)` and `(cd apps/web && pnpm vitest run src/features/leave-balances src/App.test.tsx)`.
assumptions_or_open_questions:
  - |
    CONFLICT between AC5 and the prototype. AC5 says a balance of 10 with 3 pending days shows 7; the prototype shows 10 with the note "Pending days are not deducted from your balance until approved". This plan follows the acceptance criteria: the pending days are subtracted from the displayed balance and also shown separately (AC6). The prototype note must change, for example to "Pending days are already taken off your available balance." Please confirm, since the approved design disagrees.
  - |
    Negative balances. Requests that exceed the available balance are blocked at submission, but an HR override could still produce a negative balance (HR decision pending). The plan uses `Math.trunc`, so the display is always a whole number (AC2) and a shortfall is never overstated. Confirm that is acceptable for a negative.
  - |
    The earlier draft of this plan omitted AC8 ("Not set") and treated pending days as never subtracted; both are corrected here. It also said the app had a placeholder `App.tsx` and a bare `index.css`; the code actually has a banking-style `Dashboard` shell and the design-system imports already in `index.css`, so the plan was adapted.
  - |
    The UI guidelines specify a top bar with Overview, My leave, Team calendar, Approvals (hidden for non-managers) and Account, with no sidebar. The existing shell has a `SideNav` and banking destinations. This plan adds only a My leave entry and leaves the shell redesign to a separate story. Confirm.
  - |
    Until the HR Reporting & Administration and Leave Request stories land, balances come from `InMemoryLeaveBalancesSource`. It is empty by default, so a deployed app shows the empty state. The story is demonstrable but not useful in production until a real adapter exists, which is a larger piece of work than this story. Opening balances are entered by HR directly in the app (settled decision), and that write path is out of scope.
  - |
    Assumed contract: the authentication layer sets `request.principal.employeeId`. I found no auth code in `services/leave-api/src` (only `app.controller.ts`, `app.service.ts`, `app.module.ts` and `main.ts`), so until Sign-in & Access Control lands the endpoint returns 401 outside tests. The web client also has no session or token handling for the Leave API yet (only `session/customer.tsx`); the API base URL and credentials handling for `fetchMyLeaveBalances` need to follow the sign-in story.
  - |
    Project-wide open questions (backup and recovery, leave record retention, deleted organisation retention) do not affect this read-only story.
estimated_points: 5
package_dependencies: []
notes: |
  ### Data & rollout

  None — no schema, migration or stored data changes. This story reads through an in-memory source, so there are no existing rows to migrate or backfill. The only new setting is the optional `LEAVE_BALANCES_DEV_SEED`, default off (the API starts with an empty source). Document it in a new `services/leave-api/.env.example` entry, or in the leave-api README if no such file exists (check first). Nothing needs provisioning. Deploy the API first and then the Web App; roll back by redeploying the previous versions. The story that adds the real adapter owns its migration and rollout notes.

  Files read while planning: `apps/web/src/App.tsx`, `main.tsx`, `index.css`, `dashboard/Dashboard.tsx`, `dashboard/TopBar.tsx`, `dashboard/navigation.ts`, `services/leave-api/src/app.module.ts`, `design-system/prototype-utils.css` (class definitions), and the prototype HTML. Not read: `apps/web/vite.config.ts` (Tailwind is already imported in `index.css`, so I assume it is registered; the implementer should confirm). The design-system folder holds `tokens.css`, `prototype-utils.css`, `app-shell.html` and `style-guide.html`.

  ```mermaid
  flowchart TD
    Main[main.tsx] --> App[App.tsx]
    App --> Dash[Dashboard.tsx]
    App --> Page[LeaveBalancesPage.tsx]
    Dash --> Top[TopBar.tsx]
    Top --> Nav[navigation.ts]
    Page --> Client[api/leaveBalances.ts]
    Page --> Card[LeaveBalanceCard.tsx]
    Main --> Css[index.css]
    Client -->|GET /leave-balances/me| Ctrl[leave-balances.controller.ts]
    Ctrl --> Guard[authenticated.guard.ts]
    Ctrl --> Svc[leave-balances.service.ts]
    Svc --> Port[leave-balances.source.ts]
    Port --> Mock[in-memory-leave-balances.source.ts]
    Mod[app.module.ts] --> Ctrl
    classDef touched fill:#f96,color:#000
    class App,Top,Nav,Page,Client,Card,Ctrl,Guard,Svc,Port,Mock,Mod touched
  ```
review_focus: |
  IN scope: the read-only balances endpoint and screen for the signed-in employee (AC1 to AC8), a replaceable data-source port with an in-memory source, a caller-identity guard, and a My leave navigation entry. OUT of scope: any leave table or migration, HR entry of opening balances, requests and approval, Entra ID sign-in, the shell redesign, and the prototype's manager name, approved-days note and "My requests" button. Riskiest areas: the rule `openingDays === null ? null : Math.trunc(opening - approved - pending)` (AC5 deliberately subtracts pending days, which departs from the prototype's note), and keeping the employee id sourced only from the principal. The in-memory source is deliberate and temporary, and the card grid uses the existing `.grid` utility instead of the prototype's `14rem` literal.
