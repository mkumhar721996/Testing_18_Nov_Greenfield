summary: |
  Add the playable Slot screen end to end. The Leave API gets a stateless `POST /spins` endpoint that validates the bet (only 1, 5, 10, 25, 50), draws a fair random 3x3 grid on the server with `crypto.randomInt`, evaluates it with a pure function and returns bet, reels, outcome and amount won. The Web App (React + Vite) gets a Slot screen built from the approved prototype: a "Bet N" selector that opens an inline list of the five bet sizes, a 3x3 reel grid, a win/loss result panel and one primary Spin button. The Web App holds no game rules (ADR-0001); it only renders what the API returns. Balance, sign-in and jackpot stay with sibling epics.
scope:
  - description: |
      Pure spin engine in the Leave API. Constants and signatures:

      ```ts
      export const BET_SIZES = [1, 5, 10, 25, 50] as const;
      export type BetSize = (typeof BET_SIZES)[number];
      export const SYMBOLS = ['Cherry', 'Bell', 'Bar', 'Seven'] as const;
      export type Symbol = (typeof SYMBOLS)[number];
      export type Reels = Symbol[][]; // 3 rows x 3 columns
      export type SpinOutcome = {
        bet: BetSize;
        reels: Reels;
        outcome: 'win' | 'loss';
        amountWon: number; // 0 on a loss
        winningCells: [number, number][]; // [] on a loss
      };
      export function isBetSize(value: unknown): value is BetSize;
      export function evaluateSpin(bet: BetSize, reels: Reels): SpinOutcome;
      export function drawReels(randomInt?: (max: number) => number): Reels; // default crypto.randomInt
      ```

      `evaluateSpin` wins when all three cells of the main diagonal (the payline the prototype highlights) hold the same symbol; `amountWon = bet * 2` (prototype: bet 25 shows "You win 50"). Anything else is a loss with `amountWon: 0`.
    files:
      - services/leave-api/src/spins/spin-engine.ts
      - services/leave-api/src/spins/spin-engine.spec.ts
    rationale: |
      Keeps win evaluation and randomness server-side and unit-testable with an injected random source (ADR-0001: the web app holds no business rules; parent epic: fair random outcome per spin).
  - description: |
      Spin endpoint. `POST /spins` with body `{ "bet": number }`. A bet outside BET_SIZES (or a non-number) returns 400 and draws nothing. Success returns 201 with the `SpinOutcome` JSON. Controller delegates to a `SpinsService.spin(bet: unknown): SpinOutcome` that throws `BadRequestException` for an invalid bet. Register `SpinsController` and `SpinsService` in a `SpinsModule` imported by `AppModule`. No database access and no persistence in this story.
    files:
      - services/leave-api/src/spins/spins.controller.ts
      - services/leave-api/src/spins/spins.service.ts
      - services/leave-api/src/spins/spins.module.ts
      - services/leave-api/src/spins/spins.controller.spec.ts
      - services/leave-api/src/app.module.ts
      - services/leave-api/e2e/spins.e2e.ts
    rationale: |
      The Web App talks only to the Leave API (ADR-0001, ADR-0002). Mirrors the existing health controller/service/module layout in services/leave-api/src.
  - description: |
      Web API client and types. `playSpin(bet: BetSize): Promise<SpinResult>` does `fetch('/spins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bet }) })`, throws on a non-2xx response and returns the parsed JSON. Add a dev proxy in `vite.config.ts` (`server: { proxy: { '/spins': 'http://localhost:3000' } }`, 3000 being the API default port in services/leave-api/src/main.ts) so no CORS or new env var is needed.
    files:
      - apps/web/src/slot/api.ts
      - apps/web/src/slot/types.ts
      - apps/web/vite.config.ts
    rationale: |
      First fetch call in the web app; there is no existing client to extend (checked apps/web/src).
  - description: |
      Slot screen component `Slot` built from the approved prototype (screen "Slot", states default, bet-open, win, loss):
      - Header: `h1` "Slot" (`--font-size-xl`) with muted "Spin the reels".
      - Bet row (`data-wf-id="bet-row"`): label "Bet size" and a `.btn .btn-secondary` button "Bet {n}" with a chevron, `aria-haspopup="true"`, `aria-expanded` toggled. Default bet is 25 (prototype).
      - Bet list (`ul.bet-options`, `aria-label="Bet size"`): exactly one `button.bet-option` per entry of BET_SIZES (1, 5, 10, 25, 50), `aria-pressed` on the selected one; picking one closes the list; Escape closes it and returns focus to the selector.
      - Reels (`div.reels role="group"`): 3x3 `.reel` cells. Before any spin each shows "–" with `.is-empty` and the group label is "Reels, no spin yet", with the prompt "Pick a bet and press Spin to play." After a spin it shows the returned symbol names; cells in `winningCells` get `.is-win`.
      - Result panel (`.result`, `role="status"`): win shows `.badge .badge-success` "Win", `h2` "You win {amountWon}", text "Bet {bet}. Amount won {amountWon}. Three {symbol} on the diagonal."; loss shows a neutral `.badge-neutral` "Loss", `h2` "No win this spin", text "Bet {bet}. Lost {bet}. Spin again or change your bet."
      - One `.btn .btn-primary` "Spin · bet {n}", full width at `--size-control-lg`. While the request runs the button is disabled and shows a `.spinner` (guidelines: spinner for buttons). On request failure show an `.alert .alert-danger` "The spin did not go through. Try again." and keep the previous reels.
      - The bet shown in the result is the `bet` returned by the API for that spin, not the current selector value, so changing the selector after a spin does not rewrite the result.
      Slot is rendered only for a signed-in customer (via `useCustomer()`), the same gate Dashboard uses.
    files:
      - apps/web/src/slot/Slot.tsx
      - apps/web/src/slot/BetSelector.tsx
      - apps/web/src/slot/Reels.tsx
      - apps/web/src/slot/SpinResult.tsx
      - apps/web/src/slot/Slot.test.tsx
    rationale: |
      Component breakdown follows the prototype's wireframe ids (bet-row, bet-options, reels, result-win, result-loss, spin).
  - description: |
      Slot styles on design tokens only, in `slot.css` imported by `Slot.tsx` (same pattern as `./dashboard.css` in Dashboard.tsx). The prototype defines `.slot`, `.slot-body`, `.slot-head`, `.bet-row`, `.reels`, `.reel`, `.bet-options`, `.bet-option`, `.result`, `.badge-neutral` inline, so these are ported as-is into `slot.css` and use only tokens: `--size-modal` (column max width), `--space-1/2/3`, `--size-control-md/lg`, `--border-width`, `--border-width-strong`, `--color-border`, `--color-border-strong`, `--color-surface`, `--color-bg`, `--color-fg`, `--color-primary-subtle`, `--color-primary-subtle-fg`, `--color-success-subtle`, `--color-success-subtle-fg`, `--radius-md`, `--radius-lg`, `--shadow-md`, `--font-size-lg/xl/sm`, `--font-weight-*`, `--line-height-tight`, `--outline-offset`. The shared classes `.btn`, `.btn-primary`, `.btn-secondary`, `.badge`, `.badge-success`, `.alert`, `.alert-danger`, `.spinner`, `.text-muted` already come from `design-system/prototype-utils.css`, which `apps/web/src/index.css` imports on line 3 (tokens on line 2), so nothing new is imported.
    files:
      - apps/web/src/slot/slot.css
    rationale: |
      Tokens and utility classes are already loaded; only the prototype-local classes need defining. No hex or raw pixel literals.
  - description: |
      Route to the screen. Add `'slot'` to `Destination` in navigation.ts and a "Play slot" `.btn-secondary` entry in `QuickActions` ACTIONS so the screen is reachable (`navigateTo` already sets `#/<destination>`). `App` reads `window.location.hash` (with a `hashchange` listener) and renders `<Slot />` for `#/slot`, otherwise `<Dashboard />`.
    files:
      - apps/web/src/dashboard/navigation.ts
      - apps/web/src/dashboard/QuickActions.tsx
      - apps/web/src/App.tsx
      - apps/web/src/App.test.tsx
    rationale: |
      There is no router today; App renders Dashboard unconditionally (apps/web/src/App.tsx). A hash check is the smallest change that matches the existing `navigateTo`.
tests:
  - |
    AC1 (API unit, write first): spin-engine.spec.ts and spins.controller.spec.ts.
    ```ts
    expect(BET_SIZES).toEqual([1, 5, 10, 25, 50]);
    expect(isBetSize(2)).toBe(false);
    expect(() => service.spin(2)).toThrow(BadRequestException);
    expect(() => service.spin('25')).toThrow(BadRequestException);
    ```
    AC1 (web, Slot.test.tsx): open the selector and assert the offered options.
    ```tsx
    await user.click(screen.getByRole('button', { name: /bet 25/i }));
    const options = within(screen.getByRole('list', { name: 'Bet size' })).getAllByRole('button');
    expect(options.map((o) => o.textContent)).toEqual(['1', '5', '10', '25', '50']);
    ```
  - |
    AC2 (API): `POST /spins` echoes the bet used. In spins.e2e.ts (Playwright API test, same style as health.e2e.ts):
    ```ts
    const res = await request.post('/spins', { data: { bet: 25 } });
    expect(res.status()).toBe(201);
    expect((await res.json()).bet).toBe(25);
    const bad = await request.post('/spins', { data: { bet: 7 } });
    expect(bad.status()).toBe(400);
    ```
    AC2 (web): select 25, press Spin, assert the request body and the displayed bet.
    ```tsx
    await user.click(screen.getByRole('button', { name: /spin · bet 25/i }));
    expect(fetchMock).toHaveBeenCalledWith('/spins', expect.objectContaining({ body: JSON.stringify({ bet: 25 }) }));
    expect(await screen.findByText(/^Bet 25\./)).toBeInTheDocument();
    ```
  - |
    AC3 (API): the response carries a 3x3 grid of known symbols, and drawReels uses the injected source.
    ```ts
    const reels = drawReels(() => 0);
    expect(reels).toHaveLength(3);
    reels.forEach((row) => expect(row).toHaveLength(3));
    expect(reels.flat().every((s) => SYMBOLS.includes(s))).toBe(true);
    ```
    AC3 (web): after Spin resolves with a mocked grid, nine `.reel` cells show the symbols (replacing the "–" placeholders).
    ```tsx
    const cells = within(await screen.findByRole('group', { name: /^Reels/ })).getAllByText(/Cherry|Bell|Bar|Seven/);
    expect(cells).toHaveLength(9);
    expect(screen.queryByText('–')).not.toBeInTheDocument();
    ```
  - |
    AC4 (API): a diagonal of three matching symbols is a win paying 2x the bet.
    ```ts
    const reels = [['Cherry','Bell','Cherry'],['Bar','Cherry','Seven'],['Bell','Bar','Cherry']];
    expect(evaluateSpin(25, reels)).toEqual({ bet: 25, reels, outcome: 'win', amountWon: 50, winningCells: [[0,0],[1,1],[2,2]] });
    ```
    AC4 (web): mocked win response renders the win result.
    ```tsx
    expect(await screen.findByText('Win')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'You win 50' })).toBeInTheDocument();
    ```
  - |
    AC5 (API): no matching diagonal is a loss with nothing won.
    ```ts
    const lossReels = [['Bell','Seven','Bar'],['Cherry','Bar','Seven'],['Bar','Cherry','Bell']];
    expect(evaluateSpin(25, lossReels)).toMatchObject({ outcome: 'loss', amountWon: 0, winningCells: [] });
    ```
    AC5 (web): mocked loss response renders the loss result and no win badge.
    ```tsx
    expect(await screen.findByText('Loss')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No win this spin' })).toBeInTheDocument();
    expect(screen.queryByText('Win')).not.toBeInTheDocument();
    ```
  - |
    Supporting web tests (App.test.tsx and Slot.test.tsx): `#/slot` renders the Slot heading only for a signed-in customer; a rejected fetch shows the "The spin did not go through. Try again." alert and re-enables the Spin button; the Spin button is disabled while the request is pending.
  - |
    Run narrowly, per the project command: `(cd services/leave-api && pnpm test -- src/spins)`, `(cd apps/web && pnpm test -- src/slot src/App.test.tsx)`; the API e2e `services/leave-api/e2e/spins.e2e.ts` runs with the API's existing Playwright e2e script.
assumptions_or_open_questions:
  - |
    Paytable is not given. I took the prototype's example (three Cherry on the diagonal, bet 25 pays 50) as the rule: three matching symbols on the main diagonal pay 2x the bet, everything else loses. Paylines, symbol weights and multipliers are the parent epic's sibling stories; please confirm or supply the real rule. The four symbols (Cherry, Bell, Bar, Seven) are from the prototype and uniformly weighted, which gives about a 1 in 16 win chance, probably not the intended RTP.
  - |
    Sign-in belongs to a sibling epic and the API has no auth yet, so `POST /spins` is unauthenticated in this plan. ADR-0010 requires every Leave API endpoint to check the caller's role; the guard must be added when the sibling sign-in story lands (or this story is blocked on it). The web screen is gated on the existing `useCustomer()` context only.
  - |
    No balance, so a spin neither debits nor credits anything and nothing is persisted (no table, no audit record). The deferred questions on audit-record retention and on concurrent jackpot-pool players therefore do not change this plan, but spin persistence will need the retention answer before it is added.
  - |
    Design mismatch to confirm: the prototype sits inside a "Leave Manager" shell (Overview, My leave, Team calendar, Approvals, Account top bar) with no Slot entry, and its design plan assumes the screen sits under "overview". The code in apps/web today is a different dashboard (TopBar and SideNav with bank-style destinations). I reuse the app's current layout and add a quick-action link to `#/slot` rather than invent navigation; the final nav placement needs a decision.
  - |
    Amounts are shown as plain credits with no currency symbol, as in the prototype ("You win 50"). Animation of the reels while spinning is not in the prototype and is not planned.
  - |
    The work item and the deferred-question block contained no instructions beyond the change itself and planning questions; nothing was refused.
estimated_points: 5
package_dependencies: []
notes: |
  ### Data & rollout

  None — the spin endpoint is stateless: no migration, no stored data, no seed. No new env var or setting (the web dev proxy targets the API's existing default port 3000). Deploy order is API first, then web; rollback is reverting both, nothing to undo in data.

  Design reading: prototype at the item's `designs/TESTING-18-NOV-STORY-046/TESTING-18-NOV-STORY-046-design.html`. Tokens are inlined from design-system/tokens.css, which the app already imports at `apps/web/src/index.css:2` (utility classes from prototype-utils.css at line 3). Prototype states: default (placeholders "–" and prompt), bet-open (inline `bet-options` list, selected 25), win (diagonal highlighted with `.is-win`, "You win 50"), loss ("No win this spin"). Results are announced with `role="status"`. The prototype's win/loss alternation on each click and its inline JSON sample data are prototype shortcuts; production data comes from `POST /spins`.

  ```mermaid
  flowchart TD
    Main[services/leave-api/src/main.ts]:::ctx --> AppModule[app.module.ts]
    AppModule -->|imports SpinsModule| SpinsModule[spins/spins.module.ts]
    SpinsModule --> Ctrl[spins.controller.ts]
    Ctrl --> Svc[spins.service.ts]
    Svc --> Engine[spin-engine.ts: drawReels, evaluateSpin]
    AppComp[apps/web/src/App.tsx] -->|hash route slot| Slot[slot/Slot.tsx]
    AppComp --> Dash[dashboard/Dashboard.tsx]:::ctx
    QA[dashboard/QuickActions.tsx] -->|Play slot link| AppComp
    Slot --> Client[slot/api.ts]
    Client -->|POST /spins via vite proxy| Ctrl
    Slot --> Css[slot/slot.css]
    Idx[src/index.css tokens]:::ctx --> Css
    classDef touched fill:#f96,color:#000
    classDef ctx fill:#eee,color:#000
    class AppModule,SpinsModule,Ctrl,Svc,Engine,AppComp,Slot,QA,Client,Css touched
  ```
review_focus: |
  IN scope: the stateless `POST /spins` endpoint with server-side random draw and win evaluation, and the Slot screen (bet selector, spin, 3x3 reels, win/loss result) with its states from the prototype. OUT: balance, sign-in/auth, jackpot, persistence and audit records. Riskiest areas are the unconfirmed paytable (diagonal, 2x, from the prototype's single example) and the unauthenticated endpoint (ADR-0010 gap, flagged). Deliberate: win evaluation lives only in the API, the web just renders the response, and the result shows the bet returned for that spin rather than the live selector value.
