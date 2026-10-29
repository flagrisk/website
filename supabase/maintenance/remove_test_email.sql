-- Strip the receipt email off a test account so it is phone-only again, to
-- re-test the opt-in email flow at checkout. The phone login is untouched.
-- Run in Supabase > SQL Editor. Change the email below if you used a different one.

-- 1. Remove the email identity (the account keeps its phone identity).
delete from auth.identities
where provider = 'email'
  and user_id = (
    select id from auth.users where email = 'ladimariaemmanuel@gmail.com'
  );

-- 2. Clear the email from the user record.
update auth.users
set email = null,
    email_confirmed_at = null
where email = 'ladimariaemmanuel@gmail.com';

-- Check: should return the account with a null email and its phone still set.
select id, phone, email, email_confirmed_at
from auth.users
where phone is not null
order by created_at desc
limit 5;
