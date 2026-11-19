summary: |
  Give every whole dashboard section except the account cards its own loading, error and "Try again" behaviour, so one slow or failing section never blocks or hides the others. The work is a small reusable pair in the web app: a `useSectionLoader` hook (one independent load lifecycle per section, with `retry`) and a `SectionCard` component that renders the approved design's three views of a section card (loading skeleton, in-place error with Try again, loaded content). Sections from STORY-027 to STORY-031 will pass their own loader and content into `SectionCard`. Account cards are out of scope (their per-card placeholder belongs to the account cards story).
scope:
  - description: |
      Add the hook that owns one section's load lifecycle.

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

      Starts in `loading`, calls `load()` once on mount, moves to `loaded` or `error`. `retry()` keeps the card in `error` with `retrying: true` and re-runs only this hook's `load`. A result from a superseded or unmounted call is ignored (request counter in a ref), so a late response cannot overwrite a newer one. Each section uses its own hook instance; nothing is shared or lifted into `Dashboard`.
    files:
      - apps/web/src/dashboard/sections/useSectionLoader.ts
      - apps/web/src/dashboard/sections/useSectionLoader.test.tsx
    rationale: |
      Independence (AC 2, 4, 7) is a property of state ownership: one hook per section means a pending, failed or retried section cannot change another's state. Hook tests pin that down before any UI exists.
  - description: |
      Add `SectionCard`, the shared presentation of the design's section card.

      ```ts
      type SectionCardProps<T> = {
        title: string            // "Recent transactions"
        label: string            // lower-case noun for messages, "recent transactions"
        plural?: boolean         // "are" vs "is" in the unavailable line
        load: () => Promise<T>
        children: (data: T) => React.ReactNode
        action?: React.ReactNode // card-head control such as "View all"; shown only when loaded
      }
      ```

      Markup follows the approved prototype (states `loading` and `error`):
      - Always `<div className="card section-status">` with `<div className="card-head"><h2>{title}</h2>{action}</div>`; `aria-busy="true"` while loading.
      - Loading (AC 1): `<div role="status" aria-live="polite" className="sk-stack">` holding `<p className="muted section-note">Loading {label}…</p>` and four `<span className="skeleton" style={{ width }}/>` bars (prototype widths 70%, 45%, 80%, 50%).
      - Error (AC 3, 5): `<div className="alert alert-danger" role="alert">` with `<Icon name="alert" />` and "We couldn't load your {label}. Your other sections are not affected.", then `<div className="empty-state"><p>{Title} {are|is} temporarily unavailable.</p><button className="btn btn-secondary" type="button">Try again</button></div>`.
      - Retrying (AC 6): the button is `disabled`, `aria-busy="true"`, reads `<span className="spinner" aria-hidden="true"/>Trying again…`.
      - Loaded: render `children(data)` and drop the `section-status` modifier, as the prototype does.

      `Icon.tsx` has no `alert` entry in `PATHS` (it has bag, menu, home, user, arrow-right, bell, calendar, chevron-down). Add `alert: [...]` using the path data from the prototype's `<symbol id="i-alert">` (design file line 1048).
    files:
      - apps/web/src/dashboard/sections/SectionCard.tsx
      - apps/web/src/dashboard/sections/SectionCard.test.tsx
      - apps/web/src/dashboard/Icon.tsx
    rationale: |
      One component gives all later sections identical loading and error behaviour and wording, which is what the story's "shared by every whole section" scope asks for.
  - description: |
      Add the prototype's section-status styles and the few helper classes `dashboard.css` and the design system do not define, using tokens only:

      ```css
      .section-status { display: flex; flex-direction: column; gap: var(--space-2); }
      .section-status .empty-state { padding: var(--space-3) 0 0; }
      .section-status .btn { align-self: flex-start; min-height: var(--size-control-lg); gap: var(--space-2); }
      .section-note { margin: 0 0 var(--space-3); }
      .sk-stack { display: flex; flex-direction: column; gap: var(--space-2); }
      .card-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-2); }
      .card h2, .card h3 { margin: 0; font-size: var(--font-size-md); }
      .muted { color: var(--color-fg-muted); font-size: var(--font-size-sm); }
      ```

      `.alert` already exists in `design-system/prototype-utils.css` (line 202), so only add the prototype's `.alert { margin-bottom; align-items }` tweak scoped as `.section-status .alert { margin-bottom: var(--space-3); align-items: flex-start; }` to avoid changing other alerts. Before adding `.card-head`, `.muted`, `.card h2`, re-read `dashboard.css` and skip any a merged story already added. No colour or pixel literals.
    files:
      - apps/web/src/dashboard/dashboard.css
    rationale: |
      `.card`, `.btn`, `.btn-secondary`, `.alert-danger`, `.empty-state`, `.skeleton` and `.spinner` are already in `design-system/prototype-utils.css`, which `apps/web/src/index.css` imports on line 3 after `tokens.css` on line 2, so no new import is needed. The section-status classes exist only in the prototype's inline style, so they are defined in the app on the same tokens.
tests:
  - |
    AC 1 (write first, fails) in `SectionCard.test.tsx`: a pending loader shows the indicator and no content.
    ```tsx
    const never = () => new Promise<string>(() => {})
    render(<SectionCard title="Upcoming payments" label="upcoming payments" load={never}>{(d) => <p>{d}</p>}</SectionCard>)
    expect(screen.getByRole('status')).toHaveTextContent('Loading upcoming payments…')
    expect(screen.getByRole('heading', { name: 'Upcoming payments' })).toBeInTheDocument()
    ```
  - |
    AC 2 in `SectionCard.test.tsx`: three sibling cards, one never resolves; the others show content while it still shows loading.
    ```tsx
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(screen.getByText('loans')).toBeInTheDocument()
    expect(screen.getByText('Loading upcoming payments…')).toBeInTheDocument()
    ```
  - |
    AC 3 in `SectionCard.test.tsx`: a rejecting loader shows the error message in the section's place and no loading indicator.
    ```tsx
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your loan details. Your other sections are not affected.")
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    ```
  - |
    AC 4 in `SectionCard.test.tsx`: one failing and one loaded sibling; the loaded one stays visible and only one alert exists.
    ```tsx
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(await screen.findAllByRole('alert')).toHaveLength(1)
    ```
  - |
    AC 5 in `SectionCard.test.tsx`: on failure a Try again button is shown, and not while loading or loaded.
    ```tsx
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeEnabled()
    ```
  - |
    AC 6 in `SectionCard.test.tsx` and `useSectionLoader.test.tsx`: pressing Try again calls that section's loader again, shows the retrying button, then the content (or the error again if it fails again).
    ```tsx
    const load = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('txns')
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('button', { name: /Trying again/ })).toBeDisabled()
    expect(await screen.findByText('txns')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
    ```
    Hook test:
    ```tsx
    const { result } = renderHook(() => useSectionLoader(load))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry())
    expect(result.current.state).toEqual({ status: 'error', retrying: true })
    ```
    Plus a stale-result test: resolve an earlier call after a retry and assert the newer result wins.
  - |
    AC 7 in `SectionCard.test.tsx`: one failed and two loaded cards, each with its own loader mock; after Try again only the failed card's loader is called again and the others are unchanged.
    ```tsx
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await screen.findByText('loans')
    expect(txnsLoad).toHaveBeenCalledTimes(1)
    expect(paymentsLoad).toHaveBeenCalledTimes(1)
    expect(screen.getByText('txns')).toBe(txnsNodeBefore)
    ```
  - |
    Run narrowly with `cd apps/web && pnpm exec vitest run src/dashboard/sections`, then the full `cd apps/web && pnpm test` and `pnpm typecheck`. No account-card case is included.
assumptions_or_open_questions:
  - |
    Dependency on the section stories: `Dashboard.tsx` currently renders only the top bar, sidebar, greeting and quick actions, and I found no dashboard section, account, transaction or dashboard API code in `apps/web/src` or `services/`. This story delivers the shared `useSectionLoader` and `SectionCard` and tests them with fake loaders; it does not add the sections, their data endpoints or their content (STORY-027 to 031 do, each passing its own `load`). Please confirm this split. Wiring one real section here would need an endpoint no story in this item covers, and I would split that out.
  - |
    "Whole sections" for this story, following the design: transactions, upcoming payments, credit card summary, loan details, pre-approved offers and other services. The design draws only some of them loading or failing, but behaviour is the same for all.
  - |
    Design vs AC: the design's error card keeps the heading and shows both a danger alert and an "unavailable" line with the button. AC 3 only asks for "an error message in its place". I follow the design and tests assert the alert text; say if you want only one message.
  - |
    The prototype shows a toast after a successful retry ("Recent transactions loaded. Your other sections were not changed."). No AC asks for it, so it is left out.
  - |
    The prototype's "View all" and "View loans" header links belong to each section's story. `SectionCard` exposes an `action` slot shown only when loaded.
  - |
    Wording for sections other than the prototype's two failing ones is my extrapolation of its pattern; the `plural` prop picks "are" or "is".
  - |
    Open project-wide questions (target load time and concurrency, devices and balance freshness, audit logging) do not change this plan. There is no timeout or automatic retry because no AC asks for one; a section stays loading until its loader settles.
  - |
    The prototype's `.sections`, `.split` and `.cards-3` grid classes are the frame the section stories place cards in, so they are not added here.
estimated_points: 3
package_dependencies: []
notes: |
  ### Data & rollout

  None — front-end component and CSS only: no migration, stored data, seed, setting or env var, and nothing to provision. Safe to roll back by reverting the commit.

  ### Design and tokens

  Read the approved prototype `TESTING-18-NOV-STORY-032-design.html`: the `section-status` CSS (lines 1017-1030), the loading and error card states (about lines 1203-1311), the alert symbol (line 1048) and the retry script (about line 1347). The app already loads tokens: `apps/web/src/index.css` line 2 imports `design-system/tokens.css` and line 3 imports `prototype-utils.css`; `Dashboard.tsx` imports `dashboard.css`. Every new style uses tokens by name (`--space-2`, `--space-3`, `--size-control-lg`, `--color-fg-muted`, `--font-size-sm`, `--font-size-md`); no hex or pixel literal. Skeleton bar widths are inline percentages as in the prototype (proportions, not token-covered pixel values).

  Accessibility follows the prototype: `role="status"` with `aria-live="polite"` for loading, `aria-busy` on the loading card, `role="alert"` for the error, a real `<button>` with the `--size-control-lg` target. Voice is plain, names the fix ("Try again"), no exclamation marks, per the UI guidelines (skeleton for pages, spinner for buttons).

  ### Shape

  ```mermaid
  flowchart TD
    Dashboard[Dashboard.tsx] -.->|"later stories 027-031 place sections"| SectionCard
    SectionCard[sections/SectionCard.tsx] --> Hook[sections/useSectionLoader.ts]
    SectionCard --> Icon[dashboard/Icon.tsx]
    SectionCard --> CSS[dashboard/dashboard.css]
    CSS --> DS[design-system/prototype-utils.css]
    classDef touched fill:#f96,color:#000
    class SectionCard,Hook,Icon,CSS touched
  ```

  `SectionCard` and `useSectionLoader` are new; `Icon.tsx` gains the `alert` glyph; `dashboard.css` gains the section-status styles. `Dashboard.tsx` is unchanged (dotted edge = future consumers).
review_focus: |
  IN: the shared `useSectionLoader` hook, `SectionCard`, the `alert` icon, token-only CSS and their tests, for every section except account cards. OUT: the sections' own content and endpoints (STORY-027 to 031), account-card failure handling, and any change to `Dashboard.tsx`. Riskiest part: keeping sections truly independent (state per hook instance, stale responses ignored on retry, no flash of other cards). Deliberate: the error card shows both the alert and the "unavailable" line plus Try again, as in the design; the design's success toast is omitted because no AC asks for it.
