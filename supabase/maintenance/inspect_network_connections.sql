-- Lists the columns of network_connections (name, type, nullable, default), so a
-- manual insert can include every required field. Run in Supabase > SQL Editor.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'network_connections'
order by ordinal_position;
