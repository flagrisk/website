-- Read why a payout failed: failure_reason holds the exact Paystack error.
-- Run in Supabase > SQL Editor.
select u.email, p.amount_naira, p.status, p.failure_reason,
       p.paystack_transfer_code, p.paystack_ref, p.created_at
from public.payouts p
join auth.users u on u.id = p.user_id
order by p.created_at desc
limit 5;
