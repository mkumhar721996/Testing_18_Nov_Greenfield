summary: |
  Build the dashboard's account-cards row from the approved prototype: one card per linked account (savings, current, credit card) showing its full balance (the credit card shows the outstanding amount owed), a per-card "Couldn't load" placeholder with a Try again button that reloads only that card, and a no-accounts empty state with a Link an account button that appears only when the customer truly has no linked accounts. Per ADR-0001 the Web App talks only to the Leave API, so the plan adds two read endpoints to `services/leave-api` (list of linked accounts; one account with its balance) behind an `AccountsSource` port, and a React feature folder `apps/web/src/accounts/`. Each card loads its own balance, so one failing account never hides or disturbs the others, and a total failure shows placeholders, never the no-accounts message. The app does not yet load the design-system tokens, so the plan also wires them in once.

scope:
  - description: |
      Load the design-system tokens and component stylesheet once in the app's entry stylesheet. Today `apps/web/src/index.css` contains only `@import 'tailwindcss';` (line 1) and `main.tsx` imports it, so no token (`--space-3`, `--color-danger-subtle` ...) and no `.card`/`.btn`/`.empty-state`/`.skeleton`/`.spinner`/`.alert` class exists in the app. Add after the tailwind import:

      ```css
      @import '../../../design-system/tokens.css';
      @import '../../../design-system/prototype-utils.css';
      ```

      Check `pnpm build` and the vitest run still resolve the relative path. If dev-server file access complains, add `server.fs.allow` for the repo root in `apps/web/vite.config.ts` (currently plugins react + tailwindcss and a jsdom test block, no `server` key).
    files:
      - apps/web/src/index.css
      - apps/web/vite.config.ts
    rationale: |
      Every UI step must style with tokens by name. `design-system/prototype-utils.css` defines `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.alert`, `.alert-danger`, `.empty-state`, `.skeleton`, `.spinner` (confirmed by grep), so they are imported rather than redefined.

  - description: |
      Leave API, read side. Add an `accounts` Nest module with two endpoints and an `AccountsSource` port so the data origin is swappable:

      ```ts
      // services/leave-api/src/accounts/accounts.types.ts
      export type AccountType = 'savings' | 'current' | 'credit_card';
      export interface LinkedAccount { id: string; type: AccountType; displayName: string } // "Savings account ••4821"
      export interface AccountBalance extends LinkedAccount {
        currency: string;            // ISO 4217, "INR"
        balanceMinor: number;        // savings/current: balance; credit_card: outstanding amount owed (>= 0)
        creditLimitMinor?: number;   // credit_card only
      }
      export interface AccountsSource {
        list(customerId: string): Promise<LinkedAccount[]>;
        balance(customerId: string, accountId: string): Promise<AccountBalance | null>;
      }
      ```

      `AccountsController`: `list(customerId)` backs `GET /accounts` and returns `LinkedAccount[]` (empty array, 200, when none linked); `get(customerId, id)` backs `GET /accounts/:id` and returns `AccountBalance`, throws `NotFoundException` for an id that is not the caller's and `BadGatewayException` (502) when the source fails for that account. Money is integer minor units plus currency code; the web formats it. No balance or account number is ever logged (ADR-0011). Register `AccountsModule` in `AppModule` (currently `controllers: [AppController]`, `providers: [AppService]`).
    files:
      - services/leave-api/src/accounts/accounts.types.ts
      - services/leave-api/src/accounts/accounts.service.ts
      - services/leave-api/src/accounts/accounts.controller.ts
      - services/leave-api/src/accounts/accounts.module.ts
      - services/leave-api/src/accounts/accounts.controller.spec.ts
      - services/leave-api/src/app.module.ts
    rationale: |
      ADR-0001 forbids the web app from reaching any other system; the API owns the rules. Splitting list from per-account balance lets one account fail (AC6, 7, 9) and be retried alone (AC8) while an empty list stays distinguishable from a failed load (AC3, 10). Follows the existing pattern in `app.controller.ts` / `app.module.ts` (plain Nest controller + provider, unit-tested by direct construction as in `app.controller.spec.ts`).

  - description: |
      Web: typed API client and money formatting.

      ```ts
      // apps/web/src/accounts/api.ts
      export async function fetchAccounts(signal?: AbortSignal): Promise<LinkedAccount[]>   // throws on non-2xx
      export async function fetchAccountBalance(id: string, signal?: AbortSignal): Promise<AccountBalance> // throws on non-2xx
      // apps/web/src/accounts/format.ts
      export function formatMoney(minor: number, currency: string): string // Intl.NumberFormat('en-IN', {style:'currency', currency}) on minor/100
      ```

      The API base URL comes from `import.meta.env.VITE_API_URL`, defaulting to same-origin.
    files:
      - apps/web/src/accounts/types.ts
      - apps/web/src/accounts/api.ts
      - apps/web/src/accounts/format.ts
      - apps/web/src/accounts/format.test.ts
    rationale: |
      Keeps fetch and formatting out of components so component tests stub one boundary (`fetch`). The prototype shows amounts as "₹ 1,84,250.00" (Indian grouping, 2 decimals), which `en-IN` + INR reproduces.

  - description: |
      Web: the account-cards row, built to the approved prototype's default, empty, loading and error states (prototype elements: `#acct-grid` `.cards-3[data-wf-id=account-cards][aria-live=polite]`, `cardHtml`, `failHtml`, `.empty-state[data-wf-id=no-accounts]`, loading `[data-wf-id=loading]`, error banner `[data-wf-id=error-banner]`).

      - `AccountCards({onLinkAccount})`: the `.cards-3` grid (`aria-live="polite"`); calls `fetchAccounts`. While pending it renders a `role="status"` region with muted "Loading your accounts…" and three `.card.sk-stack` skeletons (three `.skeleton` bars each). On `[]` it renders `NoAccounts`; with accounts, one `AccountCardSlot` per account in API order. If `fetchAccounts` itself rejects it renders `.alert.alert-danger` (`role="alert"`, "We could not load your accounts. Please try again.") plus a `.btn.btn-secondary` "Try again" that refetches the list; it never renders `NoAccounts`.
      - `AccountCardSlot({account})`: owns its own state (`loading | loaded | failed`) and its own `fetchAccountBalance` call, so a retry re-renders only this slot. While loading it shows a single card skeleton. Loaded renders `AccountCard`; failed renders `AccountCardFailed`. Slots are keyed by account id so siblings keep their DOM nodes.
      - `AccountCard`: `.card.acct-card` with display name (`.muted`), amount (`.amount`) and a muted caption: "Balance" for savings/current, "Outstanding balance" for credit card. The credit card also shows a muted "Limit ₹ 1,00,000.00" line (`.acct-limit`) and a `.meter` (`role="img"`, `aria-label="19 percent of limit used"`, fill width from balance/limit). When `creditLimitMinor` is absent the limit line and meter are omitted. Cards are not links.
      - `AccountCardFailed({account, onRetry, retrying})`: `.card.acct-fail`; bold "Couldn't load" with the alert icon, the account display name, muted "We couldn't load this account. Your other accounts are not affected.", and `.btn.btn-secondary` "Try again". While retrying the button is `disabled` with a `.spinner` and "Trying again…".
      - `NoAccounts({onLinkAccount})`: `.empty-state` with `<h2>No accounts linked yet</h2>`, "Link an account to see balances and recent transactions here." and one `.btn.btn-primary` "Link an account". The linking journey belongs to another epic, so `App` passes a documented no-op as the integration point; no navigation is invented.

      `accounts.css` (imported by `AccountCards.tsx`) defines only what the design system does not, copied from the prototype's inline style onto tokens: `.cards-3` (grid, `gap: var(--space-3)`, `repeat(auto-fit, minmax(min(100%, var(--size-menu)), 1fr))`), `.sk-stack` (flex column, `gap: var(--space-2)`), `.acct-card` (`overflow-wrap: anywhere`), `.amount` (`font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: var(--space-1) 0`), `.muted` (`color: var(--color-fg-muted); font-size: var(--font-size-sm)`), `.meter` (`height: var(--space-2); border-radius: var(--radius-full); background: var(--color-skeleton); overflow: hidden; margin-top: var(--space-2)`, fill `var(--color-primary)`), `.acct-fail` (flex column, `gap: var(--space-2)`, `border-color: var(--color-danger)`, `background: var(--color-danger-subtle)`, `color: var(--color-danger-subtle-fg)`), `.acct-fail .muted` (colour `--color-danger-subtle-fg`), `.acct-fail .btn { min-height: var(--size-control-lg) }`. No colour or pixel literals; the meter fill width is a runtime percentage set as an inline style. Single column on phones follows from `min(100%, ...)`. The prototype's alert glyph is rendered as a small inline SVG using `currentColor`.

      Mount: `apps/web/src/App.tsx` renders `<AccountCards onLinkAccount={...} />` and keeps the existing `<h1>Web App</h1>` so the current App test still holds (with `fetch` stubbed in that test). The shell, greeting, quick actions and other prototype sections belong to sibling stories and are NOT built here.
    files:
      - apps/web/src/accounts/AccountCards.tsx
      - apps/web/src/accounts/AccountCardSlot.tsx
      - apps/web/src/accounts/AccountCard.tsx
      - apps/web/src/accounts/AccountCardFailed.tsx
      - apps/web/src/accounts/NoAccounts.tsx
      - apps/web/src/accounts/accounts.css
      - apps/web/src/App.tsx
      - apps/web/src/App.test.tsx
    rationale: |
      Mirrors the prototype's `cardHtml` / `failHtml` / `render` split. Per-slot state is the mechanism for AC8 (Try again leaves siblings untouched) and AC6/7/9; keeping "list failed" separate from "list empty" is the mechanism for AC10. Copy follows the UI guidelines' voice (plain, verb + object buttons, errors name the fix, one primary button per view, spinner for buttons, skeleton for loading, empty-state with one action).

tests:
  - |
    AC1 (web, `apps/web/src/accounts/AccountCards.test.tsx`): stub `fetch` so `/accounts` returns savings, current and credit_card and each `/accounts/:id` returns a balance. Write first; it fails because the component is missing.

    ```ts
    render(<AccountCards onLinkAccount={() => {}} />)
    expect(await screen.findByText('Savings account ••4821')).toBeInTheDocument()
    expect(screen.getByText('Current account ••0937')).toBeInTheDocument()
    expect(screen.getByText('Credit card ••5510')).toBeInTheDocument()
    expect(document.querySelectorAll('.acct-card')).toHaveLength(3)
    ```
  - |
    AC2 (web): savings 18425000 minor INR and current 6231045 minor INR.

    ```ts
    expect(await screen.findByText(formatMoney(18425000, 'INR'))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(6231045, 'INR'))).toBeInTheDocument()
    ```

    `format.test.ts` pins the helper: `expect(formatMoney(18425000, 'INR')).toBe('₹1,84,250.00')`. Some ICU builds put a non-breaking space after the symbol, so the implementer pins the exact string Node's ICU produces and asserts Indian digit grouping (`1,84,250`).
  - |
    AC3 (web): `/accounts` returns `[]`.

    ```ts
    expect(await screen.findByText('No accounts linked yet')).toBeInTheDocument()
    expect(screen.getByText(/Link an account to see balances/)).toBeInTheDocument()
    ```
  - |
    AC4 (web): same stub as AC3, and the click hands over to the prop.

    ```ts
    const onLink = vi.fn()
    render(<AccountCards onLinkAccount={onLink} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Link an account' }))
    expect(onLink).toHaveBeenCalledTimes(1)
    ```
  - |
    AC5 (web): one linked account that loads.

    ```ts
    await screen.findByText('Savings account ••4821')
    expect(screen.queryByText('No accounts linked yet')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Link an account' })).not.toBeInTheDocument()
    ```
  - |
    AC6 (web): `/accounts/current-id` responds 502, the other two succeed.

    ```ts
    expect(await screen.findByText('Savings account ••4821')).toBeInTheDocument()
    expect(screen.getByText('Credit card ••5510')).toBeInTheDocument()
    ```
  - |
    AC7 (web): same stub as AC6.

    ```ts
    const failed = await screen.findByText("Couldn't load")
    const slot = failed.closest('.acct-fail') as HTMLElement
    expect(within(slot).getByText('Current account ••0937')).toBeInTheDocument()
    expect(within(slot).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(document.querySelectorAll('.acct-card')).toHaveLength(2)
    ```
  - |
    AC8 (web): AC6 stub, then the current account's next response succeeds. Capture the two loaded card nodes first so "unchanged" is a node-identity and no-refetch check.

    ```ts
    const savings = (await screen.findByText('Savings account ••4821')).closest('.acct-card')
    const credit = screen.getByText('Credit card ••5510').closest('.acct-card')
    const callsBeforeRetry = fetchMock.mock.calls.length
    fireEvent.click(within(failedSlot).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Current account ••0937')).toBeInTheDocument()
    expect(screen.getByText('Savings account ••4821').closest('.acct-card')).toBe(savings)
    expect(screen.getByText('Credit card ••5510').closest('.acct-card')).toBe(credit)
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeRetry + 1) // only /accounts/current-id refetched
    ```
  - |
    AC9 (web): `/accounts/savings-id` and `/accounts/current-id` both respond 502 (the savings and current accounts both fail).

    ```ts
    await screen.findAllByText("Couldn't load")
    expect(screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(2)
    expect(document.querySelectorAll('.acct-fail')).toHaveLength(2)
    ```
  - |
    AC10 (web): two variants, every `/accounts/:id` returns 502, and `/accounts` itself returns 500. Both:

    ```ts
    await screen.findAllByRole('button', { name: 'Try again' })
    expect(screen.queryByText('No accounts linked yet')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Link an account' })).not.toBeInTheDocument()
    ```

    The list-failure variant also asserts `expect(screen.getByRole('alert')).toHaveTextContent('We could not load your accounts. Please try again.')` and that clicking its Try again refetches `/accounts`.
  - |
    Credit card outstanding balance (story scope, no numbered AC after the AC renumbering): credit_card balanceMinor 1890500, creditLimitMinor 10000000.

    ```ts
    const card = (await screen.findByText('Credit card ••5510')).closest('.acct-card') as HTMLElement
    expect(within(card).getByText(formatMoney(1890500, 'INR'))).toBeInTheDocument()
    expect(within(card).getByText('Outstanding balance')).toBeInTheDocument()
    expect(within(card).getByRole('img', { name: '19 percent of limit used' })).toBeInTheDocument()
    ```
  - |
    API support tests (`services/leave-api/src/accounts/accounts.controller.spec.ts`, written before the controller, with an in-memory `AccountsSource` double):

    ```ts
    expect(await controller.list('cust-2')).toEqual([])                              // none linked
    expect(await controller.get('cust-1', 'cc-1')).toEqual(
      expect.objectContaining({ type: 'credit_card', balanceMinor: 1890500 }))
    await expect(controller.get('cust-1', 'other-customers-id')).rejects.toBeInstanceOf(NotFoundException)
    await expect(controller.get('cust-1', 'failing-id')).rejects.toBeInstanceOf(BadGatewayException)
    expect(await controller.list('cust-1')).toHaveLength(3)                          // list unaffected by the failing balance
    ```
  - |
    Narrow commands per task (project command with its runner kept, path narrowed): `(cd services/leave-api && pnpm test -- src/accounts/accounts.controller.spec.ts)` and `(cd apps/web && pnpm test -- src/accounts)`; the full project command runs once at the end.

assumptions_or_open_questions:
  - |
    BLOCKING for production data: no account store or core-banking integration exists. I listed `services/leave-api/src` and found only `app.controller.ts`, `app.service.ts`, `app.module.ts` and `main.ts` (plus the controller spec): a health-style endpoint, no database module, no entities and no auth guard. The plan builds the endpoints against an `AccountsSource` port and tests them with an in-memory double, but does NOT ship invented accounts as the real source. A human must decide where linked accounts and balances come from (a PostgreSQL schema owned by the Leave API per ADR-0004, or an upstream system, which ADR-0009 says does not exist). A new schema plus migration is bigger than this story and should be split out.
  - |
    Domain mismatch to confirm: the architecture documents, UI guidelines and API name describe "Leave Manager" (leave requests, Entra ID SSO, managers), while this story and the approved prototype are a retail-banking dashboard (accounts, ₹ balances, Link an account). The plan follows the story and prototype. ADR-0010 (role check on every endpoint) and ADR-0005 (Entra ID sign-in) have no auth implementation in the repo yet, so the endpoints take `customerId` from an authenticated principal that does not exist yet; how the caller is identified is unresolved.
  - |
    Deferred question "how should the live balance be refreshed while the customer stays on the dashboard": not answered by the story or code. Assumption: balances load once when the dashboard loads and again only through that card's Try again. No polling or push, so freshness (open project-wide question) is "as of page load".
  - |
    Settled project decision applied: if only some accounts fail, the dashboard shows the cards that loaded plus a Couldn't-load placeholder with Try again where each missing card would be, and Try again reloads only that card (AC6-9).
  - |
    Prototype vs. acceptance criteria: the prototype's error state shows an error banner, three named placeholders from a fixed list, and a "Balances are temporarily unavailable" block with a Try again. In production, if the account LIST request fails the accounts are unknown, so the plan shows the banner plus a single Try again that reloads the list instead of three named placeholders. AC9/10 are satisfied by the per-account path (list ok, balances fail). Confirm this is acceptable.
  - |
    The acceptance criteria no longer include a separate credit-card outstanding-balance criterion. The item's scope text still says "full balances" for all three account types and the prototype labels the credit card amount "Outstanding balance", so the plan keeps that behaviour with a test that has no AC number. Say so if it should be dropped.
  - |
    The prototype's top bar, sidebar, greeting, quick actions, other dashboard sections, `data-soon` toasts, the retry-success toast and the "Prototype aid" Sample accounts select are prototype shortcuts or sibling-story work and are not built here.
  - |
    Credit card limit line and usage meter come from the prototype. If the source gives no limit, the card omits the limit line and meter.
  - |
    Unanswered project-wide non-functional questions (target load time and concurrent users, supported devices and screen sizes, audit logging and monitoring of customer access to account data) are not designed for here. Only the no-logging-of-balances constraint (ADR-0011) is applied; an audit-log requirement could add work to the API endpoints.
  - |
    "Link an account" has no destination in this story (linking belongs to another epic). The button calls an `onLinkAccount` prop that `App` leaves as a documented no-op until that epic lands.
  - |
    `@testing-library/user-event` is not a dependency; tests use `fireEvent` from the existing `@testing-library/react`. No new packages are needed.

estimated_points: 5

package_dependencies: []

notes: |
  ### Data & rollout
  None — read-only endpoints and UI, with no migration, stored-data change, seed, required new env var (the optional `VITE_API_URL` defaults to same-origin) or provisioning. If the open question on the account data source is resolved with a new PostgreSQL schema, that change needs its own Data & rollout review (existing rows, migration order, rollback) before implementation.

  ### Design tokens
  The app does not load tokens today: `apps/web/src/index.css:1` is only `@import 'tailwindcss';` and `apps/web/src/main.tsx` imports that file. Tokens live in `design-system/tokens.css` and component classes in `design-system/prototype-utils.css`; the first scope item imports both there. Classes defined by the design system and used as-is: `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.alert`, `.alert-danger`, `.empty-state`, `.skeleton`, `.spinner`. Classes defined only in the prototype's own inline style and therefore redefined on tokens in `accounts.css`: `.cards-3`, `.sk-stack`, `.acct-card`, `.acct-fail`, `.amount`, `.muted`, `.meter`. Styling is plain CSS on tokens (Tailwind stays installed per the stack but is not needed for these components).

  ### Shape
  ```mermaid
  flowchart TD
    Index[apps/web/src/index.css]:::touched -->|imports tokens + utils| DS[design-system/*.css]
    Main[apps/web/src/main.tsx] --> App[apps/web/src/App.tsx]:::touched
    App -->|mounts| Cards[accounts/AccountCards.tsx]:::touched
    Cards --> Slot[accounts/AccountCardSlot.tsx]:::touched
    Cards --> Empty[accounts/NoAccounts.tsx]:::touched
    Slot --> Api[accounts/api.ts]:::touched
    Cards --> Api
    Api -->|GET /accounts, GET /accounts/:id| Ctl[leave-api accounts.controller.ts]:::touched
    Ctl --> Svc[accounts.service.ts]:::touched
    Svc --> Src[AccountsSource port - source TBD]:::touched
    AppModule[leave-api app.module.ts]:::touched -->|registers| Mod[accounts.module.ts]:::touched
    classDef touched fill:#fde68a,color:#111827
  ```
  Per-slot loading (not one combined request) is the deliberate design: it is what makes partial failure and single-card retry possible.

review_focus: |
  IN scope: account cards for savings/current/credit card with full balances, per-card couldn't-load placeholder with Try again, the no-accounts state with Link an account, the two Leave API read endpoints behind them, and loading the design tokens once. OUT: shell/nav/greeting/quick actions and every other dashboard section, the linking and account-details journeys, live refresh/polling, and any real account data source (unresolved, see first open question). Riskiest area is distinguishing "no accounts" from "failed to load" (AC10) and keeping retry local to one slot (AC8); one balance request per account rather than one combined request is deliberate. The Leave Manager vs. banking domain mismatch is flagged, not resolved.
