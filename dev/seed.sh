#!/usr/bin/env bash
#
# Fill the local database with fixtures worth looking at.
#
#   dev/seed.sh                     # seed, and print a sign-in link
#   dev/seed.sh me@example.com      # seed into a different local account
#
# Local only, by construction: it reads its connection details from
# `supabase status`, which only ever describes the containers on this machine.
# It never touches the linked project.
#
# Re-running is the point -- the seed deletes the account's projects first and
# writes the same fixed ids back, so a URL you had open still works. Anything
# you added by hand to that account goes with them.
set -euo pipefail

EMAIL="${1:-${SEED_EMAIL:-dev@starter.test}}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Where the app is served, and so where a magic link has to come back to. It's
# an exact-match allow-list in config.toml -- change the Vite port and this has
# to change with it.
APP_URL="${APP_URL:-http://localhost:5173}"

if ! supabase status >/dev/null 2>&1; then
  echo "The local stack isn't running. Start Docker or OrbStack, then:" >&2
  echo "  supabase start" >&2
  exit 1
fi

# Only the KEY="value" lines: `supabase status` also prints which services are
# stopped, which isn't shell.
eval "$(supabase status -o env 2>/dev/null | grep -E '^[A-Z_]+=')"

# psql isn't a dependency of this project, so fall back to the one already
# inside the database container.
DB_CONTAINER="$(docker ps --filter 'name=supabase_db_' --format '{{.Names}}' | head -1)"
run_sql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DB_URL" "$@"
  elif [ -n "$DB_CONTAINER" ]; then
    docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres "$@"
  else
    echo "No psql on PATH and no supabase_db_* container to borrow one from." >&2
    exit 1
  fi
}

# The user is made through the Auth API rather than by inserting into
# auth.users: the columns that table wants are Auth's business, not ours, and
# they change between versions. Already-registered is a success here.
curl -sS -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"email_confirm\":true}" >/dev/null

USER_ID="$(run_sql -At -c "select id from auth.users where email = '$EMAIL'")"
if [ -z "$USER_ID" ]; then
  echo "Could not create or find a local user for $EMAIL." >&2
  exit 1
fi

# -q so the INSERT lines don't scroll the useful output away. seed.sql
# sets ON_ERROR_STOP and wraps itself in a transaction, so a failure leaves the
# database as it was rather than half-seeded.
run_sql -q -v "user_id=$USER_ID" < "$ROOT/dev/seed.sql"

# Signing in is the one step that can't be done from here, so hand over a link
# rather than an instruction. It's single-use: run the script again for another.
LINK="$(curl -sS -X POST "$API_URL/auth/v1/admin/generate_link" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"type\":\"magiclink\",\"email\":\"$EMAIL\",\"options\":{\"redirect_to\":\"$APP_URL\"}}" \
  | sed -n 's/.*"action_link":"\([^"]*\)".*/\1/p' | sed 's/\\u0026/\&/g')"

cat <<INFO

Seeded $EMAIL with two projects.

Sign in (single use):
  $LINK

App     $APP_URL
Inbox   $MAILPIT_URL
Studio  $STUDIO_URL
INFO
