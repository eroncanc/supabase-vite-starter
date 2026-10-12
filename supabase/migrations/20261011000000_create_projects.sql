-- The starter's one table, wired end to end so every pattern has a live
-- example: a row owned by a user, with RLS on all four operations.
--
-- Auth is handled by Supabase Auth; we reference auth.users(id) directly and do
-- not maintain a custom users table. A child table hangs off projects and its
-- policies trace back with `exists (select 1 from projects p where p.id = ...
-- and p.user_id = (select auth.uid()))`.

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create index projects_user_id_idx on projects (user_id);

alter table projects enable row level security;

create policy projects_select on projects
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy projects_insert on projects
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy projects_update on projects
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy projects_delete on projects
  for delete to authenticated
  using (user_id = (select auth.uid()));
