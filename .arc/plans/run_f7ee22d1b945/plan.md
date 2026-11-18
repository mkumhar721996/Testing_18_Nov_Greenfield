summary: |
  Add the Upcoming payments card to the dashboard. The Leave API (NestJS) gets a read-only `GET /dashboard/upcoming-payments` endpoint that returns the signed-in customer's card dues, loan instalments and scheduled bill payments due from today through day 30 inclusive (day 31 excluded), sorted by due date; the window is a server-side setting (default 30) with no UI control. The web app (React + Vite + Tailwind) gets an `UpcomingPaymentsCard` that fetches that endpoint and renders the approved design's rows (type badge, due date with "in N days", amount, Pay now), a "No upcoming payments" empty state, and a skeleton / "couldn't load + Try again" state. Pay now only navigates to the payment screen in Transfers & bill payments and never sends a write request. The repo today is bare scaffolding (health endpoint plus a "Web App" heading), so this also loads the design-system tokens into the web app once. Where the payment records come from does not exist yet; that is an open question, not invented data.
scope:
  - description: |
      Window and date rules as a pure, clock-injected function in the Leave API. Signature:

      ```ts
      export type PaymentType = 'card_due' | 'loan_instalment' | 'scheduled_bill';
      export interface DuePayment { id: string; type: PaymentType; name: string; dueDate: string /* YYYY-MM-DD */; amount: number /* whole INR */ }
      export interface UpcomingPayment extends DuePayment { daysUntilDue: number }
      export function selectUpcoming(all: DuePayment[], today: string, windowDays: number): UpcomingPayment[]
      ```

      Keeps a payment when `0 <= daysUntilDue <= windowDays` (day 30 in, day 31 out), computed on calendar dates (UTC date arithmetic on YYYY-MM-DD strings, no time-of-day), sorted by dueDate then id.
    files:
      - services/leave-api/src/upcoming-payments/select-upcoming.ts
      - services/leave-api/src/upcoming-payments/select-upcoming.spec.ts
    rationale: |
      The 30 / 31 boundary (AC 1, 2, 7) is the riskiest logic, so it is isolated and tested with a fixed "today" instead of the real clock.
  - description: |
      Service, controller and module wiring. `UpcomingPaymentsService.forCustomer(customerId, now = new Date())` reads `UPCOMING_PAYMENTS_WINDOW_DAYS` (default 30; invalid or non-positive falls back to 30), computes today in `UPCOMING_PAYMENTS_TIMEZONE` (default Asia/Kolkata), reads records through an injected `DuePaymentsRepository` port (`listDue(customerId): Promise<DuePayment[]>`), and returns `{ windowDays, payments }`. The controller exposes `@Get('dashboard/upcoming-payments')`, read-only, and takes the customer id from the authenticated caller (see open questions); there is no query or body parameter that changes the window (AC 8). Register in `AppModule`.
    files:
      - services/leave-api/src/upcoming-payments/upcoming-payments.service.ts
      - services/leave-api/src/upcoming-payments/upcoming-payments.service.spec.ts
      - services/leave-api/src/upcoming-payments/upcoming-payments.controller.ts
      - services/leave-api/src/upcoming-payments/due-payments.repository.ts
      - services/leave-api/src/upcoming-payments/upcoming-payments.module.ts
      - services/leave-api/src/app.module.ts
      - services/leave-api/e2e/upcoming-payments.e2e.ts
    rationale: |
      ADR-0001 keeps business rules (the window) in the API, not the web app; the repository port lets the rule be built and tested while the real data source is decided.
  - description: |
      Load the design-system tokens and component classes into the web app once, in its entry stylesheet. Add `@import '../../../design-system/tokens.css';` and `@import '../../../design-system/prototype-utils.css';` after `@import 'tailwindcss';` in `apps/web/src/index.css` (the entry stylesheet imported by `apps/web/src/main.tsx:4`). `prototype-utils.css` defines `.btn`, `.btn-secondary`, `.card`, `.badge`, `.empty-state`, `.skeleton`, `.text-muted` (checked in the file). Then add a small block for the classes the prototype defines only inline: `.card-head`, `.pay-list`, `.pay-row`, `.pay-info`, `.pay-name`, `.pay-side`, `.pay-amount`, `.pay-window`, `.pay-empty`, written on tokens exactly as in the prototype (lines 1023-1033). If Vite refuses the out-of-root import, add `server.fs.allow` in `apps/web/vite.config.ts`.
    files:
      - apps/web/src/index.css
    rationale: |
      The app does not load the tokens today (index.css holds only the Tailwind import; no match for design-system or tokens anywhere under apps/web). Every style below uses tokens only.
  - description: |
      Web data layer. `apps/web/src/upcoming-payments/api.ts`: `fetchUpcomingPayments(signal?): Promise<{ windowDays: number; payments: UpcomingPayment[] }>` doing a GET only. `format.ts`: `typeLabel(type)` maps `card_due` / `loan_instalment` / `scheduled_bill` to "Card due" / "Loan instalment" / "Scheduled bill"; `formatDue(dueDate, daysUntilDue)` returns "Due 24 Nov 2026, in 6 days" ("today" at 0, "in 1 day" at 1); `formatAmount(n)` returns "₹ 32,450.00" (en-IN, two decimals), as in the prototype. `payUrl(payment)` builds the Transfers & bill payments payment-screen URL carrying the payment id and type.
    files:
      - apps/web/src/upcoming-payments/api.ts
      - apps/web/src/upcoming-payments/format.ts
      - apps/web/src/upcoming-payments/format.test.ts
    rationale: |
      Keeps display rules testable apart from the component (AC 9).
  - description: |
      `UpcomingPaymentsCard` component matching the prototype's `upcoming-payments` card: `.card` with `.card-head` and an `h2` "Upcoming payments", a `.text-muted.pay-window` line "Due in the next 30 days" (text taken from the API `windowDays`, not hard-coded), then a `role="list"` of `.pay-row` items. Each row: `.pay-name` (e.g. "Home loan ••7714 EMI"), muted due line, `.badge` with the type label, `.pay-amount`, and a `.btn.btn-secondary` "Pay now" with `aria-label="Pay now, <name>"` and a control height of `--size-control-lg`. Pay now calls `onPayNow(payment)`, whose default is `window.location.assign(payUrl(payment))`; it makes no request. States: loading shows `.skeleton` rows; empty (no payments) shows `.empty-state` with `h3` "No upcoming payments" and muted "Nothing is due in the next 30 days."; error shows a short "couldn't load" message with a `.btn-secondary` "Try again" that refetches only this card (matches the settled epic decision). No window control is rendered. Mount the card in `App.tsx` inside a `.card`-based layout region (`size-content` max width, `space-4` between sections). Tokens used: `--color-border`, `--color-fg-muted`, `--space-1`, `--space-2`, `--space-3`, `--font-size-sm`, `--font-size-md`, `--font-weight-medium`, `--font-weight-bold`, `--size-control-lg`, `--border-width`, `--radius-lg`.
    files:
      - apps/web/src/upcoming-payments/UpcomingPaymentsCard.tsx
      - apps/web/src/upcoming-payments/UpcomingPaymentsCard.test.tsx
      - apps/web/src/App.tsx
      - apps/web/src/App.test.tsx
    rationale: |
      The existing App test asserts the "Web App" heading; keep it passing or update it deliberately when the card is mounted.
  - description: |
      Document the two new settings next to the API's existing config (or add `.env.example` entries if the API has no config doc yet).
    files:
      - services/leave-api/.env.example
    rationale: |
      Window length is a changeable default (item scope), so it must be configurable without a code change.
tests:
  - |
    AC 1 and 7 (services/leave-api/src/upcoming-payments/select-upcoming.spec.ts), written first and failing:
    ```ts
    const r = selectUpcoming([card('2026-11-24'), loan('2026-12-01'), bill('2026-12-05'), bill('2026-12-18')], '2026-11-18', 30);
    expect(r.map((p) => p.type)).toEqual(['card_due', 'loan_instalment', 'scheduled_bill', 'scheduled_bill']);
    expect(r[3].daysUntilDue).toBe(30); // exactly day 30 is listed
    ```
  - |
    AC 2 (same file): a bill due 31 days out is dropped, and so are already-overdue items (`daysUntilDue < 0`, see open questions):
    ```ts
    expect(selectUpcoming([bill('2026-12-19')], '2026-11-18', 30)).toEqual([]);
    ```
  - |
    AC 6, API side (upcoming-payments.service.spec.ts): the repository returns nothing in the window and the service returns `{ windowDays: 30, payments: [] }`. Also: window default is 30 when the env var is unset or invalid, and `UPCOMING_PAYMENTS_WINDOW_DAYS=14` drops a day-20 payment.
    ```ts
    expect(await service.forCustomer('c1', new Date('2026-11-18T05:00:00Z'))).toEqual({ windowDays: 30, payments: [] });
    ```
  - |
    AC 8, API side (services/leave-api/e2e/upcoming-payments.e2e.ts, Playwright API test): a `?windowDays=90` query is ignored.
    ```ts
    const res = await request.get('/dashboard/upcoming-payments?windowDays=90');
    expect((await res.json()).windowDays).toBe(30);
    ```
  - |
    AC 9 and display (apps/web/src/upcoming-payments/format.test.ts and UpcomingPaymentsCard.test.tsx): the row shows type, amount and due date.
    ```ts
    expect(formatAmount(32450)).toBe('₹ 32,450.00');
    expect(formatDue('2026-12-01', 13)).toBe('Due 1 Dec 2026, in 13 days');
    expect(await screen.findByText('Loan instalment')).toBeInTheDocument();
    ```
  - |
    AC 1 and 3 (UpcomingPaymentsCard.test.tsx, fetch mocked with three payments): all three rows render, each with its own Pay now.
    ```ts
    expect(await screen.findAllByRole('listitem')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /^Pay now/ })).toHaveLength(3);
    ```
  - |
    AC 4 and 5 (same file): pressing Pay now calls `onPayNow` with that payment, and the only network call is the initial GET, so nothing is paid from the dashboard.
    ```ts
    await user.click(screen.getByRole('button', { name: 'Pay now, Home loan ••7714 EMI' }));
    expect(onPayNow).toHaveBeenCalledWith(expect.objectContaining({ id: 'loan' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.every(([, init]) => !init || init.method === undefined || init.method === 'GET')).toBe(true);
    ```
  - |
    AC 6, web side (same file): empty response shows the message.
    ```ts
    expect(await screen.findByRole('heading', { name: 'No upcoming payments' })).toBeInTheDocument();
    ```
  - |
    AC 8, web side (same file): no control changes the window.
    ```ts
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    ```
  - |
    Loading and error states (same file): a pending fetch shows skeleton placeholders; a rejected fetch shows "Try again", and clicking it refetches once and then renders the rows.
  - |
    Narrow commands for the red-green loop, derived from the project test command:
    `cd services/leave-api && pnpm test -- src/upcoming-payments` and `cd apps/web && pnpm test -- src/upcoming-payments`; run the full configured command once at the end. The Playwright API test runs through the API's existing e2e script.
assumptions_or_open_questions:
  - |
    BLOCKING: there is no source for card dues, loan instalments or scheduled bill payments in this repo. The Leave API has no database module, schema, migrations, ORM or entities (it has only `health`), and the account, card, loan and bill data that STORY-025 and its siblings would create are not present. This plan builds the rule, endpoint and UI against a `DuePaymentsRepository` port but does not invent data. Decision needed: which story or epic owns the tables or upstream source, and does this story get a Postgres-backed repository once they exist? If it must create them here, it is larger than 5 points and should be split.
  - |
    Authentication and customer identity: ADR-0005 (Entra ID SSO) and ADR-0010 (role check on every endpoint) apply, but no auth guard or user context exists in the API. The plan assumes a guard supplied by another story that sets the customer id on the request; the controller must not accept a customer id from the client.
  - |
    The architecture docs and UI guidelines describe a "Leave Manager" product (leave API, top bar with no sidebar) while this item and its approved prototype are a banking dashboard (sidebar, ₹). The plan follows the item and prototype, and uses the confirmed stack and ADRs only for technology and layering. Please confirm this mismatch is expected.
  - |
    The dashboard frame itself (top bar, sidebar, greeting, other cards, loading / error / no-accounts states) is STORY-025 and is not in this codebase. This plan delivers the Upcoming payments card and mounts it in `App.tsx` without building the rest of the frame; the sibling stories own that.
  - |
    Pay now destination: Transfers & bill payments has no route in the app (no router is installed). The plan uses a `payUrl(payment)` helper with a placeholder path and a swappable `onPayNow`. The real payment-screen route and its parameters belong to that epic and must be confirmed.
  - |
    Overdue items (due before today) are not in any AC. The prototype filters them out (`days >= 0`), and the plan follows it. Please confirm that overdue dues should not appear on this card.
  - |
    "Today" is evaluated server-side on the calendar date in Asia/Kolkata (the repo is deployed to ap-south-1 and amounts are in rupees), set by `UPCOMING_PAYMENTS_TIMEZONE`. Confirm the customer-facing time zone.
  - |
    Date format: the prototype shows "Due 24 Nov 2026, in 6 days", while the UI guidelines prefer "Mon 3 Mar" style. The plan follows the approved prototype. The prototype's amount format is "₹ 945.00" (with a space); the plan reproduces it.
  - |
    The prototype's own screen note says Pay now is an exit that only toasts. The toast is a prototype shortcut and is not built; the real control navigates (AC 4).
  - |
    Open deferred questions (target load time and concurrency, supported devices and balance freshness, audit logging for account data access) are not answered by the item and are not planned here. The card uses a single GET with no polling or caching; the layout is responsive as in the prototype (single column on narrow screens via `flex-wrap`).
  - |
    A Playwright browser e2e for the web app (Pay now opening the payment screen) is not planned because the destination screen does not exist yet; AC 4 is covered at component level.
estimated_points: 5
package_dependencies: []
notes: |
  ### Data & rollout

  - **Existing data**: no migration in this plan. It adds no table or column and reads through a repository port; the future concrete repository must be read-only on existing rows.
  - **Backfill / seed**: none. No fixture or seed is shipped, deliberately, so no screen ships on invented data.
  - **Settings**: `UPCOMING_PAYMENTS_WINDOW_DAYS` (default 30; invalid, zero or negative falls back to 30) and `UPCOMING_PAYMENTS_TIMEZONE` (default Asia/Kolkata). Both are safe when unset and are documented in `services/leave-api/.env.example`.
  - **Provisioning**: the real payment-record source (see the blocking open question) must exist before the endpoint returns data; until then the endpoint has nothing to read.
  - **Order and rollback**: deploy the API first, then the web app (the card calls the new endpoint). Rollback is removing the card and endpoint; nothing stored changes.

  ### Design and token loading

  The approved prototype is `TESTING-18-NOV-STORY-028-design.html`. I read its Upcoming payments card (lines 1138-1159), its inline styles (1023-1033) and render script (1246-1286). It defines three rows (card due ₹ 945.00, loan instalment ₹ 32,450.00, scheduled bill ₹ 1,179.00), the day-30 / day-31 sample, the "No upcoming payments" empty state, and a "Pay now" button with `aria-label="Pay now, <name>"`. The tokens come from `design-system/tokens.css`; `apps/web/src/index.css` imports only Tailwind today, so the plan adds the import once. `prototype-utils.css` also sets global `body` and `*` rules, so check that it does not fight Tailwind's preflight. The prototype's "Prototype aid" select and toasts are not built.

  ```mermaid
  flowchart TD
    main["apps/web/src/main.tsx"] --> css["apps/web/src/index.css (load tokens)"]
    main --> app["apps/web/src/App.tsx (mount card)"]
    app --> card["UpcomingPaymentsCard.tsx (new)"]
    card --> api["upcoming-payments/api.ts (new)"]
    card --> fmt["upcoming-payments/format.ts (new)"]
    api -->|GET /dashboard/upcoming-payments| ctl["upcoming-payments.controller.ts (new)"]
    ctl --> svc["upcoming-payments.service.ts (new)"]
    svc --> sel["select-upcoming.ts (new, 30-day rule)"]
    svc --> repo["due-payments.repository.ts (new port)"]
    mod["app.module.ts (register module)"] --> ctl
    css -.-> ds["design-system/tokens.css, prototype-utils.css"]
    classDef touched fill:#f96,color:#000
    class css,app,card,api,fmt,ctl,svc,sel,repo,mod touched
  ```
review_focus: |
  IN: the GET endpoint with the inclusive 30-day rule, its env-configurable window, the web card (rows, empty, loading, error with Try again), Pay now as navigation only, and one-time token loading. OUT: the dashboard frame, auth, the payment screen itself, and any database schema or seed; the payment data source is an unresolved blocking question, so check that no sample data is shipped. Riskiest area is the day 30 / day 31 boundary and time-zone handling in `select-upcoming.ts`; also confirm no non-GET request is made from the card (AC 5). Deliberate: overdue items are excluded and the prototype's date and amount formats are followed over the generic UI guideline.
