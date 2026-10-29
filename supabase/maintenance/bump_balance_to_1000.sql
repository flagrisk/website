-- Top up the referrer's referral balance to NGN 1000 so the payout flow can be
-- tested (the live minimum is NGN 1000 during testing; it returns to NGN 3000
-- for production). Adds one test reward equal to the gap. This is test data and
-- can be deleted later. Run in Supabase > SQL Editor AFTER force_circle.sql.

with g as (
  select id from auth.users where email = 'mayakigodwinmonday@gmail.com'
),
cur as (
  select coalesce(sum(amount_naira), 0) as total
  from public.referral_rewards rr, g
  where rr.referrer_id = g.id
)
insert into public.referral_rewards (referrer_id, referred_id, milestone, amount_naira)
select (select id from g),
       (select id from auth.users where phone = '2348166853564'),
       'paid_plan',
       1000 - (select total from cur)
from cur
where (select total from cur) < 1000
  and not exists (
    select 1 from public.referral_rewards
    where referred_id = (select id from auth.users where phone = '2348166853564')
      and milestone = 'paid_plan'
  );

-- Check the new total (should be 1000).
select coalesce(sum(amount_naira), 0) as balance_naira
from public.referral_rewards
where referrer_id = (select id from auth.users where email = 'mayakigodwinmonday@gmail.com');
