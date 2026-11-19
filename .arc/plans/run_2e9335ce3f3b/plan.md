summary: |
  Turn the public `#/providers` page into the "Find a provider" search from the approved prototype: a Service select and a City-or-town select (town options come only from a new shared town list served by the Leave API), a "Search providers" button, and start / loading / results / empty / error states. Filtering happens in the Leave API (`GET /providers?service=&town=`): a provider matches only when the chosen service AND the chosen town are both among the ones it lists (any of several). The endpoint stays public (no sign-in). Existing ordering and listing-card content (story 052) are reused unchanged.
scope:
  - description: |
      Shared town list (API). New `towns.data.ts` exporting the single source of truth:
      ```ts
      export const TOWNS_DATA = 'TOWNS_DATA';
      export interface Town { id: string; name: string }
      export const TOWNS: Town[] = [ /* Pune, Mumbai, Chennai, Hyderabad, Bengaluru, Delhi, Kolkata, Ahmedabad */ ];
      ```
      plus `TownsService.list(): { towns: Town[] }`, a public read-only `TownsController` at `GET /towns` (same pattern and "public by design" comment as `CatalogController`), and `TownsModule` registered in `AppModule`. Mirrors the catalog module, so adding a town is appending one entry.
    files:
      - services/leave-api/src/towns/towns.data.ts
      - services/leave-api/src/towns/towns.service.ts
      - services/leave-api/src/towns/towns.controller.ts
      - services/leave-api/src/towns/towns.module.ts
      - services/leave-api/src/app.module.ts
    rationale: |
      The item says towns are "picked from the shared list" (AC6) but no shared town list exists in the repo (searched for "town" across the repo: only provider data, provider code and the providers OpenAPI file mention it). It has to be created, and the web select must read it rather than hard-code it.
  - description: |
      Filtering in the providers service, controller and data.
      Before → after:
      ```ts
      list(): { providers: ProviderListing[] }
      list(filter: { service?: string; town?: string } = {}): { providers: ProviderListing[] }
      ```
      A provider matches when `(!service || p.services.includes(service)) && (!town || p.towns.includes(town))` (comparison trimmed and case-insensitive), then the existing `compareProviders` ordering and explicit field mapping are applied unchanged. The controller reads `@Query('service')` and `@Query('town')` (strings only; repeated params take the first) and has no guard, so it stays public. No param = unfiltered list (keeps story 052 behaviour); an unknown service or town returns `{ providers: [] }` (200, never an error).
      Re-seed the release-time stand-in `PROVIDERS` so they are searchable: use the catalog category names (Plumbing, Electrical, Cleaning, Appliance repair) as `services` and towns from the shared list as `towns`, including at least one provider with several of each, one pair that shares a service but not a town, and one pair that shares a town but not a service.
    files:
      - services/leave-api/src/providers/providers.service.ts
      - services/leave-api/src/providers/providers.controller.ts
      - services/leave-api/src/providers/providers.data.ts
      - services/leave-api/openapi/providers.yaml
    rationale: |
      Server-side filtering keeps the web app free of business rules (ADR-0001). The current seed uses services such as "Water heater repair" and towns such as "Hadapsar" that are in neither the catalog nor the shared town list, so a search by catalog service and shared town could never match them. OpenAPI gets the two optional query params and the `/towns` path (add `towns.yaml` or extend `providers.yaml`, same style).
  - description: |
      Web API client. Extend `fetchProviders` and add a towns fetch:
      ```ts
      export async function fetchProviders(filter?: { service: string; town: string }, signal?: AbortSignal): Promise<ProviderListing[]>
      // builds `${base}/providers?service=${encodeURIComponent(s)}&town=${encodeURIComponent(t)}`
      export async function fetchTowns(signal?: AbortSignal): Promise<Town[]> // GET /towns -> body.towns
      ```
      Service options reuse `fetchServiceCategories` from `apps/web/src/catalog/api.ts` (category `name` is the value sent). No sign-in header or credentials are added.
    files:
      - apps/web/src/providers/api.ts
    rationale: The client never re-sorts or re-filters; the API returns the matching, ordered list.
  - description: |
      Search UI per the approved prototype ("Find a provider" screen). Rework `Providers.tsx` into a search page with `status: 'start' | 'loading' | 'ready' | 'empty' | 'error'`:
      - Top bar, `h1` "Find a provider" (font-size-xl), intro "Choose the service you need and the town where the job is. Anyone can search without signing in." (color-fg-muted).
      - A `form.card` (`.search-form`: flex-wrap, `gap: var(--space-3)`, `margin-bottom: var(--space-4)`, fields `flex: 1 1 14rem`, button `min-height: var(--size-control-lg)`) holding two `.field` blocks: label "Service" + `.select#service` (options = category names from `/service-categories`), label "City or town" + `.select#town` with `aria-describedby` hint "Only towns we cover are listed." (`.field-hint`; options = names from `/towns` only), and `.btn.btn-primary` "Search providers" (shows "Searching…" and is disabled while loading). Both selects default to their first option, as in the prototype.
      - Start: dashed `.start-prompt` (`border: var(--border-width) dashed var(--color-border-strong)`, `border-radius: var(--radius-lg)`, `background: var(--color-surface)`, `padding: var(--space-4)`) with "Choose a service and a city or town to see providers who can do the job where you live."
      - Loading: `aria-busy` list, "Searching providers…" and two `.card.stack` with three `.skeleton` bars (40% / 70% / 55%).
      - Results: `.results-head` (`aria-live="polite"`) with `h2` "Plumbing in Pune · 2 providers" (singular "1 provider") and "Best rated first" muted; below it the existing listing cards (name now `h3`, "Covers:", "Towns:", rating badge or "No ratings yet" chip, unchanged from 052) in `role="list"` with `gap: var(--space-3)`.
      - Empty: `.empty-state` with `h3` "No providers match Plumbing in Kolkata." (chosen values), muted "Change the service or town and search again." and a `.btn.btn-secondary` "Change search" that moves focus to the Service select (as the prototype's script does). No provider from other towns is rendered.
      - Error: `.alert.alert-danger[role=alert]` "We couldn't search providers. Check your connection and try again. Your service and town are still selected." plus `.btn.btn-secondary` "Try again" that repeats the same search (selections preserved).
      - If the town or service option lists fail to load, show the same error alert with "Try again" that reloads the option lists.
      Styling uses only tokens (already loaded: `apps/web/src/index.css` lines 2-3 import `design-system/tokens.css` and `design-system/prototype-utils.css`): `--space-1/2/3/4/6`, `--size-content`, `--size-control-lg`, `--border-width`, `--color-border-strong`, `--color-surface`, `--color-fg-muted`, `--radius-lg`, `--font-size-xl/lg/xs/sm`. Classes `.card .field .field-hint .select .btn-primary .btn-secondary .badge-success .chip .alert-danger .empty-state .skeleton .stack .text-muted` come from `prototype-utils.css`. New classes (`.providers-search-form`, `.providers-results-head`, `.providers-start`, `.providers-state-box`) are defined in `providers.css` on the same tokens, following that file's `providers-` prefix. No sign-in control anywhere on the page.
    files:
      - apps/web/src/providers/Providers.tsx
      - apps/web/src/providers/providers.css
    rationale: |
      Builds the approved design. Where the prototype differs from the app: its top bar lists Overview / Services / Providers / Account (stub buttons); the app's existing bar ("Service catalog" with a "Browse services" link) is kept because only the catalog and providers pages are public routes today (`App.tsx` lines 26-27). Prototype classes `.top-bar .menu .page .list .listing*` are inline prototype styles, so the existing `providers-*` equivalents are reused instead of redefining them.
  - description: |
      Route stays `#/providers` in `App.tsx` (already public, rendered outside `CustomerContext`), so no routing change is needed. Confirm with a test that the page renders and searches with no session.
    files:
      - apps/web/src/App.tsx
    rationale: AC3. The file is only touched if the verification test shows a change is needed.
tests:
  - |
    AC1 (API, `providers.service.spec.ts`): write first, fails because `list()` takes no filter.
    ```ts
    const names = new ProvidersService(PROVIDERS).list({ service: 'Plumbing', town: 'Pune' }).providers.map((p) => p.name);
    expect(names).toEqual(['<seeded plumbers listing Pune, best rated first>']);
    ```
  - |
    AC1 (web, `Providers.test.tsx`): choose a service and a town, click "Search providers", and the matching providers appear.
    ```ts
    fireEvent.change(screen.getByLabelText('Service'), { target: { value: 'Plumbing' } });
    fireEvent.change(screen.getByLabelText('City or town'), { target: { value: 'Pune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search providers' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Plumbing in Pune · 2 providers' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/providers?service=Plumbing&town=Pune'), expect.anything());
    ```
  - |
    AC2 (API): a provider listing several services and towns appears for every service/town pair it lists.
    ```ts
    const multi: Provider = { id: 'm', name: 'Multi', services: ['Plumbing', 'Cleaning'], towns: ['Pune', 'Mumbai'], rating: null };
    for (const service of multi.services) for (const town of multi.towns)
      expect(new ProvidersService([multi]).list({ service, town }).providers.map((p) => p.name)).toEqual(['Multi']);
    ```
  - |
    AC3 (API, `providers.controller.spec.ts`): the controller has no guard and answers a filtered call without credentials.
    ```ts
    expect(Reflect.getMetadata('__guards__', ProvidersController)).toBeUndefined();
    expect(Reflect.getMetadata('__guards__', ProvidersController.prototype.list)).toBeUndefined();
    expect(new ProvidersController(new ProvidersService(PROVIDERS)).list('Plumbing', 'Pune').providers.length).toBeGreaterThan(0);
    ```
  - |
    AC3 (web, `App.test.tsx`): with no signed-in customer, `#/providers` shows the search form and a search returns results with no sign-in prompt.
    ```ts
    window.location.hash = '#/providers';
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Search providers' })).toBeInTheDocument();
    expect(screen.queryByText(/sign in/i)).toBeNull();
    ```
  - |
    AC4 (API): lists the town but not the service, so it is excluded.
    ```ts
    const p: Provider = { id: 'a', name: 'A', services: ['Electrical'], towns: ['Pune'], rating: null };
    expect(new ProvidersService([p]).list({ service: 'Plumbing', town: 'Pune' }).providers).toEqual([]);
    ```
  - |
    AC5 (API): lists the service but not the town, so it is excluded.
    ```ts
    const p: Provider = { id: 'a', name: 'A', services: ['Plumbing'], towns: ['Mumbai'], rating: null };
    expect(new ProvidersService([p]).list({ service: 'Plumbing', town: 'Pune' }).providers).toEqual([]);
    ```
  - |
    AC6 (API, `towns.service.spec.ts` and `towns.controller.spec.ts`): the town list is exactly the shared list.
    ```ts
    expect(new TownsController(new TownsService(TOWNS)).list().towns.map((t) => t.name)).toEqual(TOWNS.map((t) => t.name));
    ```
    AC6 (web): the town select offers only the shared list, nothing else.
    ```ts
    const options = within(await screen.findByLabelText('City or town')).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Pune', 'Mumbai', 'Chennai', 'Hyderabad', 'Bengaluru', 'Delhi', 'Kolkata', 'Ahmedabad']);
    ```
    (the stubbed `/towns` response in the test supplies the list; a second test asserts the select shows whatever `/towns` returns and no hard-coded extras.)
  - |
    AC7 (web): a search with no matches (API returns `[]`) shows the empty state.
    ```ts
    expect(await screen.findByRole('heading', { name: 'No providers match Plumbing in Kolkata.' })).toBeInTheDocument();
    ```
  - |
    AC8 (API): with providers in other towns only, the filtered result is empty; and (web) no provider card renders in the empty state.
    ```ts
    expect(new ProvidersService(PROVIDERS).list({ service: 'Plumbing', town: 'Kolkata' }).providers).toEqual([]);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    ```
  - |
    AC9 (web): the empty state tells the customer to change the service or town and offers "Change search".
    ```ts
    expect(screen.getByText('Change the service or town and search again.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Change search' }));
    expect(screen.getByLabelText('Service')).toHaveFocus();
    ```
  - |
    States (web, from the prototype): start prompt shown before any search; loading shows "Searching providers…" with the button disabled; a rejected fetch shows `role="alert"` "We couldn't search providers." and "Try again" repeats the search with the same selections. Existing story 052 web and API tests are updated in the same change for the re-seeded data and the h3 card heading (ordering, rating badge and "No ratings yet" assertions stay).
  - |
    Narrow commands: `(cd services/leave-api && pnpm test -- src/providers src/towns)` and `(cd apps/web && pnpm test -- src/providers src/App.test.tsx)`. An optional Playwright API test in `services/leave-api` (existing `playwright.config.ts`) can assert `GET /providers?service=Plumbing&town=Pune` and `GET /towns` return 200 without an Authorization header.
assumptions_or_open_questions:
  - |
    Pagination and limits (deferred question): this plan does NOT paginate or cap results. Providers are an in-memory release-time list (`PROVIDERS`), there is no database table or index for providers yet, and the filter is a linear scan. When providers move to PostgreSQL, filtering needs a provider-to-service and provider-to-town join (or array columns) with indexes on service and town, and a limit/page parameter; that is for the story that introduces provider storage. Please confirm this is acceptable.
  - |
    Project-wide performance and scale targets (response time, number of providers, concurrent visitors) are unanswered, so the plan sets none. ADR-0006 (5,000 employees) concerns the leave product and does not size this catalog. Data-retention/privacy questions do not affect this story: it stores no customer data and logs no search input.
  - |
    The "shared town list" does not exist in the repo, so this plan creates it as an API-owned list of the 8 towns the prototype uses (Pune, Mumbai, Chennai, Hyderabad, Bengaluru, Delhi, Kolkata, Ahmedabad). Please confirm that list and that the API is the right owner; the prototype states them as its assumption.
  - |
    The current seeded providers use services and towns outside the catalog and the shared list (for example "Water heater repair", "Hadapsar"). The plan re-seeds them with catalog service names and shared towns, which changes story 052's test fixtures and visible seed data. Real provider onboarding is out of scope.
  - |
    Matching is by exact name (trimmed, case-insensitive) rather than ids, because provider data stores service and town names today. Moving to ids is deferred to the provider-storage story.
  - |
    Both selects default to their first option, as in the prototype, so a customer can press "Search providers" without choosing; the start prompt is shown until the first search. No "any service" or "any town" option is offered because the item asks for a chosen service and town.
  - |
    The prototype's top bar (Overview / Services / Providers / Account, stub buttons) differs from the app's current providers top bar; the plan keeps the app's bar rather than adding destinations that have no page. The prototype's "No ratings yet" chip and rating badge are existing 052 content and are not changed.
  - |
    Search state is not written to the URL (no deep links or back-button restore); the item does not ask for it.
estimated_points: 5
package_dependencies: []
notes: |
  ### Data & rollout

  - **Existing data**: None stored. Providers, categories and towns are in-memory constants in the API; no database, migration or stored row is touched.
  - **Backfill / seed**: The release-time stand-in `PROVIDERS` constant is re-seeded in `providers.data.ts` and a new `TOWNS` constant is added; both are code, so there is nothing to run and no re-run risk.
  - **Settings**: None new. `VITE_API_BASE_URL` (existing, optional) is reused by the new web calls.
  - **Provisioning**: Nothing outside the code. `/towns` and `/providers` are public routes on the existing API.
  - **Order and rollback**: Deploy the API and web together; the new query params are optional, so the old web build keeps working against the new API. If the web is deployed first it would call `/towns`, which does not exist yet, so deploy the API first. Rollback is reverting the commit.

  Research findings: `ProvidersController.list()` currently takes no query and `ProvidersService.list()` returns all providers sorted by `compareProviders`; `Providers.tsx` fetches once on mount and renders the whole list. The catalog already exposes names via `GET /service-categories`, which supplies the Service select. `apps/web/src/index.css` already imports the design-system tokens and `prototype-utils.css`, which define the classes the prototype uses (checked `.field-hint`, `.badge-success`, `.chip`, `.alert-danger`, `.empty-state`, `.skeleton`; `.select` is defined in the grouped `.input, .textarea, .select` rule).

  ```mermaid
  flowchart TD
    App[apps/web App.tsx hash route /providers]
    Page[Providers.tsx search page]
    Css[providers.css]
    WApi[providers/api.ts]
    CApi[catalog/api.ts fetchServiceCategories]
    PC[ProvidersController GET /providers]
    PS[ProvidersService list filter]
    PD[providers.data.ts PROVIDERS]
    TC[TownsController GET /towns]
    TS[TownsService]
    TD[towns.data.ts TOWNS]
    AM[app.module.ts]
    CC[CatalogController GET /service-categories]
    App --> Page
    Page --> Css
    Page --> WApi
    Page --> CApi
    WApi --> PC
    WApi --> TC
    CApi --> CC
    PC --> PS
    PS --> PD
    TC --> TS
    TS --> TD
    AM --> TC
    classDef touched fill:#f96,color:#000
    class Page,Css,WApi,PC,PS,PD,TC,TS,TD,AM touched
  ```

  Touched: Page, Css and WApi build the search UI and client; PC and PS add the filter; PD re-seeds searchable data; TC, TS, TD and AM add the shared town list. App.tsx, catalog/api.ts and CatalogController are context only.
review_focus: |
  IN: server-side service-and-town filtering on the public `GET /providers`, a new shared town list at `GET /towns`, and the search page with start/loading/results/empty/error states. OUT: ordering and listing-card content (story 052, reused unchanged), pagination, provider storage and price. Riskiest part: the AND semantics (provider must list the service and the town, either of several) and re-seeding `PROVIDERS`, which changes story 052 fixtures. Deliberate: no pagination (in-memory data), unknown service or town returns 200 with an empty list, and the app's existing top bar is kept instead of the prototype's stub nav.
