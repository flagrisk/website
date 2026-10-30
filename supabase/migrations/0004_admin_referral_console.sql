-- Admin read functions for the Referrals and Payouts sections of the console.
-- Same shape as the other admin_* RPCs (SECURITY DEFINER, return jsonb), gated
-- by web_is_admin() so only website admins get the data. The console calls these
-- with the signed-in admin's session.

create or replace function public.admin_referral_console()
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
    'referred',     (select count(*) from public.referrals),
    'earned',       (select coalesce(sum(amount_naira), 0) from public.referral_rewards),
    'paid_out',     (select coalesce(sum(amount_naira), 0) from public.payouts where status = 'paid'),
    'pending_sum',  (select coalesce(sum(amount_naira), 0) from public.payouts where status in ('pending','processing')),
    'pending_count',(select count(*) from public.payouts where status in ('pending','processing')),
    'top_referrers', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(p.display_name, left(rr.referrer_id::text, 8)) as name,
               sum(rr.amount_naira) as amount
        from public.referral_rewards rr
        left join public.profiles p on p.id = rr.referrer_id
        group by rr.referrer_id, p.display_name
        order by sum(rr.amount_naira) desc
        limit 10
      ) t
    ),
    'members', (
      select coalesce(jsonb_agg(m order by m.earned desc), '[]'::jsonb) from (
        select coalesce(p.display_name, '') as name,
               coalesce(p.phone, '') as phone,
               coalesce(p.current_tier, 'basic') as tier,
               (select count(*) from public.referrals r where r.referrer_id = rc.user_id) as referred,
               (select coalesce(sum(amount_naira),0) from public.referral_rewards rw where rw.referrer_id = rc.user_id) as earned,
               rc.created_at as joined
        from public.referral_codes rc
        left join public.profiles p on p.id = rc.user_id
      ) m
    ),
    'referrals', (
      select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
        select coalesce(pr.display_name, left(r.referrer_id::text, 8)) as referrer,
               coalesce(pd.display_name, left(r.referred_id::text, 8)) as referred,
               (select coalesce(array_agg(milestone), '{}') from public.referral_rewards rw where rw.referred_id = r.referred_id) as milestones,
               r.created_at
        from public.referrals r
        left join public.profiles pr on pr.id = r.referrer_id
        left join public.profiles pd on pd.id = r.referred_id
      ) x
    )
  );
end;
$$;

create or replace function public.admin_payout_console()
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
    'payouts', (
      select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
        select pay.id,
               coalesce(p.display_name, left(pay.user_id::text, 8)) as member,
               pay.amount_naira,
               pay.status,
               pay.failure_reason,
               pay.created_at
        from public.payouts pay
        left join public.profiles p on p.id = pay.user_id
      ) x
    )
  );
end;
$$;

grant execute on function public.admin_referral_console() to authenticated;
grant execute on function public.admin_payout_console() to authenticated;
