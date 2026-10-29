-- Recon: does the WhatsApp bot already record referrals/introductions, and
-- where? Run each block separately in Supabase > SQL Editor and paste each
-- output (the editor shows only the last result when several run at once).

-- BLOCK 1: columns of every table that looks referral/invite/whatsapp/network
-- related. Shows what structures exist for attribution.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    table_name ilike '%referr%' or table_name ilike '%invit%'
    or table_name ilike '%whatsapp%' or table_name ilike '%wa\_%'
    or table_name ilike '%introduc%' or table_name ilike '%network%'
    or table_name ilike '%tell%' or table_name ilike '%friend%'
  )
order by table_name, ordinal_position;

-- BLOCK 2: functions (RPCs) that look referral/invite/"tell a friend" related.
-- Shows the logic the bot calls to attribute an introduction.
select proname as function_name,
       pg_get_function_identity_arguments(oid) as args
from pg_proc
where pronamespace = 'public'::regnamespace
  and (
    proname ilike '%referr%' or proname ilike '%invit%'
    or proname ilike '%introduc%' or proname ilike '%tell%'
    or proname ilike '%friend%' or proname ilike '%whatsapp%'
  )
order by proname;

-- BLOCK 3: a full table list, for anything the patterns above missed.
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
