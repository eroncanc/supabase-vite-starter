# Starter

<!-- Replace this paragraph with what the app is and who it's for. Everything
     below it is the stack's own rules, carried over from web-battle, and holds
     until a project has a reason to change it. -->
A Supabase + Vite starter: auth, one owned table wired end to end, image
uploads, and the habits that keep a small app honest — migrations as the only
schema, generated types, RLS on every operation, a seed you can re-run.

## Stack

- **Frontend:** React + TypeScript, built with Vite (`/web`)
- **Styling:** Tailwind CSS v4 (no `tailwind.config.js`; theme tokens live in
  `web/src/index.css`)
- **Components:** shadcn/ui (components live in-repo under `web/src/components/ui`,
  not an npm dependency — edit them directly rather than wrapping them)
- **Icons:** lucide-react
- **Routing:** react-router, declarative mode (`<BrowserRouter>` / `<Routes>`).
  Package is `react-router`, not `react-router-dom`.
- **Backend:** Supabase (Postgres + Auth + Storage), managed via the Supabase CLI
- **Auth:** Google OAuth (`signInWithOAuth`) as the primary way in, with magic
  link (`signInWithOtp`) kept below it as a fallback. No passwords, no signup
  form — the first sign-in creates the user either way.
  - **Google is primary because email is rationed.** The hosted project's
    built-in sender is a courtesy sender capped at a few messages per hour
    *project-wide*, so signing a second person in on a second device exhausts it
    and locks everyone out. OAuth sends no mail and has no such cap. The magic
    link stays because a broken OAuth config must not be able to lock you out of
    your own app — it is the way back in, not the way in.
  - **Both paths share one return leg.** OAuth comes back to the origin with a
    PKCE `?code=` and the magic link with a token in the hash; `detectSessionInUrl`
    handles both and `onAuthStateChange` fires. There is no callback route and
    no manual token parsing — don't add either.
  - **`redirectTo` is checked against the same exact-match allow-list as
    `emailRedirectTo`** (see the redirect rule below). Local lives in
    `config.toml`; the hosted project's copy lives only in its dashboard, so the
    two are configured separately and drift silently.
  - The Google provider's client id and secret reach the **local** stack through
    `env()` substitution in `config.toml`, read from the gitignored root `.env`
    (`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET`). Never inline them.
    Without them the stack still boots and the magic link still works.
- **DB migrations:** `supabase/migrations/*.sql`, applied with `supabase db push`
  (or `supabase db reset` locally). Never hand-edit schema in the Supabase
  Studio UI — always write a migration file.

### Tests

`npm test` (vitest, `vite.config.ts`) runs `src/**/*.test.ts`.

**What gets a test: pure logic in `lib/`.** Not data access — that traces
through RLS and PostgREST, so it's checked against the local stack instead — and
not components. Today that means `lib/filter.ts` and the arithmetic half of
`lib/images.ts`. When a module grows rules intricate enough to be wrong in a way
`tsc` can't see, split the pure part out and test it.

- The suite must not need a real `.env.local`. `lib/supabase.ts` **throws at
  import time** on missing config, and every `lib/<table>.ts` holds its query
  functions beside its helpers, so importing a pure module reaches the client
  anyway. `test.env` in `vite.config.ts` supplies placeholders; nothing under
  test makes a request.
- **Write assertions that can fail.** A fixture where the expected answer holds
  for the wrong reason is worse than no test: the filter's AND-vs-OR case only
  means something because its fixture matches one row under OR and none under
  AND. When adding a case, break the rule on purpose and check the test goes red.
- **A generalisation is proved by the old suite passing unchanged.** When a rule
  widens, the existing tests keep their assertions and gain only the new
  argument — that's the cheap way to know the old behaviour survived.

### Local dev

- The local stack (`supabase start`) **requires Docker or OrbStack to be
  installed and running** — it boots Postgres/Auth/Studio in containers.
- **One local stack at a time on the default ports.** Every project cloned from
  this starter uses 54321–54324; `supabase stop` the other project before
  `supabase start` here. Its data survives in its Docker volumes.
- After editing a migration file, re-apply with **`supabase db reset`**, not
  `supabase start`. `start` only applies migrations on first boot, so it will
  not pick up edits to an existing migration; `db reset` wipes and re-runs all
  migrations cleanly every time.
- `web/.env.local` points at the **local** stack by default; keep the remote
  project's values commented out in the same file, so switching is a two-line
  swap.
- **DB types are generated, never hand-edited:** `npm run gen:types` in `web/`
  writes `src/types/database.ts` from the local DB. Run it after every migration.
  `src/types/db.ts` holds the hand-written aliases over it — that's the file app
  code imports.
- **Magic links must redirect back to the dev server.** `site_url` and
  `additional_redirect_urls` in `supabase/config.toml` are an exact-match
  allow-list; if they don't include the Vite origin (`http://localhost:5173`),
  Auth silently redirects to `site_url` instead and the sign-in appears to do
  nothing. Change the Vite port and these have to change with it — and a second
  Vite server already on 5173 moves this one to 5174 without asking.
- Local mail is captured by Mailpit at http://127.0.0.1:54324 — that's where the
  sign-in link lands, not a real inbox.
- **`dev/seed.sh` fills the local database with fixtures**, and prints a magic
  link to sign in with. `dev/seed.sql` is the data; the script only finds the
  stack (`supabase status`), makes the local user through the **Auth API**
  (never by inserting into `auth.users`, whose columns are Auth's business and
  change between versions), and passes the id in.
  - **Re-running is the normal case.** It deletes that account's rows first and
    writes the same **fixed ids** back, so a URL you had open still works.
    Because the ids are fixed, it seeds one account at a time.
  - It is **not** `supabase/seed.sql`, which `db reset` would run automatically:
    that file can't create an auth user without hand-writing `auth.users` rows,
    and re-seeding without a reset is the thing you actually want mid-change.
  - **Seed the states that are tedious to reach by hand**, not just a row of
    each table. When a fixture exists to show a rule, say which rule in a
    comment beside it.

### Verifying a change

**Verification stops at the terminal.** `npm test`, `npx tsc -b`, `npx oxlint`,
`supabase db reset`, a query against the local stack — those are the agent's to
run, and they're what a change has to pass before it's handed over.

**The app in the browser is mine to look at.** I have it open already, so it's
faster for me to click through a change than for an agent to drive a tab. Don't
reach for browser automation to check UI work unless I ask. A plan or a hand-off
should say what was run and, separately, what is worth a look in the browser —
as things to look at, not things the agent did.

**RLS is verified as two users, not one.** Insert as user A, then as user B
`select`, `update` and `delete` it and expect zero rows, and try to insert a row
carrying A's `user_id`. In psql: `set local role authenticated` plus
`set_config('request.jwt.claims', ...)` inside a transaction. Storage policies
are checked through the Storage API with real access tokens — `remove()` returns
no error when it deletes nothing, so check the object is actually gone.

### Deploying to prod

**Read `docs/deploy.md` in full before any `supabase db push`.** The short
version: prod is the hosted Supabase project; Vercel deploys on merge to
`main`, migrations do not. **Migrate first, then merge.** `migration list` to
prove no drift → back up to `~/<project>-backups/<stamp>-prepush/` → rehearse
the migration against a prod data dump locally → fresh backup (unless strictly
additive) and `db push` → dump again and diff against the previous `-postpush`
dump → merge. Verification after a push is a dump diff, not a click-through,
because prod is multi-user. There is no psql route into prod.

**The free tier pauses an idle project.** `.github/workflows/supabase-keepalive.yml`
reads one real row every six hours; it needs `SUPABASE_URL` and
`SUPABASE_KEEPALIVE_SECRET_KEY` (a dedicated secret key, revocable on its own)
as repo secrets, and a table with at least one row in prod.

## Folder layout

```
<project>/
  docs/               # long-form rationale this file summarises
    deploy.md
    images.md
  dev/
    seed.sh           # fills the local DB with fixtures + prints a sign-in link
    seed.sql          # the fixture data itself
  supabase/
    config.toml       # local stack config, incl. the auth redirect allow-list
    migrations/       # versioned SQL, source of truth for schema
  web/
    src/
      components/
        ui/              # shadcn components — edit in place, don't fork
        app-layout.tsx   # header + <Outlet> for authenticated routes
        require-auth.tsx # route guard; redirects to /login
        page-header.tsx  # title, action, and the back link above it
        card-link.tsx    # a card's title link, spread over the whole card
        actions-menu-trigger.tsx # the one three-dot menu button
        pick-filter.tsx  # search box over a long pick list
        image-picker.tsx # pick, resize, upload, hand back a path
      pages/           # one file per route
      lib/
        supabase.ts    # Supabase client init (typed with Database)
        auth.tsx       # AuthProvider
        auth-context.ts# AuthContext + useAuth()
        theme.tsx      # ThemeProvider (light/dark/system)
        theme-context.ts# ThemeContext + useTheme() + THEME_STORAGE_KEY
        back-link.ts   # where "back" goes, carried in location state
        navigation.ts  # the labels back links draw on
        copy.ts        # every sentence the app says
        filter.ts      # matching rule + threshold for pick filters
        images.ts      # upload/resolve/delete over the images bucket
        card-surface.ts# what a whole-card tap target looks like
        <table>.ts     # query functions (projects.ts)
        use-<table>.ts # the hooks over them (use-projects.ts)
      types/
        database.ts    # GENERATED — `npm run gen:types`, don't edit
        db.ts          # readable aliases over database.ts
      App.tsx          # route table
    .env.local          # VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (gitignored)
```

`@/` is aliased to `web/src/` in three places that must agree: `vite.config.ts`
(runtime), `tsconfig.app.json` (typecheck), and `tsconfig.json` (what the
`shadcn` CLI reads to decide where to write new components).

`AuthProvider` and `useAuth` live in separate files on purpose: oxlint's
fast-refresh rule fires when one file exports both a component and a hook. Same
reason applies to any future provider.

## Data model (current)

- **projects** — the example table. Owned by a user (`user_id`), `name`,
  optional `description`, optional `image_path` (a path in the `images` bucket,
  never a URL). Replace or rename it; it exists so every pattern below has a
  working reference.
- **storage: `images` bucket** — public, objects at `<user_id>/<uuid>.webp`,
  every policy scoped by that first folder. Rationale in `docs/images.md`.

When the schema grows past a couple of tables, keep this section to one line a
table and move the reasons into `docs/data-model/`, one file per area — the
reasons are what stop a fixed bug coming back.

## Row Level Security

Every table enforces that a user can only touch rows they own — directly via
`user_id = auth.uid()`, or for a child table via an `EXISTS` subquery tracing
back to the owning row. All four operations (select/insert/update/delete) are
covered, not just select. When adding a new table, RLS policies are not
optional — write them in the same migration as the table.

**Authoring idiom (match this exactly in new policies):** policies are scoped
`to authenticated` and wrap the auth call as `(select auth.uid())` — evaluated
once per statement rather than once per row. `UPDATE` policies carry both
`USING` and `WITH CHECK` so a row can't be edited out of your ownership.

**RLS is not referential integrity.** FKs guarantee a referenced row exists;
RLS guarantees you own it. Neither guarantees two linked rows belong to the
*same* parent. Because one user can own many parents, you can attach a child of
parent A to something under parent B and every check passes. "Same-parent"
consistency is enforced in the **app layer**. If you ever need it in the DB it
takes composite FKs or a trigger — plain FKs can't express it.

**Storage needs a select policy to delete.** Storage reads the object's row
before removing it, so without one `remove()` deletes nothing and returns no
error. On a public bucket the select policy protects nothing — public reads
skip RLS — it's there so deletes work.

## Data access

No query library (no TanStack Query) — the pattern is two hand-rolled layers,
shown by `lib/projects.ts` and `lib/use-projects.ts`:

- `lib/<table>.ts` — plain async functions per operation (`listProjects`,
  `createProject`, …) that unwrap the Supabase response and **throw** on `error`.
- `lib/use-<table>.ts` — a hook owning `{ rows, loading, error, …, reload }`.
  Mutations patch local state from the row the server returns (`.select().single()`)
  instead of refetching, and rethrow so the calling dialog can show the failure.

Two RLS consequences worth remembering when writing these:

- **Reads never filter on `user_id`** — RLS already scopes them. Adding the
  filter is redundant and implies the policy can't be trusted.
- **Inserts must set `user_id` explicitly**, from `supabase.auth.getUser()`.
  The column is NOT NULL with no default, and the policy's `WITH CHECK`
  compares it to `auth.uid()`. Same applies to any future owner column.

Hooks are kept in their own file (never alongside a component) for the same
fast-refresh reason as `auth.tsx` / `auth-context.ts`. oxlint's
`set-state-in-effect` rule also bites here: don't `setState` synchronously in an
effect body — reset flags from the event that triggered the reload, remount per
id with `key` (`pages/project-detail.tsx`), and read external state (media
queries) with `useSyncExternalStore`.

## Conventions

- Prefer real columns over JSONB for anything that represents **current
  state** you'll want to query/filter/join on. JSONB is reserved for
  **historical/append-only** data.
- **Images:** a column holds a storage **path**, never a URL — name it
  `*_path` and resolve it only with `publicImageUrl()`. See `docs/images.md`.
- **Indexes:** index every FK column, but use a **composite** when the read
  pattern filters then sorts — e.g. `(parent_id, sort_order)`. Skip a
  standalone index on an FK already covered by a UNIQUE constraint or by a
  composite's leftmost prefix (don't add redundant ones).
- Keep migrations additive where possible; flag destructive changes
  (drops, renames) explicitly before writing them.
- **`ALTER TYPE ... ADD VALUE` goes in its own migration file.** It commits fine
  inside a transaction, but the new value can't be *used* by a later statement in
  that same transaction — and the CLI runs each file as one.
- **UI rules, not DB constraints**, for limits a person would want to see
  explained: refuse **at the control**, never at Save, and only refuse somebody
  *arriving* (exclude the row being edited).
- UI components: use shadcn primitives as the base, Tailwind for layout/
  spacing, lucide-react for icons. Favor a clean, legible look over dense
  data tables.
- **These shadcn components wrap Base UI (`@base-ui/react`), not Radix.** Most
  snippets found online assume Radix and will be subtly wrong. Notably:
  composition uses a `render={<Button />}` prop, not `asChild`; and
  `DropdownMenuLabel` (Base UI's `Menu.GroupLabel`) **throws** unless it is
  inside a `DropdownMenuGroup` or `DropdownMenuRadioGroup` — an ungrouped label
  crashes the whole render into a blank page the moment the menu opens. And
  `SelectValue` renders the raw **value**, not the chosen item's text, so a
  select whose `SelectItem` children are labels needs
  `<SelectValue>{(value) => LABELS[value]}</SelectValue>` or the trigger and the
  list will disagree.
- **"Back" is passed in, not hardcoded.** A page reachable from more than one
  place can't know where it came from, so `BackLink` (`lib/back-link.ts`) rides
  in react-router's location **state**, not the URL: it describes this visit,
  not the address. `useBackLink` takes the page's own default, so a reload or a
  pasted link still works. Its mirror is `useHereBackLink()`, which a page hands
  *forward* when it links somewhere; the labels it draws on live in
  `lib/navigation.ts`, so a new route is added there rather than spelled out at
  each link.
  - **Back renders above the page title, from `PageHeader`'s `back` prop** —
    never at the foot of a page, where a growing list pushes the way out below
    the fold. Every page renders `PageHeader` inside its loading and error
    branches too, so the way out is there before the data is.
- **A dialog scrolls in exactly one place: `DialogBody`.** `DialogContent` is a
  fixed, centered popup capped at the viewport (`max-h-[calc(100dvh-2rem)]`), a
  flex column whose header and footer are pinned and whose body takes the rest.
  **Never give a list inside a dialog its own `max-h-* overflow-y-auto`**: two
  nested scrollers fight each other under a thumb.
- **A long pick list gets a filter, not a combobox.** `PickFilter` is a search
  box over the list that's already there, rendered only past `FILTER_THRESHOLD`
  rows (`lib/filter.ts`). A `Combobox` is right for the other shape — a
  *single*-select of an unbounded list.
  - **Matching is `matchesFilter`**, case- and accent-insensitively, with every
    typed term required somewhere in the row.
  - **Filtering narrows what you can see, never what's picked.**
- **The three-dot menu is one component, `ActionsMenuTrigger`.** It carries the
  `touch-target` utility (`index.css`): a 44px hit area drawn by an invisible
  `::after`, under `@media (pointer: coarse)` only, so nothing about the layout
  changes and a mouse doesn't start stealing clicks from neighbours. Reach for
  that utility for any icon-sized control that has to be hit on a phone.
- **A card with a clickable title is clickable all over.** `CardLink` spreads
  the link over its card with an `::after` overlay — the card does *not* wrap
  its contents in an anchor, which would nest the actions menu inside a link.
  Two rules hold at every call site: the card carries `CARD_SURFACE` (which
  makes it `relative` and tints it on hover), and the menu is `relative z-10`
  so it stays on top and still opens. Where the target is a dialog rather than
  a route, lay a button with `CARD_SURFACE_OVERLAY` over the card instead.
- **Prose lives in `lib/copy.ts`, labels stay in the JSX.** Placeholders, empty
  states, the line under a field, delete warnings and the `Could not …` error
  fallbacks are in that one file, grouped by surface — the voice is a thing you
  edit in one sitting. A button, a heading or a field's name is *not* prose:
  reading it in place is what makes the JSX legible.
  - **Anything with a name or a count in it is a function**, not a string —
    `copy.projects.deleteWarning(name)`. Pluralisation lives in the function.
  - **`copy.errors` is deliberately plain**: when something breaks, say what
    broke. Each is a fallback — a real `Error`'s message wins.
  - Tests assert on user-facing facts as **literals**, never against `copy.*`,
    or the test agrees with itself.
- **Theming is class-based:** the `dark` class on `<html>`, driven by
  `ThemeProvider` (light/dark/system, persisted to `localStorage`). An inline
  script in `web/index.html` applies it before first paint to avoid a flash;
  it hardcodes the storage key, so it must stay in sync with
  `THEME_STORAGE_KEY` in `lib/theme-context.ts`.

## Out of scope for now

- Multiplayer/shared rows (single owner per row)
