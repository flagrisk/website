-- Compliance requests from the website (account deletion and other data
-- subject requests under the Nigeria Data Protection Act 2023).
--
-- The website collects these through a form, not by email. The public
-- /api/data-request route inserts rows with the service role (bypassing RLS).
-- Admins read and work the queue through the SECURITY DEFINER RPCs below,
-- gated by web_is_admin(), the same pattern as the other admin_* console RPCs.
-- A request is an intake record only: identity is confirmed, and the account
-- is actually deleted, as a separate step worked in the console.

create table if not exists public.data_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  request_type text not null default 'deletion'
    check (request_type in ('deletion','access','correction','objection','withdraw_consent','other')),
  full_name   text,
  phone       text not null,
  email       text,
  channel     text,
  reason      text,
  status      text not null default 'new'
    check (status in ('new','verifying','verified','actioned','rejected','cancelled')),
  source      text not null default 'website',
  user_agent  text,
  handled_by  uuid references auth.users(id),
  handled_at  timestamptz,
  admin_notes text
);

-- RLS from birth. No policies, so neither anon nor authenticated can read or
-- write the table directly. Writes come from the service-role API route;
-- reads and status changes come from the admin RPCs below.
alter table public.data_requests enable row level security;

create index if not exists data_requests_status_idx on public.data_requests (status, created_at desc);
create index if not exists data_requests_phone_idx  on public.data_requests (phone);

-- Admin console: the full queue plus headline counts.
create or replace function public.admin_data_requests()
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
    'counts', jsonb_build_object(
      'new',       (select count(*) from public.data_requests where status = 'new'),
      'verifying', (select count(*) from public.data_requests where status = 'verifying'),
      'open',      (select count(*) from public.data_requests where status in ('new','verifying','verified')),
      'total',     (select count(*) from public.data_requests)
    ),
    'requests', (
      select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb) from (
        select id, created_at, request_type, full_name, phone, email, channel,
               reason, status, source, handled_at, admin_notes
        from public.data_requests
        order by created_at desc
        limit 500
      ) r
    )
  );
end;
$$;

grant execute on function public.admin_data_requests() to authenticated;

-- Admin console: move a request through the queue and record a note.
create or replace function public.admin_set_data_request_status(
  p_id uuid, p_status text, p_notes text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.web_is_admin() then
    raise exception 'not authorized';
  end if;
  if p_status not in ('new','verifying','verified','actioned','rejected','cancelled') then
    raise exception 'invalid status';
  end if;

  update public.data_requests
     set status      = p_status,
         admin_notes = coalesce(nullif(p_notes, ''), admin_notes),
         handled_by  = auth.uid(),
         handled_at  = now()
   where id = p_id;

  if not found then
    raise exception 'not found';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_set_data_request_status(uuid, text, text) to authenticated;
