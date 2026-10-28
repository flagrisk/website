-- FlagRisk website schema, part 2 of 2: milestone triggers on APP-OWNED tables.
--
-- REVIEW BEFORE RUNNING. Unlike 0001, this file adds triggers to tables the
-- mobile app writes (profiles, network_connections). They exist so a referral
-- milestone is awarded no matter which surface the referred person used (app,
-- website, or WhatsApp) — the "one brain" principle.
--
-- Safety: both trigger functions are wrapped so they can NEVER block or fail the
-- host write. If anything inside goes wrong, the exception is swallowed and the
-- app's insert/update proceeds normally. award_referral_reward is idempotent
-- (unique(referred_id, milestone)), so firing on every row change is harmless.
--
-- Depends on 0001 (award_referral_reward, referrals, referral_rewards).

-- =========================================================================
-- paid_plan: fires when a user's tier becomes a paid one.
-- The app reads profiles.current_tier to gate features; paystack-verify sets it.
-- =========================================================================
create or replace function public.web_award_paid_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    if coalesce(NEW.current_tier, 'basic') in ('standard', 'pro', 'premium')
       and coalesce(NEW.current_tier, 'basic') is distinct from coalesce(OLD.current_tier, 'basic')
    then
      perform public.award_referral_reward(NEW.id, 'paid_plan');
    end if;
  exception when others then
    -- never let a referral problem roll back the app's profile write
    null;
  end;
  return NEW;
end;
$$;

drop trigger if exists web_paid_plan_trg on public.profiles;
create trigger web_paid_plan_trg
  after update of current_tier on public.profiles
  for each row
  execute function public.web_award_paid_plan();

-- =========================================================================
-- circle: fires when a user gets their first network connection (owner side).
-- The app treats network_connections (owner_id) count as the user's circle.
-- Idempotent, so firing on later connections does nothing extra.
-- =========================================================================
create or replace function public.web_award_circle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.award_referral_reward(NEW.owner_id, 'circle');
  exception when others then
    null;
  end;
  return NEW;
end;
$$;

drop trigger if exists web_circle_trg on public.network_connections;
create trigger web_circle_trg
  after insert on public.network_connections
  for each row
  execute function public.web_award_circle();
