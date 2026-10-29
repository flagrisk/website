-- Grant website-admin rights to the referrer test account so it can run payouts
-- from /admin during testing. Run in Supabase > SQL Editor.
insert into public.web_roles (user_id, is_admin)
select id, true from auth.users where email = 'mayakigodwinmonday@gmail.com'
on conflict (user_id) do update set is_admin = true;
