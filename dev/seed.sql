-- Local fixtures. Run by dev/seed.sh, which passes the user's id as :user_id.
-- Fixed ids, so a URL you had open still works after a re-seed.
\set ON_ERROR_STOP on
begin;

delete from projects where user_id = :'user_id';

insert into projects (id, user_id, name, description, created_at) values
  ('00000000-0000-4000-8000-000000000001', :'user_id', 'First project',
   'Seeded by dev/seed.sh.', now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000002', :'user_id', 'Second project',
   null, now() - interval '1 day');

commit;
