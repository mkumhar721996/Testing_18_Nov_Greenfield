summary: |
  Add a public, read-only service catalog. The Leave API (comp_leave_api, NestJS) gets an unauthenticated
  `GET /service-categories` endpoint that returns the categories held in a release-time catalog data file
  (id, name, description only, never a price). The Web App (comp_web_app, React + Vite) gets a `#/catalog`
  page, built from the approved prototype, that fetches that endpoint and renders a responsive grid of
  category cards, plus the loading, error (with "Try again") and empty ("No service categories are available
  right now.") states. It renders outside the signed-in Dashboard, so no sign-in prompt appears. New
  categories are added by editing the catalog data file at release; there is no create/edit/delete
  endpoint or screen. Prices are out of scope (owned by Pricing, Quotes and Payment Records).

scope:
  - description: |
      API catalog data file, the single place a release adds a category. Exports the shape and the four
      starting categories (copy taken from the prototype's `catalog-data` JSON):

      ```ts
      export interface ServiceCategory { id: string; name: string; description: string }
      export const CATALOG_DATA = 'CATALOG_DATA';
      export const CATALOG_CATEGORIES: ServiceCategory[] = [
        { id: 'plumbing', name: 'Plumbing', description: 'Leaks, blocked drains, taps, toilets, water heaters and pipe repairs.' },
        { id: 'electrical', name: 'Electrical', description: 'Wiring faults, socket and switch replacement, lighting and fuse board checks.' },
        { id: 'cleaning', name: 'Cleaning', description: 'Home and office cleaning, deep cleaning, and end-of-tenancy cleaning.' },
        { id: 'appliance-repair', name: 'Appliance repair', description: 'Repairs for washing machines, fridges, ovens and other home appliances.' },
      ];
      ```
      A `.ts` module (not JSON) is used because services/leave-api/tsconfig.json has no
      `resolveJsonModule` and `nest build` would not copy a JSON asset into dist.
    files:
      - services/leave-api/src/catalog/catalog.data.ts
    rationale: |
      AC1, AC2, AC4, AC6. Catalog data is code-reviewed release data, so no admin screen or DB is needed (item scope).
  - description: |
      API service, controller and module. The service receives the data through an injection token so tests
      can supply an empty or five-item list; the controller exposes one GET route and no write routes.

      ```ts
      @Injectable()
      export class CatalogService {
        constructor(@Inject(CATALOG_DATA) private readonly categories: ServiceCategory[]) {}
        list(): { categories: ServiceCategory[] } {
          return { categories: this.categories.map(({ id, name, description }) => ({ id, name, description })) };
        }
      }

      @Controller('service-categories')
      export class CatalogController {
        constructor(private readonly catalog: CatalogService) {}
        @Get() list() { return this.catalog.list(); }
      }
      ```
      Providers: `{ provide: CATALOG_DATA, useValue: CATALOG_CATEGORIES }`, `CatalogService`. Register
      `CatalogModule` in `AppModule.imports`. No guard is applied (public), no POST/PUT/PATCH/DELETE handler exists.
      The explicit field mapping in `list()` guarantees no stray field (for example a price added to the data
      later) leaks out.
    files:
      - services/leave-api/src/catalog/catalog.service.ts
      - services/leave-api/src/catalog/catalog.controller.ts
      - services/leave-api/src/catalog/catalog.module.ts
      - services/leave-api/src/app.module.ts
    rationale: |
      ADR-0001 (Web App talks only to the Leave API). AC3 (no auth), AC5 (read-only), AC6 (no price), AC7 (empty list is a valid 200).
  - description: |
      Web API client. `fetchServiceCategories(signal?)` GETs `${import.meta.env.VITE_API_BASE_URL ?? ''}/service-categories`,
      throws on a non-2xx response or network failure, and returns `ServiceCategory[]`. Add a Vite dev
      `server.proxy` entry for `/service-categories` to `http://localhost:3000` (the API's default PORT in
      services/leave-api/src/main.ts) so `pnpm dev` works same-origin. Adding `server` does not affect the
      vitest `test` block.
    files:
      - apps/web/src/catalog/api.ts
      - apps/web/vite.config.ts
    rationale: |
      Replaces the prototype's inline `catalog-data` JSON with real data from the API. No credentials are sent.
  - description: |
      Catalog page component `Catalog` with state `{ status: 'loading' | 'error' | 'ready'; categories }`
      (a `useEffect` fetch with abort on unmount; a `retry` handler re-runs the fetch). It renders what the
      prototype's "Service catalog" screen shows, always with one `<h1>Service categories</h1>`:
      - Top bar (`.catalog-topbar`): the "Service catalog" wordmark and a single "Browse services" link with `aria-current="page"`. No sign-in, account or menu control.
      - Loading: `aria-busy="true"` container, intro "Loading service categories…", four `.card` skeletons each with three `.skeleton` bars.
      - Ready with items: intro "Pick the kind of help you need. Each category shows what it covers." and a `.grid` with `role="list"` of `.card.stack.catalog-category` items (`role="listitem"`), each an `<h3 class="card-title">` name plus a `<p>` description. Cards are information only (no link, no price, no buttons).
      - Ready with zero items: `.empty-state` with `<h3>No service categories are available right now.</h3>` and `<p class="text-muted">Check back soon.</p>`.
      - Error: `.alert.alert-danger` with `role="alert"` ("We couldn't load the service categories. Check your connection and try again.") and a `.btn.btn-secondary` "Try again"; while retrying the button is disabled and reads "Loading categories…".
    files:
      - apps/web/src/catalog/Catalog.tsx
    rationale: |
      AC1, AC2, AC3, AC6, AC7 plus the loading and error states the design lists.
  - description: |
      Catalog styles on design tokens only. Classes the prototype defines inline are defined here with a
      `catalog-` prefix, because dashboard.css already defines global `.logo` and `.topbar` and a bare name
      would collide. Mapping from the prototype's `<style>` block:
      - `.catalog-topbar` (prototype `.top-bar`): `display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:var(--space-2); padding:var(--space-2) var(--space-3); border-bottom:var(--border-width) solid var(--color-border)`.
      - `.catalog-logo`: `font-size:var(--font-size-md); font-weight:var(--font-weight-bold)`.
      - `.catalog-nav a`: `min-height:var(--size-control-lg); padding:0 var(--space-2); border-radius:var(--radius-md); font-size:var(--font-size-sm); font-weight:var(--font-weight-medium); background:var(--color-primary-subtle); color:var(--color-primary-subtle-fg)`.
      - `.catalog-page`: `max-width:var(--size-content); margin-inline:auto; padding:var(--space-4) var(--space-3) var(--space-6)`; its `h1` uses `font-size:var(--font-size-xl); line-height:var(--line-height-tight)`.
      - `.catalog-intro`: `color:var(--color-fg-muted)`.
      - `.catalog-category`: `border-top:var(--border-width-strong) solid var(--color-primary)`; its `p` uses `font-size:var(--font-size-md)`.
      - `.catalog-skeleton`: flex column with `gap:var(--space-2)`.
      Layout classes `.card`, `.card-title`, `.stack`, `.grid`, `.alert`, `.alert-danger`, `.empty-state`, `.skeleton`, `.btn`,
      `.btn-secondary`, `.text-muted` already load from design-system/prototype-utils.css via apps/web/src/index.css line 3,
      and the tokens via line 2, so no new import is needed. `.grid` is already one column on phones
      (auto-fit minmax). No colour literal or raw px value is used. The skeleton bar widths (40%, 80%) are percentages, not tokens.
    files:
      - apps/web/src/catalog/catalog.css
    rationale: |
      UI guidelines and design-system rules, all values by token name. Single column on phones, content capped at `--size-content`.
  - description: |
      Route the catalog outside the signed-in dashboard. In `App`, read `window.location.hash` (state kept
      current with a `hashchange` listener) and render `<Catalog />` for `#/catalog` BEFORE the customer-dependent
      Dashboard, which today returns null without a customer (apps/web/src/dashboard/Dashboard.tsx line 17). Other
      hashes keep today's behaviour (the existing `navigateTo` writes `#/<destination>`; none of those equals `catalog`).
      Both existing App tests keep passing.
    files:
      - apps/web/src/App.tsx
    rationale: |
      AC3 (no sign-in) and AC5 (no create/edit/delete control: none is rendered anywhere on this route).

tests:
  - |
    AC1 (API unit, write first). File services/leave-api/src/catalog/catalog.service.spec.ts:
    ```ts
    const service = new CatalogService(CATALOG_CATEGORIES);
    expect(service.list().categories.map((c) => c.name)).toEqual(
      ['Plumbing', 'Electrical', 'Cleaning', 'Appliance repair'],
    );
    ```
    Plus in catalog.data.spec.ts, a guard for release data: ids are unique, and every entry has a non-empty name and description.
  - |
    AC2 (API unit). Every listed category carries its description:
    ```ts
    for (const c of service.list().categories) expect(c.description.trim().length).toBeGreaterThan(0);
    expect(service.list().categories[0]).toEqual({
      id: 'plumbing', name: 'Plumbing',
      description: 'Leaks, blocked drains, taps, toilets, water heaters and pipe repairs.',
    });
    ```
  - |
    AC3 (API e2e plus web). services/leave-api/e2e/catalog.e2e.ts sends no Authorization header:
    ```ts
    const res = await request.get('/service-categories');
    expect(res.status()).toBe(200);
    expect((await res.json()).categories).toHaveLength(4);
    ```
    Web, Catalog.test.tsx renders `<Catalog />` with NO CustomerContext provider and a stubbed `fetch`, then asserts
    `expect(screen.queryByText(/sign in|log in/i)).not.toBeInTheDocument()` and that the four cards render.
    App.test.tsx adds: with `window.location.hash = '#/catalog'` and no customer, `screen.getByRole('heading', { level: 1, name: 'Service categories' })` is present.
  - |
    AC4 (API unit plus web). A release adds a category by data only. API:
    ```ts
    const five = [...CATALOG_CATEGORIES, { id: 'pest-control', name: 'Pest control', description: 'Ants, cockroaches, rodents and termites, with a follow-up visit where needed.' }];
    expect(new CatalogService(five).list().categories.map((c) => c.id)).toContain('pest-control');
    ```
    Web: stub fetch to return five categories and assert `expect(await screen.findByRole('heading', { level: 3, name: 'Pest control' })).toBeInTheDocument()` and `expect(screen.getAllByRole('listitem')).toHaveLength(5)`, with no change to Catalog.tsx.
  - |
    AC5 (API e2e plus web). API, services/leave-api/e2e/catalog.e2e.ts:
    ```ts
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const res = await request[method]('/service-categories', { data: {} });
      expect(res.status()).toBe(404);
    }
    ```
    Web, in Catalog.test.tsx, with categories loaded:
    `expect(screen.queryByRole('button', { name: /add|create|edit|delete|remove|new/i })).not.toBeInTheDocument()` and `expect(screen.queryByRole('textbox')).not.toBeInTheDocument()`.
  - |
    AC6 (API unit plus web). The payload has only id, name and description, even if a data entry carries an extra field:
    ```ts
    const withPrice = [{ id: 'x', name: 'X', description: 'd', price: 99 } as ServiceCategory];
    expect(Object.keys(new CatalogService(withPrice).list().categories[0]).sort()).toEqual(['description', 'id', 'name']);
    ```
    Web: `expect(document.body.textContent).not.toMatch(/[$€£₹]|\bprice\b|\bfrom \d/i)` after the four cards render.
  - |
    AC7 (API unit plus web). API: `expect(new CatalogService([]).list()).toEqual({ categories: [] })`. Web, fetch stubbed to
    `{ categories: [] }`:
    ```ts
    expect(await screen.findByText('No service categories are available right now.')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    ```
  - |
    Loading and error states from the design (Catalog.test.tsx). Loading: fetch left pending, then
    `expect(screen.getByText('Loading service categories…')).toBeInTheDocument()` and the container has `aria-busy="true"`.
    Error: fetch rejects, then `expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load the service categories.")`;
    click "Try again" with fetch now resolving four categories and assert the alert is gone and 'Plumbing' is shown.
    api.test.ts: a non-2xx response makes `fetchServiceCategories()` reject.
  - |
    Web e2e (Playwright, apps/web/e2e/catalog.spec.ts), using `page.route('**/service-categories', ...)` to answer the preview build:
    at 375px wide, `await page.goto('/#/catalog')` shows the four category names, the page has no horizontal overflow
    (same `scrollWidth - clientWidth <= 0` check as app.spec.ts), and the page contains no "Sign in" text.
  - |
    Narrow verification commands (derived from the project test command, runner kept, paths narrowed):
    `(cd services/leave-api && pnpm test -- src/catalog)`, `(cd apps/web && pnpm test -- src/catalog src/App.test.tsx)`,
    then `(cd services/leave-api && pnpm e2e)` and `(cd apps/web && pnpm e2e)`.

assumptions_or_open_questions:
  - |
    Catalog data lives in a TypeScript module in the API, not in PostgreSQL. No database client or migration exists in
    services/leave-api yet (package.json has only NestJS, reflect-metadata, rxjs), and the item says categories are added
    "at release time via catalog data". If the team wants a DB table plus a seed migration instead, that is a larger change
    and needs a decision before code is written.
  - |
    Project mismatch to confirm: the architecture documents describe "Leave Manager" (leave, balances, approvals, Entra ID SSO),
    while this item, the existing dashboard (a "Bank Application" template) and the prototype describe a home-services
    marketplace. I followed the item and the prototype for behaviour, and the confirmed stack (NestJS API, React + Vite web,
    vitest, Playwright, pnpm) for tooling. ADR-0005 (Entra ID SSO for all users) and ADR-0010 (every endpoint checks the caller's
    role) conflict with an unauthenticated endpoint. AC3 explicitly requires no sign-in, so the endpoint is public and only
    exposes non-personal catalog text. A reviewer should confirm that exception.
  - |
    Entry point: the item only says a visitor "opens the catalog". I route it at `#/catalog` and add no nav link, because the
    existing dashboard navigation (apps/web/src/dashboard/navigation.ts) has no catalog destination and the UI guidelines list
    Leave Manager sections only. Where a signed-out visitor lands on `/`, and any link to the catalog from the dashboard, are not
    decided here.
  - |
    The prototype conflicts with the UI guidelines on headings: it uses h1 on the default and empty states but h2 on the new-category,
    loading and error states. The guidelines say one `font-size-xl` page title per screen, so every state renders the same h1.
  - |
    The prototype's retry toast ("Still unable to reach the catalog...") is a prototype shortcut. Production "Try again" re-fetches and
    shows the error alert again on failure, with no toast. The prototype's "addedAtRelease" JSON block only illustrates the release path
    and is not shipped as data.
  - |
    Web-to-API addressing: `VITE_API_BASE_URL` (default empty, meaning same-origin) with a dev proxy. If production serves web and API
    on different origins, the API also needs CORS enabled in services/leave-api/src/main.ts. I have not added it, since the deployed
    topology (ADR-0008) is not in the repository. Please confirm same-origin routing or ask for CORS.
  - |
    Not addressed here, because they do not constrain a small static list: the deferred questions on search response time and visitor
    load (epic 028, belongs to provider search) and on data retention and address privacy (CHORE-049, the catalog stores no personal data).
  - |
    Category cards are information only. Filtering providers by category is a later story (the prototype notes story 051), so cards have no link.

estimated_points: 5

package_dependencies: []

notes: |
  ### Data & rollout

  - **Existing data**: None — no database table, migration or stored data changes. Catalog data is a code module.
  - **Backfill / seed**: None. The four starting categories ship in `catalog.data.ts`; nothing to run, nothing to re-run.
  - **Settings**: one optional build-time variable for the web app, `VITE_API_BASE_URL`. Default is unset, which means same-origin
    requests, so it is safe when unset. It is documented in a comment at the top of `apps/web/src/catalog/api.ts`. No new API settings.
  - **Provisioning**: nothing to create. The API route needs no role, bucket or flag.
  - **Order and rollback**: deploy the API first (new route only), then the web app. Rolling back the web app leaves an unused public
    route; rolling back the API makes the page show its error state. Both are safe to revert independently. To add a category at release,
    append one entry to `CATALOG_CATEGORIES` and ship; the `catalog.data.spec.ts` guard checks uniqueness and non-empty text.

  ### Design source

  Read in full: the approved prototype TESTING-18-NOV-STORY-050-design.html (screen "Service catalog" with states default, new-category,
  loading, error, empty), its inlined tokens.css and prototype-utils.css, and the design-system/ folder listing. The app already loads
  tokens and utilities in apps/web/src/index.css lines 2-3 (`@import '../../../design-system/tokens.css'` and `prototype-utils.css`), and
  main.tsx line 5 imports index.css, so no new token import is needed. Tailwind is loaded on line 1 but this page styles with the design
  system classes and tokens, matching dashboard.css.

  ### Layering

  ```mermaid
  flowchart TD
    main[main.tsx] --> App[App.tsx]
    App -->|hash catalog route before Dashboard| Catalog[catalog/Catalog.tsx]
    App --> Dashboard[dashboard/Dashboard.tsx]
    Catalog --> Api[catalog/api.ts]
    Catalog --> Css[catalog/catalog.css]
    Css -.uses tokens.-> Tokens[design-system/tokens.css via index.css]
    Api -->|GET /service-categories| Ctrl[catalog.controller.ts]
    Ctrl --> Svc[catalog.service.ts]
    Svc --> Data[catalog.data.ts]
    Mod[catalog.module.ts] --> Ctrl
    AppMod[app.module.ts] --> Mod
    Vite[vite.config.ts dev proxy] -.-> Api
    classDef touched fill:#f96,color:#000
    class App,Catalog,Api,Css,Ctrl,Svc,Data,Mod,AppMod,Vite touched
  ```

  Orange nodes are created or modified: App.tsx (route), Catalog/api/css (new page), vite.config.ts (dev proxy), and the API catalog
  module wired through app.module.ts. Dashboard.tsx, main.tsx and the tokens are untouched context.

review_focus: |
  IN scope: a public read-only `GET /service-categories` in the Leave API (data from a release-time TS module, only id, name and
  description) and a `#/catalog` page in the Web App with default, loading, error and empty states. OUT: prices, provider listings,
  search and filtering, any create/edit/delete endpoint or screen, DB storage, dashboard navigation changes. Riskiest part is the
  App routing: the catalog must render before the Dashboard's `if (!customer) return null` without changing existing App tests.
  Deliberate choices to not flag: the endpoint is unauthenticated (AC3 overrides ADR-0005/0010 for this one read), the explicit field
  mapping in `CatalogService.list()` is the guard against leaking a price, and `catalog-` prefixed CSS avoids collisions with dashboard.css.
