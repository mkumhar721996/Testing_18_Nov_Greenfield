summary: |
  Add the "Other services" card to the dashboard: a full-width card with five inert tiles (Fixed deposit, Insurance, Mutual funds, Forex card, Cheque book), exactly as drawn in the approved prototype (`section[data-wf-id="other-services"]`, `ul.service-tiles` of `button.service-tile`). Pressing a tile does not navigate and shows only a neutral status toast ("<Service> is not available yet. You are still on your dashboard."), never an error. The change is front-end only because the story states the tiles are display-only and their destinations are deferred; the five labels are a fixed list in code (no endpoint, no storage). The design-system tokens and component stylesheet are not loaded by the app yet, so this item also imports them once in the app's entry stylesheet.
scope:
  - description: |
      Load the design system once, in the app's entry stylesheet `apps/web/src/index.css` (currently only `@import 'tailwindcss';`, loaded by `main.tsx` line 4 and processed by `@tailwindcss/vite` in `vite.config.ts`). Add, after the tailwind import:

      ```css
      @import 'tailwindcss';
      @import '../../../design-system/tokens.css';
      @import '../../../design-system/prototype-utils.css';
      ```

      Then define, in the same file and only on tokens, the three classes the prototype defines inline and the design system does not (verified: `design-system/prototype-utils.css` defines `.card`, `.card-title`, `.toast`, `.sr-only`, `.btn*`, `.alert`, `.skeleton`, `.empty-state` but NOT `.card-head`, `.service-tiles`, `.service-tile`, `.service-icon`): copy the prototype's rules for `.card-head`, `.card h2`, `.service-tiles`, `.service-tile` (+ `:hover`, `:active`, `:focus-visible`) and `.service-icon` verbatim. Tokens used: `--space-2`, `--space-3`, `--size-menu`, `--size-control-lg`, `--size-control-md`, `--border-width`, `--border-width-strong`, `--outline-offset`, `--color-border`, `--color-border-strong`, `--color-bg`, `--color-fg`, `--color-surface`, `--color-primary`, `--color-primary-subtle`, `--color-primary-subtle-fg`, `--radius-lg`, `--radius-full`, `--font-size-sm`, `--font-size-md`, `--font-weight-medium`. No hex/rgb/px literals.
    files:
      - apps/web/src/index.css
    rationale: |
      The app does not load the tokens today (grep for design-system/tokens.css finds no reference under apps/web). Every UI class named in later steps must be defined by a stylesheet the app loads.
  - description: |
      Create the `OtherServices` component (TDD: write `OtherServices.test.tsx` first, see tests). Signature and markup follow the prototype lines 1147-1156:

      ```tsx
      export const OTHER_SERVICES = [
        { id: 'fixed-deposit', label: 'Fixed deposit', icon: 'calendar' },
        { id: 'insurance', label: 'Insurance', icon: 'heart' },
        { id: 'mutual-funds', label: 'Mutual funds', icon: 'star' },
        { id: 'forex-card', label: 'Forex card', icon: 'bag' },
        { id: 'cheque-book', label: 'Cheque book', icon: 'edit' },
      ] as const

      export default function OtherServices(): JSX.Element
      ```

      Render `<section className="card span-all" aria-labelledby="other-services-title">` with `<div className="card-head"><h2 id="other-services-title">Other services</h2></div>` and `<ul className="service-tiles">`; each `<li>` holds `<button type="button" className="service-tile">` containing `<span className="service-icon" aria-hidden="true">` (inline SVG, 24x24 viewBox, `stroke="currentColor"`, paths copied from the prototype sprite symbols i-calendar, i-heart, i-star, i-bag, i-edit) followed by the label text. Order is the order of the array above (same as the prototype). `span-all` is a prototype-inline helper (`grid-column: 1 / -1`) — add that one rule to `index.css` too, or drop the class if the section is not placed inside a grid.

      Tiles are inert: `type="button"`, no `href`, no router, no `window.location` use. The click handler only calls `setNotice(`${label} is not available yet. You are still on your dashboard.`)`. Render the notice in a `<div className="toast is-open" role="status">` (the `.toast` class is in prototype-utils.css and needs `is-open` to display) and clear it after 4000 ms with a `setTimeout` cleaned up on unmount/next click (same timing as the prototype kit). Not `role="alert"`, no `.alert-danger`, no error wording (guideline: confirmation of an action is a `.toast`). Tile focus ring comes from `.service-tile:focus-visible`; tiles are native buttons so keyboard Enter/Space work, giving a touch target of at least `calc(var(--size-control-lg) * 2)` high.
    files:
      - apps/web/src/components/OtherServices.tsx
      - apps/web/src/components/OtherServices.test.tsx
    rationale: |
      One small component owns the section, its fixed tile list and the neutral notice, so the dashboard frame from the sibling stories can mount it unchanged.
  - description: |
      Mount `OtherServices` in `apps/web/src/App.tsx`. Today `App` renders only a placeholder `<main>` with an `h1` "Web App" (read: `apps/web/src/App.tsx`); the dashboard frame (top bar, sidebar, greeting, account cards) from STORY-025/026 is not in this branch. Add `<OtherServices />` below the heading inside `<main>`, keeping the existing heading so `App.test.tsx` keeps passing; do not build any other dashboard section. Adjust the `<main>` layout minimally (e.g. content capped at `max-width: var(--size-content)`, `padding: var(--space-3)`) via the tokens only. When the dashboard frame lands, `OtherServices` moves into its sections container (prototype: last child of the second `.split`, `span-all`).
    files:
      - apps/web/src/App.tsx
      - apps/web/src/App.test.tsx
    rationale: |
      The component must be reachable on the page for AC1 ("when the dashboard loads"); App is the only screen that exists.
tests:
  - |
    AC1 — write first in `apps/web/src/components/OtherServices.test.tsx` (fails until the component exists):

    ```tsx
    import { render, screen, within } from '@testing-library/react'
    import OtherServices from './OtherServices'

    it('shows five labelled tiles in order', () => {
      render(<OtherServices />)
      const section = screen.getByRole('region', { name: 'Other services' })
      const tiles = within(section).getAllByRole('button')
      expect(tiles.map((t) => t.textContent)).toEqual([
        'Fixed deposit', 'Insurance', 'Mutual funds', 'Forex card', 'Cheque book',
      ])
    })
    ```

    Also in `App.test.tsx`: `render(<App />); expect(screen.getAllByRole('button')).toHaveLength(5)` and the existing `Web App` heading assertion still passes.
  - |
    AC2 — same file, using `@testing-library/user-event` is NOT needed (use `fireEvent`, no new dependency):

    ```tsx
    it('stays on the dashboard when a tile is pressed', () => {
      const before = window.location.href
      const historyLength = window.history.length
      render(<OtherServices />)
      for (const tile of screen.getAllByRole('button')) fireEvent.click(tile)
      expect(window.location.href).toBe(before)
      expect(window.history.length).toBe(historyLength)
      expect(screen.getByRole('heading', { name: 'Other services' })).toBeInTheDocument()
      expect(screen.getAllByRole('button')).toHaveLength(5)
      expect(document.querySelector('a[href]')).toBeNull()
    })
    ```
  - |
    AC3 — same file:

    ```tsx
    it('shows a neutral notice and no error when a tile is pressed', () => {
      render(<OtherServices />)
      fireEvent.click(screen.getByRole('button', { name: 'Insurance' }))
      expect(screen.getByRole('status')).toHaveTextContent(
        'Insurance is not available yet. You are still on your dashboard.',
      )
      expect(screen.queryByRole('alert')).toBeNull()
      expect(screen.queryByText(/error|failed|could not/i)).toBeNull()
    })

    it('hides the notice after 4 seconds', () => {
      vi.useFakeTimers()
      render(<OtherServices />)
      fireEvent.click(screen.getByRole('button', { name: 'Forex card' }))
      act(() => { vi.advanceTimersByTime(4000) })
      expect(screen.queryByRole('status')).toBeNull()
      vi.useRealTimers()
    })
    ```

    Narrow run for each step: `cd apps/web && pnpm vitest run src/components/OtherServices.test.tsx` (and `src/App.test.tsx`); full `cd apps/web && pnpm test` and `pnpm typecheck` before finishing. The CSS import is not asserted in jsdom; verify by `cd apps/web && pnpm build` succeeding (resolves the `../../../design-system/*.css` imports).
assumptions_or_open_questions:
  - |
    The dashboard frame (top bar, sidebar, greeting, account cards, other sections) is not in this branch: `apps/web/src` holds only `App.tsx` (placeholder heading), `main.tsx`, `index.css`, `test-setup.ts` and one test. This plan therefore mounts the section in the placeholder `App`; moving it into the real dashboard layout is for whichever story delivers that frame. Confirm this is acceptable or whether this item should wait for it.
  - |
    Domain mismatch: the architecture docs and UI guidelines describe Leave Manager (top bar, no sidebar, leave terminology) while the story and approved prototype are a retail-banking dashboard with a sidebar. Per the instructions the prototype is the source of the tile design; the navigation difference is outside this item (tiles only) and is not touched here.
  - |
    Styling: the confirmed stack says Tailwind, but the design system and prototype are plain-CSS classes built on tokens. The plan loads tokens and `prototype-utils.css` in `index.css` and uses those classes (Tailwind stays loaded, its utilities are not used for the tiles). Flag if the team wants the tiles re-expressed as Tailwind utilities mapped to the tokens.
  - |
    Importing the whole `design-system/prototype-utils.css` also applies its global `body`, `h1-h4` and `a` rules. The prototype relies on them; if they clash with the existing placeholder styling (Tailwind utilities on App), the implementer should adjust the placeholder, not edit the design-system file.
  - |
    Notice wording "<Service> is not available yet. You are still on your dashboard." is taken from the prototype script; the prototype's own design comment also mentions "opens in a later release". AC2/AC3 only require staying put and no error; wording is a copy decision for the reviewer. The toast is a prototype addition not demanded by the ACs and can be dropped (tiles then do nothing visible) if preferred.
  - |
    Icon choice (calendar, heart, star, bag, edit) is the prototype's placeholder set, copied as inline SVG; no icon package is added.
  - |
    Open project-wide questions (load time and concurrency, device and screen sizes, balance freshness, audit logging) do not affect five static tiles; not addressed here. The settled partial-account-failure decision concerns account cards, not this section, and is not affected. Tiles do not depend on account loading, so they show regardless of the loading, empty and error states of other sections — whether the tiles should hide in the whole-page empty and error states (the prototype hides the entire default view in those states) is left to the dashboard frame story.
  - |
    No automated check is needed that destinations are absent beyond the AC2 test; no Playwright test is planned because no e2e harness for the page exists in this branch yet (I did not find an e2e directory under apps/web/src; the `e2e` script runs `playwright test`).
estimated_points: 3
package_dependencies: []
notes: |
  ### Data & rollout

  None — static front-end display only: no stored data, migration, seed, setting or env var. Deploy is the normal web build; rollback is reverting the commit.

  Design reference (read in `TESTING-18-NOV-STORY-031-design.html`): Other services card is `section.card.span-all` (lines 1147-1156) with `h2` "Other services" and `ul.service-tiles` auto-fit grid, `minmax(min(100%, calc(var(--size-menu) / 2 + var(--space-3))), 1fr)` with `gap: var(--space-3)`; each tile is a column-flex button, icon circle (`--size-control-md`, `--color-primary-subtle`) above a `--font-size-sm` medium-weight label, `border: var(--border-width) solid var(--color-border)`, radius `--radius-lg`, hover `--color-surface`, active `--color-primary-subtle`. Single column on phones follows from the auto-fit grid.

  Token loading today: `apps/web/src/index.css` line 1 (`@import 'tailwindcss';`) is the only stylesheet, imported from `apps/web/src/main.tsx` line 4. Tokens live in `design-system/tokens.css`; nothing in `apps/web` references them yet, hence the first scope item.

  ```mermaid
  flowchart TD
    main[main.tsx] --> App[App.tsx]
    main --> css[index.css]
    App --> OS[components/OtherServices.tsx]
    css --> tokens[design-system/tokens.css]
    css --> utils[design-system/prototype-utils.css]
    OS --> test[components/OtherServices.test.tsx]
    classDef touched fill:#f96,color:#000
    class App,css,OS,test touched
  ```
  App.tsx: mounts the section. index.css: loads tokens and design-system classes and adds the tile styles. OtherServices.tsx: new component and its test.
review_focus: |
  IN scope: the five inert tiles, their neutral toast, and loading the design-system tokens and classes once in index.css. OUT: tile destinations, the rest of the dashboard frame and other sections, any backend, auth or data work (the story fixes the tiles as static). Riskiest areas are the global rules pulled in by importing prototype-utils.css and mounting into the placeholder App because the dashboard frame is not on this branch. The toast is deliberate (from the prototype) and must stay role="status", never an alert.
