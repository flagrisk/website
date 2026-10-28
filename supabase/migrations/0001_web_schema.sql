-- FlagRisk website schema, part 1 of 2: net-new objects only.
--
-- This runs on the SHARED Supabase project (ref aqgkntulbuqqqjxjafmw) that also
-- serves the mobile app and the WhatsApp bot. Everything in this file is new and
-- touches NOTHING the app already owns:
--   * it creates no table that already exists (the app has profiles,
--     subscriptions, payments, network_connections, notifications, trips,
--     saved_places, reports, risk_categories, notification_preferences);
--   * it defines no function the app already uses, and the one name that could
--     have collided (is_admin) is renamed web_is_admin.
--
-- Subscriptions are NOT handled here. The app's paystack-init / paystack-verify
-- Edge Functions own profiles.current_tier, subscriptions and payments; the
-- website reuses them. The referral "paid_plan" and "circle" milestones are
-- awarded by triggers in 0002_web_triggers.sql, which does touch app tables and
-- is kept separate so it can be reviewed on its own.
--
-- Safe to re-run (IF NOT EXISTS / OR REPLACE throughout).

-- =========================================================================
-- 0. Extensions
-- =========================================================================
create extension if not exists pgcrypto;

-- =========================================================================
-- 1. Website admin roles (the web console is new; the app has no admin flag)
-- =========================================================================
create table if not exists public.web_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.web_roles enable row level security;

drop policy if exists web_roles_self_read on public.web_roles;
create policy web_roles_self_read on public.web_roles
  for select using (auth.uid() = user_id);

-- Named web_is_admin to avoid clobbering any existing is_admin() in public.
create or replace function public.web_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select r.is_admin from public.web_roles r where r.user_id = auth.uid()),
    false
  );
$$;

drop policy if exists web_roles_admin_read on public.web_roles;
create policy web_roles_admin_read on public.web_roles
  for select using (public.web_is_admin());

-- =========================================================================
-- 2. Referral codes (one stable code per member)
-- =========================================================================
create table if not exists public.referral_codes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  code       text not null unique,
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;

drop policy if exists referral_codes_self_read on public.referral_codes;
create policy referral_codes_self_read on public.referral_codes
  for select using (auth.uid() = user_id);

create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- no 0/O/1/I/L
  result   text := '';
  i        int;
begin
  for i in 1..7 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.ensure_referral_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  uid       uuid := auth.uid();
  existing  text;
  candidate text;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select code into existing from public.referral_codes where user_id = uid;
  if existing is not null then
    return existing;
  end if;

  loop
    candidate := public.generate_referral_code();
    begin
      insert into public.referral_codes (user_id, code) values (uid, candidate);
      return candidate;
    exception when unique_violation then
      -- collision; try another
    end;
  end loop;
end;
$$;

-- =========================================================================
-- 3. Referrals (who referred whom)
-- =========================================================================
create table if not exists public.referrals (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null unique references auth.users(id) on delete cascade,
  code        text not null,
  created_at  timestamptz not null default now(),
  constraint referrals_no_self check (referrer_id <> referred_id)
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

alter table public.referrals enable row level security;

drop policy if exists referrals_self_read on public.referrals;
create policy referrals_self_read on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

drop policy if exists referrals_admin_read on public.referrals;
create policy referrals_admin_read on public.referrals
  for select using (public.web_is_admin());

-- =========================================================================
-- 4. Referral rewards (one row per earned milestone)
-- =========================================================================
create table if not exists public.referral_rewards (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references auth.users(id) on delete cascade,
  referred_id  uuid not null references auth.users(id) on delete cascade,
  milestone    text not null check (milestone in ('signup','circle','paid_plan')),
  amount_naira integer not null check (amount_naira >= 0),
  created_at   timestamptz not null default now(),
  unique (referred_id, milestone)      -- each milestone pays at most once per person
);

create index if not exists referral_rewards_referrer_idx on public.referral_rewards(referrer_id);

alter table public.referral_rewards enable row level security;

drop policy if exists referral_rewards_self_read on public.referral_rewards;
create policy referral_rewards_self_read on public.referral_rewards
  for select using (auth.uid() = referrer_id);

drop policy if exists referral_rewards_admin_read on public.referral_rewards;
create policy referral_rewards_admin_read on public.referral_rewards
  for select using (public.web_is_admin());

-- award_referral_reward(p_referred, p_milestone): grant one milestone reward to
-- whoever referred p_referred, if not already granted. Idempotent via the
-- unique(referred_id, milestone) constraint. SECURITY DEFINER so trusted code
-- and the 0002 triggers can call it. Callable by trusted server code; NOT
-- granted to authenticated, so members cannot mint their own rewards.
create or replace function public.award_referral_reward(p_referred uuid, p_milestone text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_referrer uuid;
  v_amount   integer;
begin
  select referrer_id into v_referrer
  from public.referrals
  where referred_id = p_referred;

  if v_referrer is null then
    return;  -- not referred by anyone
  end if;

  v_amount := case p_milestone
    when 'signup'    then 100
    when 'circle'    then 100
    when 'paid_plan' then 200
    else null
  end;
  if v_amount is null then
    raise exception 'unknown milestone %', p_milestone;
  end if;

  insert into public.referral_rewards (referrer_id, referred_id, milestone, amount_naira)
  values (v_referrer, p_referred, p_milestone, v_amount)
  on conflict (referred_id, milestone) do nothing;
end;
$$;

-- record_referral(p_code): called once, just after a new user signs up, to
-- attach them to their referrer and award the signup milestone.
create or replace function public.record_referral(p_code text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  uid        uuid := auth.uid();
  v_referrer uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_code is null or length(trim(p_code)) = 0 then
    return;
  end if;

  select user_id into v_referrer
  from public.referral_codes
  where code = upper(trim(p_code));

  if v_referrer is null or v_referrer = uid then
    return;  -- unknown code or self-referral
  end if;

  if exists (select 1 from public.referrals where referred_id = uid) then
    return;  -- already attributed
  end if;

  insert into public.referrals (referrer_id, referred_id, code)
  values (v_referrer, uid, upper(trim(p_code)));

  perform public.award_referral_reward(uid, 'signup');
end;
$$;

-- =========================================================================
-- 5. Payout recipients (Paystack transfer recipient per member)
-- =========================================================================
create table if not exists public.payout_recipients (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  bank_code      text not null,
  account_number text not null,
  account_name   text not null,
  recipient_code text not null,          -- Paystack recipient code (RCP_...)
  created_at     timestamptz not null default now()
);

alter table public.payout_recipients enable row level security;

drop policy if exists payout_recipients_self_read on public.payout_recipients;
create policy payout_recipients_self_read on public.payout_recipients
  for select using (auth.uid() = user_id);

drop policy if exists payout_recipients_admin_read on public.payout_recipients;
create policy payout_recipients_admin_read on public.payout_recipients
  for select using (public.web_is_admin());

-- =========================================================================
-- 6. Payouts (a withdrawal of referral earnings)
-- =========================================================================
create table if not exists public.payouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount_naira integer not null check (amount_naira > 0),
  status       text not null default 'pending'
                 check (status in ('pending','processing','paid','failed','reversed')),
  paystack_transfer_code text,
  paystack_ref text,
  failure_reason text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists payouts_user_idx on public.payouts(user_id);

alter table public.payouts enable row level security;

drop policy if exists payouts_self_read on public.payouts;
create policy payouts_self_read on public.payouts
  for select using (auth.uid() = user_id);

drop policy if exists payouts_admin_read on public.payouts;
create policy payouts_admin_read on public.payouts
  for select using (public.web_is_admin());

-- my_referral_balance(): earned, committed (paid + in-flight), and available.
create or replace function public.my_referral_balance()
returns table (
  earned_naira    integer,
  paid_naira      integer,
  available_naira integer
)
language sql
stable
security definer
set search_path = public
as $$
  with uid as (select auth.uid() as id),
  earned as (
    select coalesce(sum(amount_naira), 0)::int as total
    from public.referral_rewards, uid
    where referrer_id = uid.id
  ),
  committed as (
    select coalesce(sum(amount_naira), 0)::int as total
    from public.payouts, uid
    where user_id = uid.id
      and status in ('pending','processing','paid')
  )
  select earned.total, committed.total, (earned.total - committed.total)
  from earned, committed;
$$;

-- request_payout(p_amount): create a pending payout if the member has the funds
-- and a payout account. The Paystack transfer is fired by trusted server code
-- after this returns.
create or replace function public.request_payout(p_amount integer)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  uid     uuid := auth.uid();
  v_avail integer;
  v_payout uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_amount is null or p_amount < 1000 then
    raise exception 'minimum payout is 1000 naira';
  end if;
  if not exists (select 1 from public.payout_recipients where user_id = uid) then
    raise exception 'no payout account on file';
  end if;

  select available_naira into v_avail from public.my_referral_balance();
  if v_avail < p_amount then
    raise exception 'insufficient balance';
  end if;

  insert into public.payouts (user_id, amount_naira, status)
  values (uid, p_amount, 'pending')
  returning id into v_payout;

  return v_payout;
end;
$$;

-- =========================================================================
-- 7. Grants (tables stay behind RLS; only safe RPCs are callable by members)
-- =========================================================================
grant execute on function public.web_is_admin()            to authenticated;
grant execute on function public.ensure_referral_code()    to authenticated;
grant execute on function public.record_referral(text)     to authenticated;
grant execute on function public.my_referral_balance()     to authenticated;
grant execute on function public.request_payout(integer)   to authenticated;
-- award_referral_reward is intentionally NOT granted to authenticated.
