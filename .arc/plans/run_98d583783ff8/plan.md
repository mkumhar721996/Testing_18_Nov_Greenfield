summary: |
  Show the signed-in customer one pre-approved offer tile per offer they are already marked eligible for
  (personal loan, card upgrade) in a "Pre-approved for you" section of the Dashboard, and nothing for an offer
  they are not eligible for (the whole section is absent when neither applies, no placeholder). Pressing Apply
  (personal loan tile) or Check (card upgrade tile) hands off to the application / check journey in
  Offers & applications; the dashboard itself never applies for anything. End to end this is: a Leave API
  endpoint that returns only the caller's eligible offers, and a React offer-tile section that fetches it and
  renders the design's tiles with loading and error handling. The repo is a bare scaffold today, so the
  eligibility source, caller identity and the journey routes are open questions (see below).
scope:
  - description: |
      Load the design system once in the web app. apps/web/src/index.css currently holds only
      `@import 'tailwindcss';` (line 1) and nothing loads design-system/tokens.css. Add, after it:
      `@import '../../../design-system/tokens.css';` and `@import '../../../design-system/prototype-utils.css';`
      (the latter defines .card, .btn, .btn-primary, .btn-secondary, .spinner, .skeleton, and .alert classes the prototype uses). Add the offer-section styles from the prototype on tokens only (see next item).
      If the Vite dev server rejects the out-of-root import, add `server.fs.allow` for the repo root in vite.config.ts.
    files:
      - apps/web/src/index.css
      - apps/web/vite.config.ts
    rationale: The prototype's classes come from design-system/; the app loads no tokens yet, so this is added once, next to the Tailwind import.
  - description: |
      Leave API: eligibility port, service, controller. TDD order: write the specs first.

      ```ts
      // services/leave-api/src/offers/offers.types.ts
      export type OfferType = 'personal-loan' | 'card-upgrade';
      export interface EligibleOffer { type: OfferType; headline?: string }
      export interface OfferEligibilityRepository {
        findEligibleOffers(customerId: string): Promise<EligibleOffer[]>;
      }
      export const OFFER_ELIGIBILITY_REPOSITORY = Symbol('OFFER_ELIGIBILITY_REPOSITORY');

      // offers.service.ts
      listForCustomer(customerId: string): Promise<{ offers: EligibleOffer[] }>

      // offers.controller.ts
      @Get('offers') list(@CustomerId() customerId: string)
      ```
      The service returns ONLY offers the record marks eligible, de-duplicated and in a stable order
      (personal-loan, then card-upgrade). The controller reads the signed-in customer's id from the request
      (never from a query/path parameter, so one customer cannot read another's offers, ADR-0010) and logs no
      personal data (ADR-0011). Register OffersModule in AppModule.
    files:
      - services/leave-api/src/offers/offers.types.ts
      - services/leave-api/src/offers/offers.service.ts
      - services/leave-api/src/offers/offers.controller.ts
      - services/leave-api/src/offers/offers.module.ts
      - services/leave-api/src/offers/offers.service.spec.ts
      - services/leave-api/src/offers/offers.controller.spec.ts
      - services/leave-api/src/app.module.ts
    rationale: ADR-0001 keeps business rules (who is eligible) in the API; the web app only renders what the API returns.
  - description: |
      Web: typed API client and hook.

      ```ts
      // apps/web/src/offers/offersApi.ts
      export type OfferType = 'personal-loan' | 'card-upgrade'
      export interface EligibleOffer { type: OfferType; headline?: string }
      export async function fetchEligibleOffers(signal?: AbortSignal): Promise<EligibleOffer[]>  // GET /offers
      ```
      Rejects on a non-2xx response so the section can show its error state.
    files:
      - apps/web/src/offers/offersApi.ts
      - apps/web/src/offers/offersApi.test.ts
    rationale: Single place that talks to the Leave API for offers (ADR-0001).
  - description: |
      Web: PreApprovedOffers section component, built from the approved prototype's `#offers` block
      (data-wf-id pre-approved-offers): an `<h2>` "Pre-approved for you" (font-size-md, margin-bottom space-2),
      then `.offer-tiles` (grid, gap space-3, `repeat(auto-fit, minmax(min(100%, var(--size-menu)), 1fr))`,
      so single column on phones). Each tile is `.card.offer-tile` (flex column, gap space-2, items start,
      overflow-wrap anywhere; cards are never nested) with `<h3>` title, `.amount` line
      (font-size-lg, bold; shows `headline` when the API provides one), a muted font-size-sm description, and
      one button with `min-height: var(--size-control-lg)` pushed to the bottom (margin-top auto).
      Personal loan tile: title "Personal loan", button `.btn.btn-primary` "Apply" (data-wf-id apply-personal-loan).
      Card upgrade tile: title "Platinum card upgrade", button `.btn.btn-secondary` "Check" (data-wf-id check-card-upgrade).
      (Only one btn-primary per view is the guideline; the design gives the loan tile the primary button, kept as designed,
      and the dashboard's own quick-action primary belongs to the frame story, flagged below.)
      While pressing, the button is disabled and shows `.spinner` + "Opening…" (design behaviour), then calls
      `onStartJourney`. Loading: render nothing visible for the section beyond a `.skeleton` tile row using
      `--color-skeleton`, `--radius-sm`, `--space-3`; no layout jump. Error: `.alert.alert-danger` role="alert" with
      "We couldn't load your offers." and a `.btn.btn-secondary` "Try again" (offers are optional, so this does
      not block the rest of the dashboard). Zero offers: return null (no heading, no placeholder, per the design).

      ```tsx
      export type Journey = 'apply' | 'check'
      export interface PreApprovedOffersProps {
        load?: (signal?: AbortSignal) => Promise<EligibleOffer[]>   // defaults to fetchEligibleOffers
        onStartJourney?: (offer: OfferType, journey: Journey) => void // defaults to navigateToOffersJourney
      }
      export function navigateToOffersJourney(offer: OfferType, journey: Journey): void
      ```
      navigateToOffersJourney does `window.location.assign(`/offers-applications/${journey}?offer=${offer}`)` as the
      single hand-off point (route is an assumption, see open questions). Mount `<PreApprovedOffers />` in App.tsx
      below the existing heading, keeping the "Web App" heading so the existing App test and e2e still pass.
      Styles: add the `.offers`, `.offer-tiles`, `.offer-tile`, `.amount` rules from the prototype to index.css,
      using only tokens (--space-2, --space-3, --size-menu, --size-control-lg, --font-size-md, --font-size-lg,
      --font-weight-bold). Light theme only; content stays within --size-content.
    files:
      - apps/web/src/offers/PreApprovedOffers.tsx
      - apps/web/src/offers/PreApprovedOffers.test.tsx
      - apps/web/src/offers/offerCopy.ts
      - apps/web/src/App.tsx
      - apps/web/src/App.test.tsx
      - apps/web/src/index.css
    rationale: Implements the prototype's offers section; copy per offer type is presentation, eligibility and amounts come from the API.
  - description: |
      Playwright coverage. API e2e: GET /offers returns only the eligible offers for the seeded customer.
      Web e2e: with `page.route('**/offers', ...)` stubbed to each of the four eligibility sets, the matching
      tiles show and Apply / Check navigate to the Offers & applications route.
    files:
      - services/leave-api/e2e/offers.e2e.ts
      - apps/web/e2e/offers.spec.ts
    rationale: Stack mandates Playwright for e2e at both layers.
tests:
  - |
    AC1 (personal loan tile shown). Web, apps/web/src/offers/PreApprovedOffers.test.tsx:
    ```tsx
    render(<PreApprovedOffers load={async () => [{ type: 'personal-loan' }]} />)
    expect(await screen.findByRole('heading', { name: 'Personal loan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
    ```
    API, offers.service.spec.ts:
    ```ts
    repo.findEligibleOffers.mockResolvedValue([{ type: 'personal-loan' }])
    expect(await service.listForCustomer('c1')).toEqual({ offers: [{ type: 'personal-loan' }] })
    ```
  - |
    AC2 (card upgrade tile shown):
    ```tsx
    render(<PreApprovedOffers load={async () => [{ type: 'card-upgrade' }]} />)
    expect(await screen.findByRole('heading', { name: 'Platinum card upgrade' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check' })).toBeInTheDocument()
    ```
    API: the same service spec with `[{ type: 'card-upgrade' }]`.
  - |
    AC3 (no personal loan tile when not eligible):
    ```tsx
    render(<PreApprovedOffers load={async () => [{ type: 'card-upgrade' }]} />)
    await screen.findByRole('heading', { name: 'Platinum card upgrade' })
    expect(screen.queryByRole('heading', { name: 'Personal loan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument()
    ```
    API: repo returns `[]` or only card-upgrade, `expect(result.offers.map(o => o.type)).not.toContain('personal-loan')`.
  - |
    AC4 (no card upgrade tile when not eligible): mirror of AC3 with `[{ type: 'personal-loan' }]`;
    `expect(screen.queryByRole('heading', { name: 'Platinum card upgrade' })).not.toBeInTheDocument()`.
    Also the neither case: `load={async () => []}` gives `expect(screen.queryByRole('heading', { name: 'Pre-approved for you' })).not.toBeInTheDocument()`
    (section absent, no placeholder), and the API returns `{ offers: [] }`.
  - |
    AC5 (Apply starts the application journey):
    ```tsx
    const onStartJourney = vi.fn()
    render(<PreApprovedOffers load={async () => [{ type: 'personal-loan' }]} onStartJourney={onStartJourney} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Apply' }))
    expect(onStartJourney).toHaveBeenCalledWith('personal-loan', 'apply')
    ```
    Playwright: `await page.getByRole('button', { name: 'Apply' }).click(); await expect(page).toHaveURL(/offers-applications\/apply\?offer=personal-loan/)`.
  - |
    AC6 (Check starts the check journey):
    ```tsx
    fireEvent.click(await screen.findByRole('button', { name: 'Check' }))
    expect(onStartJourney).toHaveBeenCalledWith('card-upgrade', 'check')
    ```
    Playwright: URL matches `/offers-applications\/check\?offer=card-upgrade/`.
  - |
    Supporting states and API guards (written first, fail first):
    `load` rejecting renders `expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your offers.")` and
    Try again re-calls `load`; while pending the section shows a skeleton and no tile.
    offersApi.test.ts: `expect(fetchEligibleOffers()).rejects.toThrow()` on a 500.
    offers.controller.spec.ts: the controller passes the request's customer id, never a client-supplied one, to
    `service.listForCustomer`; one customer's eligibility never appears in another's response.
    Narrow commands: `(cd apps/web && pnpm vitest run src/offers)` and
    `(cd services/leave-api && pnpm vitest run src/offers)`; e2e via `pnpm e2e` in each package.
assumptions_or_open_questions:
  - |
    BLOCKER, eligibility source. The item says eligibility "comes from the customer record", but I searched the
    repo (grep for offer, eligib, dashboard, customer outside node_modules) and found no customer table, no
    database driver or migration setup in services/leave-api, and no data layer. This plan builds against an
    OfferEligibilityRepository port and tests it with a fake. Which store holds the eligible flags (for example a
    customer_offer_eligibility table in the shared PostgreSQL, with its migration and seed), and which story
    provides the customer record and DB access? Without that decision production has no real implementation of
    the port, and I have not invented fixture data.
  - |
    Caller identity. No sign-in or auth guard exists in the repo (ADR-0005 says Entra ID SSO). The endpoint needs the
    signed-in customer id from a guard or session that another story provides; the plan assumes a CustomerId
    param decorator reading it from the request.
  - |
    Domain mismatch. The confirmed stack and ADRs describe Leave Manager (leave API, employees), while this story and the
    prototype are a retail banking dashboard (Bank Application, loans, cards). I followed the stack and ADRs for
    components, ADR-0001, ADR-0010 and ADR-0011, and the prototype for the UI. Please confirm that is intended.
  - |
    Journey hand-off. Offers & applications belongs to another epic and has no route yet. The plan uses a single
    navigateToOffersJourney function with the assumed URL /offers-applications/{apply|check}?offer={type}. Confirm the
    real route or contract (or whether it opens a drawer or modal, as the UI guidelines suggest for flows).
  - |
    Offer amounts and copy. The prototype shows "Up to ₹ 5,00,000.00" and invented copy. The eligibility record is only a
    flag, so the plan shows an amount line only if the API returns an optional headline. Who supplies the limit and
    the final copy?
  - |
    Dashboard frame not in the repo. The top bar, sidebar, greeting, account cards, and the empty, loading and all-failed
    states belong to STORY-025/026 and are not implemented here (App.tsx is a placeholder heading). This story adds only
    the offers section and mounts it in App.tsx; it will move into the Dashboard frame when that lands. The deferred
    partial-failure decision (per-card "Couldn't load" with Try again) applies to account cards, not offers; offers get
    their own error alert with Try again so one failure never hides the rest.
  - |
    Prototype vs guideline. The UI guidelines say one btn-primary per view, but the design gives the loan tile a primary
    Apply and the card tile a secondary Check, and the frame has a primary Transfer money. I followed the design; the
    frame story may need to reconcile it.
  - |
    The deferred NFR questions (target load time and concurrent users, supported devices and balance freshness, audit
    logging for access to account data) are not answered by this item. The offers section is responsive via the
    auto-fit grid and fetches once per dashboard load; audit logging is out of scope here.
estimated_points: 5
package_dependencies: []
notes: |
  ### Data & rollout
  - **Existing data**: none yet. This plan adds no migration and no table. If the eligibility store decision
    (open question 1) adds a table such as customer_offer_eligibility, its migration must be additive and nullable-safe
    (a customer with no row means not eligible, so existing customers see no tiles), and that story owns it.
  - **Backfill / seed**: none in this plan. Eligibility flags are set by whatever process marks customers eligible.
  - **Settings**: none new. The web app calls the API at the relative path /offers; no env var added.
  - **Provisioning**: the Leave API route needs the sign-in guard from the auth story and an implementation of the
    repository port bound to OFFER_ELIGIBILITY_REPOSITORY before the tiles can ever show.
  - **Order and rollback**: deploy the API first, then the web app. Rollback is safe: the section is additive and
    absent when the API returns no offers, or fails (error alert only in the offers section).

  ### Design system loading
  Today apps/web/src/index.css line 1 is only `@import 'tailwindcss';` and vite.config.ts (plugins react and
  tailwindcss) has no alias for design-system/, so tokens are not loaded; the first scope item adds the import once.
  Token names used were read in design-system/tokens.css via the prototype's inlined copy: --space-2, --space-3,
  --size-menu, --size-control-lg, --font-size-md, --font-size-lg, --font-weight-bold, --color-skeleton, --radius-sm.

  ### Prototype elements built
  Dashboard screen, block data-wf-id pre-approved-offers: heading, offer-personal-loan tile with apply-personal-loan
  (btn-primary), offer-card-upgrade tile with check-card-upgrade (btn-secondary), spinner "Opening…" while handing
  off. The prototype's "Offer eligibility" select and toasts are prototype aids and are NOT built.

  ```mermaid
  flowchart TD
    Browser[PreApprovedOffers.tsx] -->|GET /offers| API[offers.controller.ts]
    API --> Svc[offers.service.ts]
    Svc --> Port[OfferEligibilityRepository port]
    Port -.->|implementation pending, open question 1| Store[(PostgreSQL)]
    App[App.tsx] --> Browser
    Css[index.css] --> DS[design-system/tokens.css]
    AM[app.module.ts] --> API
    Browser -->|Apply / Check| Journey[Offers and applications, other epic]
    classDef touched fill:#f96,color:#000
    class Browser,API,Svc,Port,App,Css,AM touched
  ```
review_focus: |
  Hold the change to the offers section, the GET /offers endpoint and the hand-off function; the dashboard frame, account
  cards, Offers & applications journeys and the eligibility data store are out of scope. The riskiest part is
  access control and the unresolved data source: the endpoint must derive the customer from the signed-in request
  and return only eligible offers, and the repository port has no production implementation until the open question
  is answered, so no fixture data should be shipped. The primary-button choice and the assumed journey route are deliberate and flagged.
