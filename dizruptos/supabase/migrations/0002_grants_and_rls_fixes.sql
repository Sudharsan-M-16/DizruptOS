-- ============================================================================
-- Migration 0002 — Supabase role grants + RLS correctness fixes
-- Discovered during live RLS validation (evidence: 54001 recursion, 42501 grant).
-- ============================================================================

-- 1) Base privileges. Supabase auto-grants these when DDL runs through its own
--    tooling; applying 0001 over a direct connection skipped them, so anon/
--    authenticated had no table access at all (42501) regardless of RLS.
--    Row visibility is still governed entirely by the RLS policies below — the
--    grants only open the door; the policies decide which rows.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- service_role (server-side repositories via PostgREST) — full access; it also
-- carries BYPASSRLS in Supabase, so server reads/writes see all rows.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Keep audit immutability (law 1): inserts allowed, mutation/deletion never.
revoke update, delete on audit_events from authenticated;
revoke insert, update, delete on audit_events from anon;

-- 2) Fix infinite recursion: auth_dept() reads `users`, but it was invoked
--    from inside the users RLS policy → policy → auth_dept() → users → ...
--    SECURITY DEFINER runs the helper as its owner, bypassing RLS for that one
--    internal lookup (a safe, bounded read of a single column by PK).
create or replace function auth_dept() returns uuid
  language sql stable security definer set search_path = public, auth as
$$ select department_id from users where id = auth.uid() $$;
