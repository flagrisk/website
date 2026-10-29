-- Grant website-admin access. Looks up the auth user by email and flags them in
-- web_roles. Safe to re-run. Change the email to grant someone else.
--
-- The person must already have an account (app, or the website) so their
-- auth.users row exists.

insert into public.web_roles (user_id, is_admin)
select id, true
from auth.users
where email = 'realgodwinmayaki@gmail.com'
on conflict (user_id) do update set is_admin = true;
