-- Force a network connection for a referred account so the circle milestone
-- fires. owner = the referred account (Hero, ladimariaemmanuel@gmail.com);
-- member = any other test account. The web_circle_trg trigger should award the
-- 'circle' reward (NGN 100) to that referred account's referrer.
-- Run in Supabase > SQL Editor.

insert into public.network_connections (owner_id, member_id, in_panic_circle)
values (
  (select id from auth.users where email = 'ladimariaemmanuel@gmail.com'),
  (select id from auth.users where phone = '2348142722755'),
  true
);

-- Confirm the circle reward landed for the referrer.
select ru.email as referrer, rr.milestone, rr.amount_naira, rr.created_at
from public.referral_rewards rr
join auth.users ru on ru.id = rr.referrer_id
where rr.milestone = 'circle'
order by rr.created_at desc;
