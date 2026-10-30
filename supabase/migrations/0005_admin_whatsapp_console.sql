-- Read-only WhatsApp growth view for the admin console.
--
-- Reads the bot's channel_identities (WhatsApp) and joins the paying referral
-- tables so an admin can see the viral motion: how many WhatsApp identities
-- exist, how many are linked to real accounts, how many people have shared,
-- who introduced whom, and which introductions converted into a paid referral
-- (code = 'whatsapp', written by the 0003 bridge).
--
-- SECURITY DEFINER + web_is_admin() gate, same as the other admin_* console
-- RPCs. It only reads. It deliberately avoids any channel_identities timestamp
-- column (not guaranteed to exist); conversion time comes from referrals.

create or replace function public.admin_whatsapp_console()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.web_is_admin() then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'identities',    (select count(*) from public.channel_identities where lower(channel) like 'whats%'),
    'linked',        (select count(*) from public.channel_identities where lower(channel) like 'whats%' and profile_id is not null),
    'sharers',       (select count(*) from public.channel_identities where lower(channel) like 'whats%' and (share_code is not null or share_name is not null)),
    'names_used',    (select count(*) from public.channel_identities where lower(channel) like 'whats%' and share_name_used_at is not null),
    'introductions', (select count(*) from public.channel_identities where lower(channel) like 'whats%' and referred_by is not null),
    'converted',     (select count(*) from public.referrals where code = 'whatsapp'),
    'top_sharers', (
      select coalesce(jsonb_agg(t order by t.introduced desc), '[]'::jsonb) from (
        select coalesce(p.display_name, ci.share_name, left(ci.id::text, 8)) as name,
               coalesce(p.phone, ci.phone, '') as phone,
               (ci.profile_id is not null) as linked,
               (select count(*) from public.channel_identities c2 where c2.referred_by = ci.id) as introduced
        from public.channel_identities ci
        left join public.profiles p on p.id = ci.profile_id
        where lower(ci.channel) like 'whats%'
          and (ci.share_code is not null or ci.share_name is not null)
          and (select count(*) from public.channel_identities c2 where c2.referred_by = ci.id) > 0
        limit 20
      ) t
    ),
    'introductions_list', (
      select coalesce(jsonb_agg(x order by x.converted_at desc nulls last), '[]'::jsonb) from (
        select coalesce(rp.display_name, rci.share_name, left(rci.id::text, 8)) as referrer,
               coalesce(dp.display_name, d.phone, left(d.id::text, 8)) as referred,
               coalesce(dp.phone, d.phone, '') as phone,
               (d.profile_id is not null) as linked,
               (rconv.referred_id is not null) as converted,
               rconv.created_at as converted_at
        from public.channel_identities d
        left join public.channel_identities rci on rci.id = d.referred_by
        left join public.profiles rp on rp.id = rci.profile_id
        left join public.profiles dp on dp.id = d.profile_id
        left join public.referrals rconv on rconv.referred_id = d.profile_id and rconv.code = 'whatsapp'
        where lower(d.channel) like 'whats%' and d.referred_by is not null
        limit 100
      ) x
    )
  );
end;
$$;

grant execute on function public.admin_whatsapp_console() to authenticated;
