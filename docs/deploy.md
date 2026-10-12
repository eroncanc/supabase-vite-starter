# Deploying to prod

Prod is the hosted Supabase project (`supabase link`ed; the DB password lives in
the macOS keychain). **Vercel deploys on merge to `main`, migrations do not** —
there is no migration CI, so `supabase db push` is a thing a person runs.

Backups go to `~/<project>-backups/<stamp>-prepush/` and `-postpush/`, outside
the repo: they hold every user's data.

**Migrate first, then merge.** Both orders break the live app for about one
Vercel build — the old bundle against the new schema and the new bundle against
the old schema are each broken — so the window is unavoidable and the question
is only which half fails badly. It's the migration: if it fails there is nothing
to unwind on the frontend, whereas a merge-first failure means reverting the
merge *and* restoring, then waiting on a second build. `db push` is **not**
atomic across files and there are no down migrations, so recovery from a
half-applied push is a restore from the backup. Nothing else.

The steps, in order:

1. `supabase migration list` — prove prod hasn't drifted from `main`. Schema
   edited by hand in Studio would show up here, which is the other half of why
   that rule exists.
2. Back up to `<stamp>-prepush/`: `supabase db dump --role-only`, the schema,
   and `--data-only --use-copy`. The data dump covers `auth` and `storage` too.
3. **Rehearse against real data, not fixtures.** `supabase db reset --local
   --no-seed --version <last applied>` rewinds local to prod's state; load the
   prod `data.sql` into the container; `supabase migration up --local`; then
   diff every value before and after. Also diff the migrated schema against a
   from-scratch `db reset` — they must match but for pg_dump's random
   `\restrict` nonce, or the migrate-up path and the from-scratch path have
   drifted and the next migration is written against a schema prod doesn't have.
   - **Expect the prod dump not to load cleanly, and expect it all to be in
     `auth` and `storage`.** Three known shapes:
     - **A row a migration already created locally** — the `images` bucket in
       `storage.buckets`. You can't delete the local one first (a
       `protect_delete` trigger refuses), so strip that `COPY` block from a
       working copy of the dump.
     - **A table the local role can't write**, even with zero rows
       (`storage.buckets_vectors`, `storage.vector_indexes`). If one sits above
       `storage.objects`, stopping there silently leaves the rehearsal with no
       image rows while every `public` table looks complete.
     - **Prod's Auth and Storage ahead of the local container** — the hosted
       project upgrades itself and the CLI pins the image, so the dump names
       tables or columns that don't exist locally.
   - **Split the dump, don't chase errors one at a time.** Check each `COPY`
     block's table *and columns* against `information_schema.columns`, and skip
     a block **only while it is empty** — one carrying rows means the rehearsal
     would run against less data than prod holds, which is the one thing it
     exists to rule out. Refuse loudly there. Check the deliberate-strip set
     first, or the bucket's one legitimate row trips that guard every time.
   - Keep `ON_ERROR_STOP=1` throughout, or a real failure hides among the
     expected ones, and check row counts per table **against the dump's own
     `COPY` blocks** rather than trusting the load ran to the end.
   - **A hand-split dump needs the newline after `\.`** that `'\n'.join()`
     leaves off. Without it psql reports `end-of-copy marker corrupt` and
     points at the row *before* the marker, which reads as corrupt data rather
     than a missing byte.
4. A **fresh** backup — data moves between rehearsing and pushing — then
   `supabase db push`.
   - **An additive-only migration is the one case that can reuse a same-day
     backup.** `ADD COLUMN` that is nullable or has a constant default, and
     `CREATE INDEX`, are metadata-only on PG 11+: no table rewrite, not one row
     touched. A half-applied push then leaves a column nothing references,
     since the migration lands *before* the merge. Judge it on what the SQL
     does, not on how small it looks: anything that rewrites, drops, renames or
     backfills takes the fresh backup.
   - **Skipping that backup does not skip the rehearsal.** For an additive
     migration the checks that mean something are that it applies against real
     rows at all, that nothing pre-existing changed, and that the migrate-up
     schema still matches a from-scratch one.
     - **"Nothing changed" is a fingerprint, not a row count.** Hash every
       `public` table as
       `md5(string_agg(to_jsonb(x)::text, '|' order by to_jsonb(x)::text))`
       before the migrate-up, and again afterwards with the **columns this
       deploy adds subtracted** (`to_jsonb(x) - 'new_column'`). Identical hashes
       is every value compared, and it catches what a count can't: a default
       that quietly wrote itself across a column you meant to leave null.
5. Verify by dumping prod again into `<stamp>-postpush/` and diffing the dumps.
   - **Diff against the previous *post*-push dump, never the same day's
     pre-push one.** A pre-push dump is prod *before that deploy*, so if
     anything else shipped earlier the same day the diff hands you two releases
     at once. The last postpush directory **is** the baseline.
   - **Two dumps taken a minute apart are never byte-identical:** pg_dump
     writes a random `\restrict` / `\unrestrict` nonce into every file. Filter
     those two lines before comparing.
6. Merge, and let Vercel build.

**Verification after a push is a diff, not a click-through, because prod is
multi-user.** RLS scopes every row to its owner, so the rows a destructive
migration rewrites may belong to accounts you can't sign in as. Clicking through
proves only that your own data survived.

**There is no psql route into prod.** The CLI's cached credentials serve
`db dump`, `db push` and `migration list` and nothing else, so "query prod to
check X" means dumping it and reading the dump.
