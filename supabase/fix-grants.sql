-- ════════════════════════════════════════════════════════════════════
--  Fix: grant table privileges to service_role
--  Run this in the Supabase SQL editor if you get
--  "permission denied for table ..." (error 42501).
--
--  The app accesses all data server-side with the service_role key, so we
--  grant privileges to service_role only. The public `anon` key is NOT
--  granted access (safer — no RLS policies needed for the MVP).
-- ════════════════════════════════════════════════════════════════════

grant usage on schema public to service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

-- Make future tables/sequences in this schema inherit the same grant.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
