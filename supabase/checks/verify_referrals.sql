-- Smoke-test queries for the referral + payout engine. Read-only SELECTs.
-- Run any of these in Supabase SQL Editor while testing the website.

-- 1. Referral codes issued (one per member who opened their dashboard)
select rc.code, u.email, rc.created_at
from public.referral_codes rc
join auth.users u on u.id = rc.user_id
order by rc.created_at desc
limit 20;

-- 2. Who referred whom
select ru.email as referrer, rd.email as referred, r.code, r.created_at
from public.referrals r
join auth.users ru on ru.id = r.referrer_id
join auth.users rd on rd.id = r.referred_id
order by r.created_at desc
limit 20;

-- 3. Milestone rewards earned (signup / circle / paid_plan)
select ru.email as referrer, rd.email as referred,
       rr.milestone, rr.amount_naira, rr.created_at
from public.referral_rewards rr
join auth.users ru on ru.id = rr.referrer_id
join auth.users rd on rd.id = rr.referred_id
order by rr.created_at desc
limit 40;

-- 4. Earnings per referrer (lifetime)
select ru.email as referrer, sum(rr.amount_naira) as earned_naira,
       count(*) as milestones
from public.referral_rewards rr
join auth.users ru on ru.id = rr.referrer_id
group by ru.email
order by earned_naira desc;

-- 5. Payout accounts and payouts
select u.email, pr.account_name, pr.bank_code, pr.created_at
from public.payout_recipients pr
join auth.users u on u.id = pr.user_id
order by pr.created_at desc;

select u.email, p.amount_naira, p.status, p.failure_reason, p.created_at
from public.payouts p
join auth.users u on u.id = p.user_id
order by p.created_at desc
limit 20;

-- 6. Current tier of a given user (what the app gates on; set by the charge webhook)
-- select email, current_tier from auth.users u
-- join public.profiles pr on pr.id = u.id where email = 'someone@example.com';
