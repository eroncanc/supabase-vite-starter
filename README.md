# Starter

A Supabase + Vite starter: React 19 + TypeScript, Tailwind v4, shadcn/ui on
Base UI, Supabase Auth (Google with a magic-link fallback), Postgres with RLS
on every operation, image uploads, and a re-runnable seed. One example table,
`projects`, is wired end to end so every pattern has a working reference.

`AGENTS.md` (also `CLAUDE.md`) holds the rules and the reasons for them; `docs/`
holds the long versions.

## Starting a new project from this

1. Copy the repo (or use it as a GitHub template) and `git init` fresh.
2. Rename, in one pass:
   - `project_id` in `supabase/config.toml` — it names the Docker containers
   - `<title>`, `og:*` and the description in `web/index.html`
   - the header name in `components/app-layout.tsx` and the login card title
     in `pages/login.tsx`
   - `THEME_STORAGE_KEY` in `web/src/lib/theme-context.ts` **and** the
     hardcoded copy in `web/index.html`'s inline script — they must match
   - the seed email in `dev/seed.sh`
   - the paragraph at the top of `AGENTS.md`
3. Replace `projects` with your first real table: write a new migration (don't
   edit the starter's once you've pushed it anywhere), copy the shape of
   `lib/projects.ts` + `lib/use-projects.ts`, run `npm run gen:types`, add the
   alias to `types/db.ts`.
4. Drop what you don't need. The images module is `lib/images.ts`,
   `components/image-picker.tsx`, `docs/images.md` and the
   `add_image_uploads` migration.

## Prerequisites

- **Node 22+**
- **Docker or OrbStack, running.** The local Supabase stack boots
  Postgres/Auth/Storage/Studio/Mailpit in containers; nothing works without it.
- **Supabase CLI 2.116+** (`brew install supabase/tap/supabase`)

## First-time setup

```bash
# 1. Boot the local Supabase stack (first run pulls images — a few minutes).
#    Only one project's stack can hold the default ports: `supabase stop` any other.
supabase start

# 2. Point the app at it
supabase status            # copy API_URL and PUBLISHABLE_KEY
cat > web/.env.local <<EOF
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
EOF

# 3. Install web deps and generate DB types
cd web
npm install
npm run gen:types

# 4. Fill it and sign in
../dev/seed.sh             # prints a single-use sign-in link
npm run dev                # http://localhost:5173
```

The local publishable key is a fixed demo value, identical on every machine —
not a secret. The remote one is.

## Everyday dev

From `web/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on **5173** |
| `npm run build` | `tsc -b && vite build` — the typecheck is the real gate |
| `npm test` | vitest, pure logic in `lib/` |
| `npm run lint` | oxlint |
| `npm run gen:types` | Regenerates `src/types/database.ts` from the local DB |

From the repo root:

| Command | What it does |
| --- | --- |
| `supabase start` / `supabase stop` | Boot / halt the local stack (data survives a stop) |
| `supabase db reset` | Wipe and re-run every migration (also clears all local users) |
| `supabase status` | Prints URLs and keys for the running stack |
| `dev/seed.sh` | Re-seed the dev account and print a sign-in link |

### Local service ports

| Service | URL |
| --- | --- |
| App (Vite) | http://localhost:5173 |
| Supabase API | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | http://127.0.0.1:54323 |
| **Mailpit (all outbound email)** | http://127.0.0.1:54324 |

## Environment

`web/.env.local` (gitignored) holds `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`. Keep the remote project's values commented out
in the same file, so switching is a two-line swap. Two things to know when you
switch:

- **Vite only reads `.env` files at startup.** Restart the dev server.
- Sessions are stored per project ref, so switching logs you out. Expected.

The root `.env` (gitignored) holds only the Google OAuth credentials for the
local stack — see below.

## Auth: how sign-in actually flows

Two ways in, sharing one return leg. **Google is the primary one** — the hosted
project's built-in email sender is capped at a few messages an hour *for the
whole project*, so magic link cannot carry day-to-day use. It stays as the
fallback so a broken OAuth config can't lock you out of your own app.

- **Google:** `signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
  The tab navigates away, so the promise resolving is *not* success — only its
  `error` means anything. Google returns to Supabase's `/auth/v1/callback`,
  which redirects to the app with a PKCE `?code=`.
- **Magic link:** `signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })`.
  The emailed link returns to the app with the session in the URL **hash**.

**Both then land in the same place:** supabase-js picks the code or the hash up
(`detectSessionInUrl`) and `onAuthStateChange` fires in `AuthProvider`. There
is no callback route and no manual token parsing.

### Configuring Google

Optional locally — without it the stack still boots and the magic link works.

1. In Google Cloud, create an OAuth client (Web application). Its **Authorized
   redirect URIs** point at Supabase, never at the app:
   - `http://127.0.0.1:54321/auth/v1/callback`
   - `https://<project-ref>.supabase.co/auth/v1/callback`
2. Put the credentials in the root `.env`:
   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
   ```
   `[auth.external.google]` in `supabase/config.toml` reads them via `env()`.
3. `supabase stop && supabase start` — `db reset` doesn't pick up config.
4. For prod, set the same client in the hosted dashboard (Authentication → Sign
   In / Providers → Google).

If the Google **OAuth consent screen** is still in *Testing*, only listed test
users can sign in, and their consent expires after a week.

## Production

Vercel builds `web/` on merge to `main` (`web/vercel.json` rewrites every path
to `index.html` and skips builds that don't touch `web/`). Nothing in the code
names the domain: auth passes `window.location.origin`, so a preview deploy
signs in against its own URL. The places outside the repo that do, configured
separately:

| Where | What it holds |
| --- | --- |
| Vercel → Settings → Domains | the domain (+ `www` redirecting to it) |
| DNS | Vercel's records — if Cloudflare, **"DNS only" (grey cloud)**; proxying loops unless SSL/TLS is Full (strict) |
| Supabase → Auth → URL Configuration | Site URL, plus `https://*.vercel.app` in Redirect URLs if previews should sign in |
| Google Cloud → OAuth client | **unchanged** — its redirect URIs point at Supabase |
| `web/index.html` | `og:url` and `<link rel="canonical">`, absolute |
| GitHub → repo secrets | `SUPABASE_URL`, `SUPABASE_KEEPALIVE_SECRET_KEY` for the keep-alive workflow |

`supabase/config.toml` is local-only and stays pointed at localhost — the hosted
project keeps its own copy of every auth setting, and the two drift silently.

**Deploying a migration:** read `docs/deploy.md` first. Migrate, then merge.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Sign-in link never arrives | Pointed at local — check Mailpit at :54324, not your inbox |
| "Invalid or expired" link | A newer link was requested; only the newest token is valid |
| Sign-in does nothing, no error | Vite origin missing from the `config.toml` redirect allow-list — or Vite moved to 5174 because another server holds 5173 |
| `supabase start` fails on ports | Another project's stack is running — `supabase stop` it |
| Env change had no effect | Vite reads `.env` only at startup — restart the dev server |
| Logged out after switching envs | Sessions are keyed per project ref; expected |
| `npx shadcn add` writes to the wrong folder | `tsconfig.json` `paths` disagrees with the other two |
| Types missing a new column | `npm run gen:types` wasn't re-run after the migration |
| A replaced image is still in the bucket | The bucket lost its select policy — Storage can't delete without one |
| `npm install` dies with `edgesOut` | An npm 10 resolver bug on a fresh install; install with the committed lockfile |
| Anything, immediately after boot | Docker/OrbStack isn't running |
