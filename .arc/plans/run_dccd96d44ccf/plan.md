summary: |
  Build the signed-in Dashboard home page frame in the web app (apps/web, React + Vite + Tailwind, vitest): a sticky top bar (logo, top navigation, user menu), a sidebar listing Dashboard, Accounts, Transfers, Bill pay and Statements (no Settings), a time-of-day greeting by first name ("Good morning/afternoon/evening, Asha", switching at 12:00 and 17:00 local time), and the Transfer money / Pay a bill quick actions. The frame is read-only: nothing on the page or in the quick-action handlers writes customer data. Section content (account cards, transactions, offers, loading/error/no-accounts states) belongs to sibling stories and is out of scope. The approved prototype is built on the design-system tokens, which the app does not load today, so the plan also imports them once.
scope:
  - description: |
      Load the design system once in the app's entry stylesheet, after the tailwind import:
      ```css
      @import 'tailwindcss';
      @import '../../../design-system/tokens.css';
      @import '../../../design-system/prototype-utils.css';
      ```
      tokens.css provides the `--color-*`, `--space-*`, `--font-size-*`, `--size-*`, `--radius-*`, `--border-width*`, `--z-*`, `--shadow-md` custom properties. prototype-utils.css defines the classes the prototype uses and the app needs: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-icon`, `.btn-lg`, `.avatar`, `.menu-item`, `.sr-only`, `.container`. Both files were read this session. Check `pnpm build` and `pnpm dev` resolve the relative path outside apps/web (add `server.fs.allow` in vite.config.ts only if dev serving fails).
    files:
      - apps/web/src/index.css
      - apps/web/vite.config.ts
    rationale: |
      Tokens are not imported anywhere today (index.css holds only the tailwind import, main.tsx imports index.css). Every UI step below styles only through these tokens.
  - description: |
      Greeting rule as a pure function, written test-first:
      ```ts
      export type DayPart = 'morning' | 'afternoon' | 'evening'
      export function dayPartFor(date: Date): DayPart   // getHours() < 12 morning, < 17 afternoon, else evening
      export function greetingFor(firstName: string, date: Date): string // `Good ${part}, ${firstName}`
      ```
      Uses the device's local time (`getHours`/`getMinutes` are local), matching the prototype's `greetingFor` (h < 12, h < 17). Hours before 05:00 read "Good morning", as in the prototype.
    files:
      - apps/web/src/dashboard/greeting.ts
      - apps/web/src/dashboard/greeting.test.ts
    rationale: Boundary logic (11:59, 12:00, 16:59, 17:00) is the riskiest behaviour; isolating it makes it unit-testable with fixed Dates.
  - description: |
      Navigation model and signed-in customer seam.
      ```ts
      // src/dashboard/navigation.ts
      export type Destination = 'dashboard' | 'accounts' | 'transfers' | 'bill-pay' | 'statements' | 'payments' | 'cards' | 'profile'
      export const SIDEBAR_ITEMS: { destination: Destination; label: string; icon: string }[] // Dashboard, Accounts, Transfers, Bill pay, Statements, in that order; NO settings
      export const TOP_NAV_ITEMS: { destination: Destination; label: string }[]              // Dashboard, Accounts, Payments, Cards (as drawn in the prototype)
      // src/session/customer.tsx
      export type Customer = { firstName: string; fullName: string }
      export const CustomerContext = createContext<Customer | null>(null)
      export function useCustomer(): Customer | null
      ```
      The initials shown in the avatar are derived from `fullName` (first letters of first and last word).
    files:
      - apps/web/src/dashboard/navigation.ts
      - apps/web/src/session/customer.tsx
    rationale: |
      The app has no session or router today (App.tsx is a static heading). The frame needs the customer's name from the signed-in session; the context is the seam the sign-in/session work fills, so no sample customer is hard-coded in production code. See open questions.
  - description: |
      Dashboard components, styled with tokens only, mirroring the prototype's Dashboard screen:
      - `TopBar.tsx` (`<header>`, data-testid top-bar): sticky, `z-index: var(--z-dropdown)`, `background: var(--color-bg)`, `border-bottom: var(--border-width) solid var(--color-border)`, padding `var(--space-2) var(--space-3)` (`var(--space-4)` inline at >=48em), gap `var(--space-3)`. Logo: `.logo-mark` (`--size-avatar` square, `--radius-md`, `--color-primary` fill, `--color-on-primary` icon) plus the text "Bank Application", bold, `--font-size-md`. Top nav `<nav aria-label="Main">` with `TOP_NAV_ITEMS` as `.navlink` buttons (height `--size-control-lg`, `--font-size-sm`, medium weight, current page has `aria-current="page"` with `--color-primary-subtle` background and `--color-primary-subtle-fg` text). Below 48em the nav is `hidden` behind a `.btn .btn-secondary .btn-icon .btn-lg` menu button (`aria-label="Menu"`, `aria-controls`, `aria-expanded` state); at >=48em it is always shown and the menu button is hidden.
      - `UserMenu.tsx`: trigger button `aria-label="Account menu for {fullName}"` with `.avatar` (initials), full name (shown >=48em) and a chevron; popup `role="menu"` using `.menu-item` entries "Your profile" and "Sign out", `background: var(--color-bg)`, `border: var(--border-width) solid var(--color-border)`, `--radius-md`, `--shadow-md`, min-width `--size-menu`. Opens on click, closes on Escape, outside click or item pick. Sign out calls an `onSignOut` prop supplied by the sign-in flow (not implemented here).
      - `SideNav.tsx` (`<nav aria-label="Banking areas">`): `SIDEBAR_ITEMS` as `.navlink` buttons with icons, Dashboard `aria-current="page"`. Below 48em it is a horizontal scrolling strip under the top bar (`overflow-x: auto`); at >=48em a left column of width `calc(var(--size-menu) + var(--space-3))`, right border `var(--border-width) solid var(--color-border)`.
      - `QuickActions.tsx` (`role="group" aria-label="Quick actions"`): "Transfer money" as `.btn .btn-primary` (the one primary button on the view) and "Pay a bill" as `.btn .btn-secondary`, both `min-height: var(--size-control-lg)`, gap `var(--space-2)`. Each calls `onNavigate('transfers' | 'bill-pay')` only.
      - `Dashboard.tsx`: `.layout` grid (`1fr`, then sidebar + `1fr` at >=48em) below the top bar; `<main>` capped at `max-width: var(--size-content)` with padding `var(--space-3)` (`var(--space-5) var(--space-4)` at >=48em); `.page-header` with `<h1 aria-live="polite">` greeting (`--font-size-xl`, `--line-height-tight`, one h1 per screen) and the quick actions on the right (wraps on phones, `gap: var(--space-3)`, `margin-bottom: var(--space-4)`). Props: `{ now?: Date; onNavigate: (d: Destination) => void; onSignOut?: () => void }`; reads the name via `useCustomer()`. Main renders nothing beyond the header: sibling stories fill the sections area.
      - `dashboard.css`: the page-specific classes the prototype defines inline (`.topbar`, `.logo`, `.logo-mark`, `.topnav`, `.navlink`, `.user-*`, `.layout`, `.sidenav`, `.main`, `.page-header`, `.quick-actions`) rewritten on the same tokens, with the `@media (min-width: 48em)` breakpoint from the prototype and the UI guideline. No hex, rgb or raw px values; focus ring `outline: var(--border-width-strong) solid var(--color-primary); outline-offset: var(--outline-offset)`. Imported from Dashboard.tsx.
      None of these components fetch or write data; quick actions and nav items only call `onNavigate`.
    files:
      - apps/web/src/dashboard/TopBar.tsx
      - apps/web/src/dashboard/UserMenu.tsx
      - apps/web/src/dashboard/SideNav.tsx
      - apps/web/src/dashboard/QuickActions.tsx
      - apps/web/src/dashboard/Dashboard.tsx
      - apps/web/src/dashboard/dashboard.css
    rationale: Each component maps to a labelled element of the approved prototype (top-bar, logo, top-nav, user-menu, sidebar, title, quick-actions).
  - description: |
      Replace the placeholder App with the Dashboard and wire navigation. `App` renders `<Dashboard onNavigate={...} />` inside the `CustomerContext` value it reads; `onNavigate` sets `window.location.hash` to `#/<destination>` (the destination epics own the pages; no router is added here). When no customer is in context the App renders nothing (never a fake name). Update the existing App test and the e2e spec, which both assert the old "Web App" heading and would otherwise fail.
    files:
      - apps/web/src/App.tsx
      - apps/web/src/App.test.tsx
      - apps/web/e2e/app.spec.ts
    rationale: The old heading is removed by this story, so its two assertions must change with it.
tests:
  - |
    AC 8-11 (greeting.test.ts, written first, fails because the module does not exist):
    ```ts
    const at = (h: number, m: number) => new Date(2026, 10, 18, h, m)
    expect(greetingFor('Asha', at(11, 59))).toBe('Good morning, Asha')
    expect(greetingFor('Asha', at(12, 0))).toBe('Good afternoon, Asha')
    expect(greetingFor('Asha', at(16, 59))).toBe('Good afternoon, Asha')
    expect(greetingFor('Asha', at(17, 0))).toBe('Good evening, Asha')
    ```
  - |
    AC 8-11 end to end in the component (Dashboard.test.tsx): render `<CustomerContext.Provider value={{ firstName: 'Asha', fullName: 'Asha Menon' }}><Dashboard now={new Date(2026, 10, 18, 11, 59)} onNavigate={vi.fn()} /></CustomerContext.Provider>` and
    ```ts
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good morning, Asha')
    ```
    repeated for 12:00 and 16:59 (afternoon) and 17:00 (evening) through `rerender`.
  - |
    AC 1 and 2 (Dashboard.test.tsx):
    ```ts
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(within(screen.getByRole('banner')).getByText('Bank Application')).toBeInTheDocument()
    ```
  - |
    AC 3 (Dashboard.test.tsx). jsdom does not apply the media query, so the nav starts `hidden` (collapsed phone state) and a hidden element is excluded from role queries; query with `hidden: true` and also check opening it via the menu button:
    ```ts
    const nav = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main', hidden: true })
    expect(within(nav).getAllByRole('button', { hidden: true }).map(b => b.textContent)).toEqual(['Dashboard', 'Accounts', 'Payments', 'Cards'])
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeVisible()
    ```
  - |
    AC 4 (Dashboard.test.tsx):
    ```ts
    const trigger = screen.getByRole('button', { name: 'Account menu for Asha Menon' })
    fireEvent.click(trigger)
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
    ```
  - |
    AC 5 and 6 (Dashboard.test.tsx):
    ```ts
    const side = screen.getByRole('navigation', { name: 'Banking areas' })
    expect(within(side).getAllByRole('button').map(b => b.textContent)).toEqual(['Dashboard', 'Accounts', 'Transfers', 'Bill pay', 'Statements'])
    ```
  - |
    AC 7 (Dashboard.test.tsx):
    ```ts
    expect(screen.queryByText(/settings/i)).not.toBeInTheDocument()
    ```
  - |
    AC 12 and 13 (Dashboard.test.tsx):
    ```ts
    const group = screen.getByRole('group', { name: 'Quick actions' })
    expect(within(group).getByRole('button', { name: 'Transfer money' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Pay a bill' })).toBeInTheDocument()
    ```
  - |
    AC 14 (Dashboard.test.tsx): loading the dashboard changes nothing. Spy on every network path before render:
    ```ts
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(/* Dashboard as above */)
    expect(fetchSpy).not.toHaveBeenCalled()
    ```
  - |
    AC 15 and 16 (Dashboard.test.tsx): pressing the quick actions only navigates, never writes:
    ```ts
    const onNavigate = vi.fn()
    fireEvent.click(screen.getByRole('button', { name: 'Transfer money' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pay a bill' }))
    expect(onNavigate.mock.calls).toEqual([['transfers'], ['bill-pay']])
    expect(fetchSpy).not.toHaveBeenCalled()
    ```
  - |
    App wiring (App.test.tsx, replaces the "Web App" heading test): with a customer in context the App shows `Good ..., Asha`; with none it renders no heading. e2e (app.spec.ts) replaces the "Web App" heading check with a check that the page has no horizontal overflow at 375px width and that the Menu button is visible there; it does not assert the greeting because no session source exists yet (see open questions).
assumptions_or_open_questions:
  - |
    Where does the signed-in customer's first name come from? The web app has no session, auth client or router today, and leave-api exposes only GET /health (services/leave-api/src/app.controller.ts). Sign-in is expected from a sibling story (ADR-0005, Entra ID SSO, and ADR-0001: the web app talks only to the API). This plan adds only the `CustomerContext` seam and renders nothing without a customer, so until the session story provides the context the production app shows a blank page. Confirm that the session/sign-in story lands first or in parallel, or ask for a `GET /me` endpoint to be added to this item (that would make it a larger piece of work).
  - |
    The settled stack and ADRs describe a Leave Manager (leave-api, Entra ID) and the UI guidelines say "Top bar, no sidebar" with sections Overview / My leave / Team calendar / Approvals / Account, while this item and its approved prototype are a banking dashboard with a top bar AND a sidebar and the sections Dashboard, Accounts, Transfers, Bill pay, Statements. The acceptance criteria and the approved design are followed here and the guideline's navigation section is not applied. The guideline rules for tokens, 48em collapse, one primary button, voice and tone are applied. Please confirm.
  - |
    Top navigation items (Dashboard, Accounts, Payments, Cards) and the user menu entries (Your profile, Sign out) are taken from the prototype; the acceptance criteria only say a top navigation and a user menu are shown. "Your profile" and Sign out have no destination in this story: Sign out calls an `onSignOut` prop the sign-in flow supplies, and "Your profile" navigates to `#/profile` with no page behind it.
  - |
    Quick actions and nav items call `onNavigate`, which sets `window.location.hash`; no router is added and the destination pages belong to other epics. The prototype instead shows a toast and an error state for these buttons and "isn't built yet" toasts; those are prototype shortcuts and are not carried over. Confirm that a hash change with no page behind it is acceptable until the destination epics land, or name the router to use.
  - |
    The prototype's greeting sub-line ("Your accounts as of today, 18 Nov 2026"), the account cards, transactions, upcoming payments, card and loan summaries, offers, other services, and the empty, loading and error states are not built: the story scope says section content is in sibling stories. The prototype's "Customer's local time" selector is a reviewer aid and is not built. The settled assumption about partially failed account loads belongs to those sibling stories.
  - |
    Open planning questions from the epic and CHORE-020 (target load time and concurrent users, supported devices and screen sizes, balance freshness, audit logging and monitoring for access to account data) are not answered by the code or the item. This frame fetches no data, so none block it. Layout is responsive from phone width up to `--size-content`, using the prototype's 48em breakpoint, as an assumption. Audit logging belongs to whichever story first reads account data.
  - |
    The app name "Bank Application" in the logo and the icons are copied from the prototype (the icons are inline SVG in the prototype's kit; the plan uses small inline SVG components rather than adding an icon package). Confirm the brand text.
  - |
    Hours between 00:00 and 04:59 give "Good morning", as in the prototype; the acceptance criteria only fix the boundaries at 12:00 and 17:00.
estimated_points: 3
package_dependencies: []
notes: |
  ### Data & rollout
  None — front-end only page frame; no database, stored data, seed, setting or env var changes. Roll back by reverting the commit.

  Existing tooling read this session: apps/web/package.json (vitest run, jsdom, @testing-library/react and jest-dom, no user-event so tests use `fireEvent`), vite.config.ts (test include is `src/**/*.test.{ts,tsx}`, setup `./src/test-setup.ts`), src/index.css (tailwind import only), App.tsx, main.tsx, App.test.tsx, e2e/app.spec.ts. The design system files are in design-system/ (tokens.css, prototype-utils.css, tokens.json, app-shell.html, style-guide.html, UI-GUIDELINES.md).

  Design source: the approved prototype's Dashboard screen. Elements built: top-bar, logo, top-nav, user-menu, sidebar with nav-dashboard / nav-accounts / nav-transfers / nav-bill-pay / nav-statements, title (greeting), quick-actions (transfer-money primary, pay-bill secondary). Prototype classes `.btn*`, `.avatar`, `.menu-item`, `.sr-only` are defined in design-system/prototype-utils.css and imported once; `.topbar`, `.logo`, `.navlink`, `.layout`, `.sidenav`, `.main`, `.page-header`, `.quick-actions`, `.user-*` exist only in the prototype's inline style and are redefined in dashboard.css on the same tokens. The prototype uses `.card` only in the sections that are out of scope, so it is not used here.

  Colour, spacing, type and size values all use the token names read from tokens.css: `--color-bg`, `--color-surface`, `--color-border`, `--color-primary`, `--color-primary-subtle`, `--color-primary-subtle-fg`, `--color-on-primary`, `--color-fg`, `--color-fg-muted`, `--space-1..6`, `--font-size-sm/md/xl`, `--size-control-lg`, `--size-avatar`, `--size-menu`, `--size-content`, `--radius-md`, `--shadow-md`, `--z-dropdown`, `--border-width`, `--border-width-strong`, `--outline-offset`. The prototype's 48em breakpoint is a media query and cannot use a custom property, so it appears as a literal `48em`, which is the value the UI guideline also states.

  Suggested narrow test commands (derived from the project command): `cd apps/web && pnpm exec vitest run src/dashboard/greeting.test.ts`, then `cd apps/web && pnpm exec vitest run src/dashboard src/App.test.tsx`.

  ```mermaid
  flowchart TD
    main[main.tsx] --> App[App.tsx]
    main --> css[index.css]
    css --> tokens[design-system/tokens.css]
    css --> utils[design-system/prototype-utils.css]
    App --> Dashboard[Dashboard.tsx]
    Dashboard --> TopBar[TopBar.tsx]
    Dashboard --> SideNav[SideNav.tsx]
    Dashboard --> QuickActions[QuickActions.tsx]
    Dashboard --> greeting[greeting.ts]
    Dashboard --> customer[session/customer.tsx]
    TopBar --> UserMenu[UserMenu.tsx]
    TopBar --> nav[navigation.ts]
    SideNav --> nav
    classDef touched fill:#f96,color:#000
    class App,css,Dashboard,TopBar,SideNav,QuickActions,UserMenu,greeting,customer,nav touched
  ```
  Touched nodes: index.css loads the tokens once; App.tsx swaps the placeholder heading for the Dashboard; the rest are new files for the frame, greeting rule, nav model and customer seam. main.tsx and the design-system files are unchanged context.
review_focus: |
  IN scope: top bar, sidebar (no Settings), time-of-day greeting by first name, Transfer money and Pay a bill quick actions, token import, and updating the old "Web App" tests. OUT: all section content and its loading/error/empty states, destination pages, sign-in, and any API or database change. Riskiest areas: the greeting boundaries at 12:00 and 17:00 in local time, and the missing customer/session source (the plan adds only a context seam and renders nothing without it). Deliberate: the page follows the item's acceptance criteria and approved prototype (top bar plus sidebar) over the UI guideline's "no sidebar" rule, and no code path in this story writes data or calls the network.
