summary: |
  Give every whole dashboard section except the account cards its own loading, error and "Try again" behaviour, so one slow or failing section never blocks or hides the others. The work is a small, reusable pair in the web app: a `useSectionLoader` hook (one independent load lifecycle per section, with `retry`) and a `SectionCard` component that renders the approved design's three views of a section card (loading skeleton, in-place error with Try again, loaded content). The section stories that follow (027 transactions, 028 upcoming payments, 029 card and loan summaries, 030 offers, 031 other services) will pass their own loader and loaded content into `SectionCard`. Account cards are explicitly out of scope (their per-card placeholder belongs to STORY-026).
scope:
  - description: |
      Add the hook that owns one section's load lifecycle. Signature:

      ```ts
      export type SectionState<T> =
        | { status: 'loading'; retrying: false }
        | { status: 'error'; retrying: boolean }
        | { status: 'loaded'; data: T }

      export function useSectionLoader<T>(load: () => Promise<T>): {
        state: SectionState<T>
        retry: () => void
      }
      ```

      Behaviour: starts in `loading`, calls `load()` once on mount, moves to `loaded` or `error`. `retry()` keeps the card in `error` with `retrying: true` (the design keeps the error card and puts a spinner in the button) and re-runs only this hook's `load`. A result from a superseded or unmounted call is ignored (request counter in a ref), so a late response cannot overwrite a newer one. Each section uses its own hook instance, which is what makes the sections independent (AC 2, 4, 7); nothing is shared or lifted into `Dashboard`.
    files:
      - apps/web/src/dashboard/sections/useSectionLoader.ts
      - apps/web/src/dashboard/sections/useSectionLoader.test.tsx
    rationale: |
      Independence is a property of the state ownership: one hook per section means a pending, failed or retried section cannot change another section's state. Hook-level tests pin that down before any UI exists.
  - description: |
      Add `SectionCard`, the shared presentation of the design's section card. Props:

      ```ts
      type SectionCardProps<T> = {
        title: string            // "Recent transactions"
        label: string            // lower-case noun used in messages, "recent transactions"
        plural?: boolean         // "are" vs "is" in the unavailable line
        load: () => Promise<T>
        children: (data: T) => React.ReactNode   // loaded content (body only; header link such as "View all" is passed via `action`)
        action?: React.ReactNode // optional card-head control, e.g. "View all"; shown only when loaded
      }
      ```

      Markup copied from the approved prototype (states `loading` and `error` in the design file):
      - Always `<div className="card section-status">` with `<div className="card-head"><h2>{title}</h2>{action}</div>`; `aria-busy="true"` while loading.
      - Loading (AC 1): `<div role="status" aria-live="polite" className="sk-stack">` holding `<p className="muted section-note">Loading {label}…</p>` and three or four `<span className="skeleton" style={{ width }}/>` bars of differing widths (the prototype uses 70%, 45%, 80%, 50%).
      - Error (AC 3, 5): `<div className="alert alert-danger" role="alert">` with the `alert` icon and "We couldn't load your {label}. Your other sections are not affected.", then `<div className="empty-state"><p>{Title} {are|is} temporarily unavailable.</p><button className="btn btn-secondary" type="button">Try again</button></div>`.
      - Retrying (AC 6): the button is `disabled`, `aria-busy="true"` and reads `<span className="spinner" aria-hidden="true"/>Trying again…` (design: spinner is for buttons, skeleton for pages).
      - Loaded: render `children(data)` and drop the `section-status` modifier, as the prototype does.

      The `alert` icon: `apps/web/src/dashboard/Icon.tsx` has no `alert` entry in its `PATHS` map (it has bag, menu, home, user, arrow-right, bell, calendar, chevron-down), so add `alert: [...]` there, copying the path data from the prototype's `<symbol id="i-alert">` (design file line 1048) and rendering it via `<Icon name="alert" />`.
    files:
      - apps/web/src/dashboard/sections/SectionCard.tsx
      - apps/web/src/dashboard/sections/SectionCard.test.tsx
      - apps/web/src/dashboard/Icon.tsx
    rationale: |
      One component means all five later sections get identical loading and error behaviour and wording, which is what the story's "shared by every whole section" scope asks for.
  - description: |
      Add the prototype's NEW section-status styles, plus the few prototype helper classes the app's `dashboard.css` does not yet define, to `apps/web/src/dashboard/dashboard.css`, using tokens only:

      ```css
      .section-status { display: flex; flex-direction: column; gap: var(--space-2); }
      .section-status .empty-state { padding: var(--space-3) 0 0; }
      .section-status .btn { align-self: flex-start; min-height: var(--size-control-lg); gap: var(--space-2); }
      .section-note { margin: 0 0 var(--space-3); }
      .sk-stack { display: flex; flex-direction: column; gap: var(--space-2); }
      .alert { margin-bottom: var(--space-3); align-items: flex-start; }
      .card-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-2); }
      .card h2, .card h3 { margin: 0; font-size: var(--font-size-md); }
      .muted { color: var(--color-fg-muted); font-size: var(--font-size-sm); }
      ```

      Before adding each of `.card-head`, `.muted`, `.card h2` re-read `dashboard.css` and the other section stories' merged CSS, and skip any a merged story already added (this branch's `dashboard.css` currently has none of them). Tokens used: `--space-2`, `--space-3`, `--size-control-lg`, `--color-fg-muted`, `--font-size-sm`, `--font-size-md`. No colour or pixel literals.
    files:
      - apps/web/src/dashboard/dashboard.css
    rationale: |
      `.card`, `.btn`, `.btn-secondary`, `.alert`, `.alert-danger`, `.empty-state`, `.skeleton` and `.spinner` are already defined in `design-system/prototype-utils.css` (lines 44-66, 143, 202-217), which `apps/web/src/index.css` imports on line 3 after `tokens.css` on line 2, so they need no new import. The section-status classes exist only in the prototype's own inline style, so they are defined in the app on the same tokens.
tests:
  - |
    AC 1 (failing first) — `SectionCard.test.tsx`: a pending loader shows the indicator and no content.
    ```tsx
    const never = () => new Promise<string>(() => {})
    render(<SectionCard title="Upcoming payments" label="upcoming payments" load={never}>{(d) => <p>{d}</p>}</SectionCard>)
    expect(screen.getByRole('status')).toHaveTextContent('Loading upcoming payments…')
    expect(screen.getByRole('heading', { name: 'Upcoming payments' })).toBeInTheDocument()
    ```
  - |
    AC 2 — `SectionCard.test.tsx`: three sibling cards, one never resolves; the others show their content while it still shows loading.
    ```tsx
    render(<>
      <SectionCard title="Recent transactions" label="recent transactions" plural load={() => Promise.resolve('txns')}>{(d) => <p>{d}</p>}</SectionCard>
      <SectionCard title="Upcoming payments" label="upcoming payments" plural load={never}>{(d) => <p>{d}</p>}</SectionCard>
      <SectionCard title="Loan details" label="loan details" plural load={() => Promise.resolve('loans')}>{(d) => <p>{d}</p>}</SectionCard>
    </>)
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(screen.getByText('loans')).toBeInTheDocument()
    expect(screen.getByText('Loading upcoming payments…')).toBeInTheDocument()
    ```
  - |
    AC 3 — `SectionCard.test.tsx`: a rejecting loader shows the error message in the section's place and no loading indicator.
    ```tsx
    render(<SectionCard title="Loan details" label="loan details" plural load={() => Promise.reject(new Error('boom'))}>{(d) => <p>{d}</p>}</SectionCard>)
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your loan details. Your other sections are not affected.")
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    ```
  - |
    AC 4 — `SectionCard.test.tsx`: with one failing and one loaded sibling, the loaded one stays visible and only one alert exists.
    ```tsx
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(await screen.findAllByRole('alert')).toHaveLength(1)
    ```
  - |
    AC 5 — `SectionCard.test.tsx`: on failure a "Try again" button is shown, and not while loading or loaded.
    ```tsx
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeEnabled()
    ```
  - |
    AC 6 — `SectionCard.test.tsx` and `useSectionLoader.test.tsx`: pressing Try again calls that section's loader again, shows the button's retrying state, then the content on success (and the error again if it fails again).
    ```tsx
    const load = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('txns')
    // ... render, await error
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('button', { name: /Trying again/ })).toBeDisabled()
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
    ```
    Hook test: `const { result } = renderHook(() => useSectionLoader(load)); await waitFor(() => expect(result.current.state.status).toBe('error')); act(() => result.current.retry()); expect(result.current.state).toEqual({ status: 'error', retrying: true })`. Also a stale-result test: resolve an earlier call after a retry and assert the newer result wins.
  - |
    AC 7 — `SectionCard.test.tsx`: one failed card and two loaded cards, each with its own loader mock; after pressing Try again on the failed card only its loader is called again and the others' DOM and call counts are unchanged.
    ```tsx
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await screen.findByText('loans')
    expect(txnsLoad).toHaveBeenCalledTimes(1)
    expect(paymentsLoad).toHaveBeenCalledTimes(1)
    expect(screen.getByText('txns')).toBe(txnsNodeBefore)   // same DOM node: not re-rendered from scratch
    ```
  - |
    Account cards stay out — `SectionCard.test.tsx` has no account-card case. Run narrowly with `cd apps/web && pnpm exec vitest run src/dashboard/sections` (same runner and config as `pnpm test`, scoped to the new folder); then the full `cd apps/web && pnpm test` and `pnpm typecheck`.
assumptions_or_open_questions:
  - |
    Dependency on the section stories: `Dashboard.tsx` currently renders only the top bar, sidebar, greeting and quick actions. I searched `apps/web/src` and `services/` and found no dashboard section, account, transaction or dashboard API code at all. This story therefore delivers the shared `useSectionLoader` + `SectionCard` and tests them with fake loaders; it does NOT add the five sections, their data endpoints or their loaded content. STORY-027 to STORY-031 each pass their own `load` (their own Leave API or bank-data call) and content into `SectionCard`. Please confirm this split. If you want one real section wired into `Dashboard.tsx` here to prove it end to end, that needs an endpoint that no story in this item covers, and I would split it out.
  - |
    Which sections count as "whole sections" for this story: following the design, transactions, upcoming payments, credit card summary, loan details, pre-approved offers and other services. The design draws only transactions and loan details failing and only payments, card summary and loan details loading, but the behaviour is the same for all six.
  - |
    Design vs AC: the design's error card keeps the section heading and shows both a danger alert and an "unavailable" line with the button. AC 3 only asks for "an error message in its place". I follow the design (both texts) and the tests assert the alert text; say if you want only one message.
  - |
    Design extras not in any AC: after a successful retry the prototype shows a toast "Recent transactions loaded. Your other sections were not changed." The ACs do not ask for it, so it is left out. Add it if wanted (the toast classes would need confirming in `prototype-utils.css`).
  - |
    The prototype's "View all" and "View loans" header links belong to each section's own story. `SectionCard` exposes an `action` slot shown only when loaded; the design's error state has no header link.
  - |
    The prototype's "Loan details" error text is "Loan details are temporarily unavailable" while "Credit card summary" would read "is", hence the `plural` prop. Wording for the other sections is my extrapolation of the prototype's pattern.
  - |
    Open project-wide questions (target load time and concurrency, supported devices and balance freshness, audit logging) do not change this plan. There is no timeout or automatic retry here, since no AC asks for either: a section stays in loading until its loader settles. Whether to cap the wait is a question for the section stories and the load-time target.
  - |
    Layout note: the prototype's `.sections`, `.split` and `.cards-3` grid classes are not needed by this story (they are the frame the section stories place cards in); they are not added here.
estimated_points: 3
package_dependencies: []
notes: |
  ### Data & rollout

  None — front-end component and CSS only: no migration, stored data, seed, setting or env var, and nothing to provision. Safe to roll back by reverting the commit.

  ### Design and tokens

  Read the approved prototype (`TESTING-18-NOV-STORY-032-design.html`): the states `loading` (lines 1176-1244) and `error` (lines 1247-1311), the NEW `section-status` CSS (lines 1026-1030) and the retry script (lines 1338-1351). The app already loads the tokens: `apps/web/src/index.css` line 2 imports `../../../design-system/tokens.css` and line 3 imports `prototype-utils.css`; `apps/web/src/dashboard/Dashboard.tsx` line 2 imports `dashboard.css`. Tailwind is also imported (line 1) but the dashboard uses plain classes from those files, so this story does too. Every new style uses tokens by name (see the CSS scope item); no hex or pixel literal. The skeleton bar widths are inline percentages as in the prototype, which are proportions rather than token-covered pixel values.

  Accessibility follows the prototype: `role="status"` with `aria-live="polite"` for loading, `aria-busy` on the loading card, `role="alert"` for the error, the retry button is a real `<button>` with 48px target (`--size-control-lg`) and a visible focus ring from `.btn:focus-visible`. Voice: plain, with the fix named ("Try again"), no exclamation marks, matching UI-GUIDELINES.

  ### Shape

  ```mermaid
  flowchart TD
    App[App.tsx] --> Dashboard[Dashboard.tsx]
    Dashboard -.->|"later stories 027-031 place sections"| SectionCard
    SectionCard[sections/SectionCard.tsx] --> Hook[sections/useSectionLoader.ts]
    SectionCard --> Icon[dashboard/Icon.tsx]
    SectionCard --> CSS[dashboard/dashboard.css]
    CSS --> DS[design-system/prototype-utils.css]
    classDef touched fill:#f96,color:#000
    class SectionCard,Hook,Icon,CSS touched
  ```

  `SectionCard` and `useSectionLoader` are new; `Icon.tsx` gains the missing `alert` glyph; `dashboard.css` gains the section-status styles. `Dashboard.tsx` is unchanged here (dotted edge = future consumers).
review_focus: |
  IN: the shared `useSectionLoader` hook, the `SectionCard` component, its token-only CSS and their tests, for every section except account cards. OUT: the sections' own content and data endpoints (STORY-027 to 031), account-card failure handling (STORY-026), and any change to `Dashboard.tsx`. Riskiest part: keeping sections truly independent (state owned per hook instance, stale responses ignored on retry) and the retry state not flashing the other cards. Deliberate choices: the error card shows both the alert and the "unavailable" line plus Try again, as in the approved design; the design's success toast is omitted because no AC asks for it.
