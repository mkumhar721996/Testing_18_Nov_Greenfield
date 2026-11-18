# UI guidelines — Leave Manager

Leave Manager is a workplace tool where employees request time off and managers approve it.

## Navigation and information architecture
- **Top bar, no sidebar.** There are only five destinations, so a horizontal bar keeps the full page width for tables and calendars.
- **Main sections, in this order:** Overview (`overview`), My leave (`my-leave`), Team calendar (`calendar`), Approvals (`approvals`), Account (`account`). Employees see their own work first; Approvals is last of the work areas because only managers use it.
- **Approvals is hidden for non-managers**, not disabled, so employees never see a dead end.
- **Request and review flows open in a `.drawer` or `.modal`, not a new page,** so people keep their place in the list.
- **Below 48em the nav collapses behind the menu button;** nobody files leave from a phone with a full bar open.

## Layout and density
- **Moderately dense, single-column on phones.** Employees check balances on the go; managers scan lists at a desk.
- **Content never exceeds `size-content`** so table rows stay readable on wide screens.
- **Use `space-3` between related items and `space-4` between sections** so grouping reads without extra dividers.
- **Dense text uses `font-size-sm`; body copy uses `font-size-md`;** page titles use `font-size-xl`, one per screen.
- **Tables scroll horizontally inside `.table-wrap`** rather than shrinking, so dates never wrap.

## Component usage
- **Card (`.card`) for summaries** — leave balance, upcoming time off, pending count — because each is a standalone fact; never nest cards.
- **Table (`.table`) for lists people compare or sort** — requests, approvals, team members — because dates and statuses must align in columns.
- **Plain `.stack` list for short, single-purpose lists** (e.g. recent activity) where columns add nothing.
- **One `.btn-primary` per view;** secondary actions use `.btn-secondary`, low-emphasis ones `.btn-ghost`, so the main action is obvious.
- **`.btn-danger` only for irreversible actions** (cancel a request, delete a policy), always behind a `.modal` confirmation.
- **Status is always a `.badge`:** `badge-warning` pending, `badge-success` approved, `badge-danger` declined, neutral for cancelled — so colour carries the same meaning everywhere.
- **Forms use `.field` with a hint for rules and an `.is-invalid` error for problems,** so the user sees the rule before they break it.
- **Filters are `.chip` or `.select`; view switches (List / Calendar) are `.tabs`,** because tabs change the view and chips only narrow it.
- **Confirmation of a saved action is a `.toast`; blocking problems are an `.alert`,** so transient news doesn't linger and serious news doesn't vanish.
- **Empty lists use `.empty-state` with one action; loading uses `.skeleton` for pages and `.spinner` for buttons,** so layout doesn't jump.

## Theme
- **Light only.** Leave is a daytime office task and one theme keeps status colours consistent; revisit if requested.

## Voice and tone
- **Plain, calm and direct.** People are often planning something personal; avoid HR jargon and exclamation marks.
- **Buttons are verb + object:** "Request leave", "Approve request", "Cancel request" — so the outcome is predictable.
- **Say what happened and what's next:** "Request sent to Priya. You'll be emailed when it's decided." Errors name the fix, not the fault.
- **Dates are written out ("Mon 3 Mar – Fri 7 Mar"), durations in working days ("3 days"),** because that is how people talk about leave.
