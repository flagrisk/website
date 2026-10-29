-- Recon round 2: how the bot links a WhatsApp identity to a user account, and
-- what its referral-noting functions actually do (where they store the
-- attribution, and whether they award rewards). Run each block separately.

-- BLOCK A: channel_identities columns (the WhatsApp-identity to user-account link).
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'channel_identities'
order by ordinal_position;

-- BLOCK B: the source of the bot's referral-noting functions.
select proname, pg_get_functiondef(oid) as definition
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('channel_note_referral', 'channel_note_referral_name');
