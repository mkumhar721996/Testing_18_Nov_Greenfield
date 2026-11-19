summary: |
  Add public provider listings: a read-only `GET /providers` endpoint in the Leave API (new `providers` Nest module, mirroring the existing `catalog` module) that returns each provider's name, services, towns and average rating, already ordered best-rated first (equal ratings A-Z, unrated providers last A-Z) and never carrying a price or availability field; plus a `#/providers` page in the web app that renders one card per provider as in the approved "Provider results" prototype, with loading, error and empty states. Ordering lives in one pure function in the API so the web app holds no business rules (ADR-0001). Search/filtering by service and town, availability, prices and the review-submission flow are other stories and stay out.
scope:
  - description: |
      API provider data and ordering. Create `providers.data.ts` with the types and a release-time seed list (same pattern as `catalog.data.ts`):

      ```ts
      export interface RatingSummary { average: number; count: number }
      export interface Provider {
        id: string;
        name: string;
        services: string[];
        towns: string[];
        rating: RatingSummary | null; // null = no ratings yet
      }
      export const PROVIDERS_DATA = 'PROVIDERS_DATA';
      ```
      The seed list uses the five providers shown in the prototype (Asha Plumbing Co. 4.9/124, Bright Spark Electrical 4.7/58, Cedar Home Services 4.7/31, Anand Fix-It and Dev Appliance Care unrated).

      Create `providers.service.ts`:

      ```ts
      export interface ProviderListing { id: string; name: string; services: string[]; towns: string[]; averageRating: number | null; reviewCount: number }
      export function compareProviders(a: Provider, b: Provider): number
      @Injectable() export class ProvidersService { list(): { providers: ProviderListing[] } }
      ```
      `compareProviders`: rated before unrated; both rated -> higher `rating.average` first; equal average (or both unrated) -> `a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })`. `list()` maps explicitly to `ProviderListing` (copy arrays, drop everything else) so a stray `price` or `availability` field in the data never reaches the response, like `CatalogService.list()`. A provider with `rating` of null or `count` 0 is treated as unrated.
    files:
      - services/leave-api/src/providers/providers.data.ts
      - services/leave-api/src/providers/providers.service.ts
    rationale: |
      AC1, 2, 3, 4, 5, 6, 7. One pure comparator keeps the ordering rules testable and in the API (ADR-0001, ADR-0002 keep rules out of the web app).
  - description: |
      API wiring. Add `ProvidersController` (`@Controller('providers')`, `@Get() list()` returning `this.providers.list()`), `ProvidersModule` (provides `{ provide: PROVIDERS_DATA, useValue: PROVIDERS }` and `ProvidersService`) and import the module in `app.module.ts`. Public and read-only, same as the catalog controller.
    files:
      - services/leave-api/src/providers/providers.controller.ts
      - services/leave-api/src/providers/providers.module.ts
      - services/leave-api/src/app.module.ts
    rationale: Exposes the listings to the web app; the catalog is already public and this follows its shape.
  - description: |
      Web API client. In `apps/web/src/providers/api.ts` add

      ```ts
      export interface ProviderListing { id: string; name: string; services: string[]; towns: string[]; averageRating: number | null; reviewCount: number }
      export async function fetchProviders(signal?: AbortSignal): Promise<ProviderListing[]>
      ```
      It GETs `${import.meta.env.VITE_API_BASE_URL ?? ''}/providers`, throws on a non-ok response and returns `body.providers` in the order received (the client never re-sorts).
    files:
      - apps/web/src/providers/api.ts
    rationale: Same fetch pattern as `apps/web/src/catalog/api.ts`, so the base-URL setting is reused.
  - description: |
      Web page `Providers.tsx`, built from the approved prototype screen "Provider results". Structure to reproduce: top bar (`.top-bar`, strong "Service catalog" logo) then `main.page` with a `.head` holding an `h1` and the sort note "Best rated first. Providers with no ratings yet are listed last, A-Z."; the default state is a `.list` (`role="list"`, `aria-label="Providers, best rated first"`) of `.card.listing` (`role="listitem"`), each with `.listing-main` (`h2` name, `span` "Covers: ..." joined by ", ", `span` "Towns: ...") and `.listing-rating`: for a rated provider `span.badge.badge-success` containing the star icon (`#i-star`, `fill: currentColor`) and "4.9 average", then `small` "(124 reviews)"; for an unrated provider `span.chip` "No ratings yet". Render the array in API order. States from the prototype: loading = `aria-busy`, "Loading providers..." text plus three `.card` skeleton blocks (`.skeleton` at 40%/70%/55% width); error = `.alert.alert-danger[role=alert]` "We couldn't load the providers. Check your connection and try again." and a `.btn.btn-secondary` "Try again" that reloads; empty = `.empty-state` with `h3` "No providers match this service and town yet." and "Try another town or a different service." (the prototype's "Change service or town" button is NOT built: it leads to the separate search story). The component shows no price and no availability anywhere. Follow `Catalog.tsx` for the load/abort/retry hook.

      Styles go in `providers.css` using only tokens, as the prototype defines them: `.top-bar` (flex, `--space-2`/`--space-3` padding, bottom border `--border-width` `--color-border`), `.page` (`max-width: var(--size-content)`, padding `--space-4` `--space-3` `--space-6`), `.head` (gap `--space-1`, margin-bottom `--space-3`, `p` in `--color-fg-muted`), `.list` (gap `--space-3`), `.listing` (flex-wrap, space-between, gap `--space-3`), `.listing-main` (column, gap `--space-1`, `flex: 1 1 16rem`; `h2` `--font-size-lg`; `span` `--color-fg-muted` `--font-size-sm`), `.listing-rating` (column, gap `--space-1`; badge inline-flex gap `--space-1`; `small` `--font-size-xs` `--color-fg-muted`). Prefix the app-owned classes (`providers-topbar`, `providers-page`, `providers-head`, `providers-list`, `providers-listing`...) to match the `catalog-*` convention and avoid clashing with other screens; no colour or pixel literals.
    files:
      - apps/web/src/providers/Providers.tsx
      - apps/web/src/providers/providers.css
    rationale: |
      AC1, 3, 4, 5, 6, 7 on screen, plus the loading/empty/error states the design lists. Rendering in API order keeps the sort rule in one place.
  - description: |
      Routing. In `App.tsx` add `if (hash === '#/providers') return <Providers />` next to the existing public `#/catalog` branch (public, rendered outside the customer context). In `Catalog.tsx` add a second link "Find providers" (`href="#/providers"`) to the `catalog-nav` so the page is reachable.
    files:
      - apps/web/src/App.tsx
      - apps/web/src/catalog/Catalog.tsx
    rationale: The page needs an entry point; the catalog is the public area it belongs to.
tests:
  - |
    AC1 (API, `providers.service.spec.ts`, written first, fails because the service does not exist):
    ```ts
    const asha = service.list().providers[0];
    expect(asha).toEqual({ id: 'asha-plumbing', name: 'Asha Plumbing Co.', services: ['Plumbing', 'Water heater repair'], towns: ['Pune', 'Pimpri-Chinchwad'], averageRating: 4.9, reviewCount: 124 });
    ```
    Web (`Providers.test.tsx`): after `stubFetch`, `expect(await screen.findByRole('heading', { level: 2, name: 'Asha Plumbing Co.' })).toBeInTheDocument(); expect(screen.getByText('Covers: Plumbing, Water heater repair')).toBeInTheDocument(); expect(screen.getByText('Towns: Pune, Pimpri-Chinchwad')).toBeInTheDocument(); expect(screen.getByText(/4\.9 average/)).toBeInTheDocument();`
  - |
    AC2 (API): data given in the order low, high, mid ->
    `expect(new ProvidersService(data).list().providers.map((p) => p.name)).toEqual(['High', 'Mid', 'Low']);`
    Web: the headings in DOM order equal the API response order, e.g. `expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([...])` with a stub that returns the API order (the client does not re-sort).
  - |
    AC3 (API and web): three-plus providers produce separate listings.
    API: `expect(list.providers).toHaveLength(3)`. Web: `expect(await screen.findAllByRole('listitem')).toHaveLength(5)` and each name appears in exactly one listitem: `within(items[0]).getByRole('heading', { name: 'Asha Plumbing Co.' })` while `within(items[0]).queryByText('Bright Spark Electrical')` is null.
  - |
    AC4 (API and web): with a data entry carrying `price: 99` and `availability: 'today'` cast in, `expect(Object.keys(list.providers[0]).sort()).toEqual(['averageRating', 'id', 'name', 'reviewCount', 'services', 'towns']);`. Web: `expect(document.body.textContent).not.toMatch(/[$€£₹]|\bprice\b|\bfrom \d|\bavailab/i)` after the list renders.
  - |
    AC5 (API, `compareProviders` and `list()`): two providers rated 4.7 named 'Cedar Home Services' and 'Bright Spark Electrical', supplied Cedar first:
    `expect(names).toEqual(['Bright Spark Electrical', 'Cedar Home Services']);` Also a case-insensitivity check ('abc' sorts before 'Bcd').
  - |
    AC6 (API): rated 2.0 and unrated 'Aaa' (rating null) plus unrated with `{ average: 0, count: 0 }`:
    `expect(names.indexOf('Rated Low')).toBeLessThan(names.indexOf('Aaa'));` so every unrated provider comes after every rated one even when the rated one has the lowest average. Web: unrated listing shows the text 'No ratings yet' and no 'average' text: `expect(within(item).getByText('No ratings yet')).toBeInTheDocument(); expect(within(item).queryByText(/average/)).toBeNull();`
  - |
    AC7 (API): three unrated providers supplied Zed, Mia, Abe:
    `expect(names).toEqual(['Abe', 'Mia', 'Zed']);`
  - |
    Controller (`providers.controller.spec.ts`, mirroring `app.controller.spec.ts`): `GET /providers` returns `{ providers: [...] }` without an auth header (public). Empty data returns `{ providers: [] }`.
  - |
    Web states (`Providers.test.tsx`): loading shows `screen.getByText('Loading providers…')`; a rejected fetch shows `screen.getByRole('alert')` with "We couldn't load the providers." and clicking "Try again" refetches (`expect(fetch).toHaveBeenCalledTimes(2)`); an empty list shows the heading 'No providers match this service and town yet.' and no "Change service or town" button. `fetchProviders` in `api.test.ts` returns `body.providers` and throws on `ok: false`.
  - |
    Routing (`App.test.tsx`): setting `window.location.hash = '#/providers'` renders the providers page heading and does not render the Dashboard.
  - |
    Narrow run commands: `cd services/leave-api && pnpm test -- src/providers` and `cd apps/web && pnpm test -- src/providers src/App.test.tsx`.
assumptions_or_open_questions:
  - |
    Deferred question, how the average rating stays current when Reviews & Notifications adds reviews. Nothing in the repo reads reviews or has a provider store yet (I listed `services/leave-api/src` and `apps/web/src`: only the catalog module exists). This plan therefore reads the rating from a `RatingSummary { average, count }` carried on each provider and computes nothing. Because `ProvidersService` reads it per request (no caching), whatever later writes that summary (an event handler or a recomputed column fed by Reviews & Notifications) is reflected on the next request. Reviewer to confirm that the review-driven update belongs to the Reviews & Notifications story.
  - |
    Provider data source. There is no providers table, and the existing catalog uses release-time static data in `catalog.data.ts`. I followed that and seeded the five prototype providers as stand-in data in `providers.data.ts`. The stack names PostgreSQL for the Leave API, so real provider onboarding and storage (and replacing the seed list) is assumed to belong to a later story. Please confirm that shipping seeded providers is acceptable, or say which story creates provider records.
  - |
    Prototype vs scope. The prototype title is "Plumbing providers in Pune" with a "Plumbing · Pune" top-bar note, and the empty state mentions service and town; filtering by service and area is the separate search story (the prototype's own toast says so). This plan renders a neutral `h1` "Providers" and lists all providers, with no filter parameters, and keeps the empty-state copy as designed. Confirm.
  - |
    Tie-break by name uses a case-insensitive English locale compare; an exact-equal name pair falls back to input order (stable sort). No two providers are assumed to share a name.
  - |
    "Unrated" is defined as `rating` null or `count` of 0. The prototype shows the review count "(124 reviews)" beside the rating; it is not required by the ACs but is shown as designed. A count of 1 renders "(1 review)".
  - |
    Project-wide open questions (response time, number of providers and visitors, data retention and address privacy) are not answered by this item. The list is unpaginated and fine for the seed volume; pagination is not planned. The listing exposes no personal data beyond business name, services and towns (ADR-0011).
  - |
    The design's `.top-bar`, `.page`, `.head`, `.list` and `.listing*` rules are defined only in the prototype's inline style, not in `design-system/prototype-utils.css`, so the plan defines them in `providers.css` on the same tokens. `.card`, `.badge`, `.badge-success`, `.chip`, `.alert`, `.empty-state`, `.skeleton` and `.btn*` come from `prototype-utils.css`, which is already loaded (I confirmed `badge`, `chip` and `alert` rules exist there). I did not open the `.empty-state` or `.skeleton` rule bodies, though `Catalog.tsx` already uses both classes.
estimated_points: 5
package_dependencies: []
notes: |
  ### Data & rollout
  None — no database schema, migration, stored data shape, setting or env var changes. Providers are release-time seed data in code (like `catalog.data.ts`); the web app reuses the existing optional `VITE_API_BASE_URL`. Deploy API and web together; to roll back, revert the change (the new endpoint and route are additive and nothing else depends on them).

  The design tokens and `prototype-utils.css` are already loaded by the web app at `apps/web/src/index.css` lines 2-3 (`@import '../../../design-system/tokens.css'` and `prototype-utils.css`), so no token-loading work is needed. Tokens used: `--space-1/2/3/4/6`, `--size-content`, `--border-width`, `--color-border`, `--color-fg-muted`, `--font-size-xs/sm/lg`, `--line-height-tight`.

  Light-theme-only and "Approvals/nav" parts of the UI guidelines do not apply: this is the customer-facing catalog area, and the prototype uses a simple top bar like the existing catalog page.

  ```mermaid
  flowchart TD
    App[App.tsx hash routing]:::touched --> Providers[Providers.tsx]:::touched
    Catalog[Catalog.tsx nav link]:::touched --> App
    Providers --> WebApi[providers/api.ts]:::touched
    WebApi -->|GET /providers| Ctrl[providers.controller.ts]:::touched
    Ctrl --> Svc[providers.service.ts: compareProviders and list]:::touched
    Svc --> Data[providers.data.ts]:::touched
    Mod[providers.module.ts]:::touched --> Ctrl
    AppMod[app.module.ts imports ProvidersModule]:::touched --> Mod
    CatalogMod[catalog module: pattern mirrored]
    AppMod --> CatalogMod
    classDef touched fill:#f96,color:#000
  ```
review_focus: |
  IN: `GET /providers` with the single ordering function (rating desc, name A-Z on ties, unrated last A-Z), the explicit response mapping that keeps price/availability out, and the `#/providers` page with its three non-default states. OUT: search/filter by service or town, availability, prices, review submission and any real provider storage. Riskiest part: the comparator edge cases (unrated defined as null or count 0, case-insensitive names) and the web page not re-sorting. Seeded providers and the generic "Providers" heading are deliberate, flagged under open questions.
