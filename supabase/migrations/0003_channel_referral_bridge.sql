-- Bridge the WhatsApp bot's referral capture into the paying referral engine.
--
-- The bot already sets channel_identities.referred_by (the referrer's WhatsApp
-- identity) via channel_note_referral / channel_note_referral_name. It does not
-- pay anything. This adds ONE trigger that, when a referred WhatsApp identity is
-- linked to a real account (profile_id) and its referrer is too, records the
-- referral and awards the signup milestone, feeding the same referrals /
-- referral_rewards tables the website and app already use.
--
-- SAFETY:
--   * It changes no existing bot function or table structure.
--   * The trigger body is wrapped so it can NEVER fail or roll back a bot write.
--   * on conflict / unique(referred_id, milestone) make it idempotent and
--     impossible to double-pay (a person already referred on web/app keeps that
--     attribution; a second award is a no-op).
--   * To remove it: drop trigger web_channel_referral_trg on channel_identities.
--
-- profile_id on channel_identities references the same id as auth.users /
-- profiles, so it is a valid referrer_id / referred_id for referral_rewards.

create or replace function public.web_bridge_channel_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_profile uuid;
begin
  begin
    if NEW.profile_id is not null and NEW.referred_by is not null then
      -- the referrer's real account, via their WhatsApp identity
      select ci.profile_id into v_referrer_profile
      from public.channel_identities ci
      where ci.id = NEW.referred_by;

      if v_referrer_profile is not null
         and v_referrer_profile <> NEW.profile_id then
        insert into public.referrals (referrer_id, referred_id, code)
        values (v_referrer_profile, NEW.profile_id, 'whatsapp')
        on conflict (referred_id) do nothing;

        perform public.award_referral_reward(NEW.profile_id, 'signup');
      end if;
    end if;
  exception when others then
    -- never let a referral problem break a bot write
    null;
  end;
  return NEW;
end;
$$;

drop trigger if exists web_channel_referral_trg on public.channel_identities;
create trigger web_channel_referral_trg
  after update of referred_by, profile_id on public.channel_identities
  for each row
  execute function public.web_bridge_channel_referral();
