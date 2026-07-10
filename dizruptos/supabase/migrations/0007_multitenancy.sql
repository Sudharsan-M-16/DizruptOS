-- ============================================================================
-- Migration 0007 — Multi-tenancy + tenant isolation (Identity sprint).
-- Adds org_id to every tenant-scoped entity and enforces isolation with
-- RESTRICTIVE RLS policies (AND-combined with the existing role policies, so a
-- user can never see another organization's data regardless of role). The
-- service_role (server) bypasses RLS and scopes in the loader; direct
-- authenticated/anon access is hard tenant-isolated.
-- ============================================================================

-- 1) org_id everywhere it's missing, backfilled to the seeded org.
alter table users     add column if not exists org_id uuid references organizations(id);
alter table projects  add column if not exists org_id uuid references organizations(id);
alter table tasks     add column if not exists org_id uuid references organizations(id);
alter table risks     add column if not exists org_id uuid references organizations(id);
alter table decisions add column if not exists org_id uuid references organizations(id);
alter table outcomes  add column if not exists org_id uuid references organizations(id);
alter table learnings add column if not exists org_id uuid references organizations(id);
alter table approvals add column if not exists org_id uuid references organizations(id);

-- backfill: single existing org (Dizrupt Inc)
do $$
declare v_org uuid;
begin
  select id into v_org from organizations order by created_at limit 1;
  update users     set org_id = coalesce(org_id, v_org);
  update projects  set org_id = coalesce(org_id, v_org);
  update tasks     set org_id = coalesce(org_id, v_org);
  update risks     set org_id = coalesce(org_id, v_org);
  update decisions set org_id = coalesce(org_id, v_org);
  update outcomes  set org_id = coalesce(org_id, v_org);
  update learnings set org_id = coalesce(org_id, v_org);
  update approvals set org_id = coalesce(org_id, v_org);
end $$;

create index if not exists idx_users_org on users(org_id);
create index if not exists idx_projects_org on projects(org_id);
create index if not exists idx_risks_org on risks(org_id);
create index if not exists idx_decisions_org on decisions(org_id);

-- 2) caller's org, resolved from their user row (SECURITY DEFINER → no RLS recursion).
create or replace function auth_org() returns uuid
  language sql stable security definer set search_path = public, auth as
$$ select org_id from users where id = auth.uid() $$;

-- 3) RESTRICTIVE tenant policies — AND-ed with existing permissive role policies.
--    A row is visible only if it belongs to the caller's org.
do $$
declare t text;
begin
  foreach t in array array['users','projects','tasks','risks','decisions','outcomes','learnings','approvals','capabilities','teams']
  loop
    execute format('drop policy if exists %1$s_tenant on %1$I', t, t);
    execute format(
      'create policy %1$s_tenant on %1$I as restrictive for all using (org_id is not distinct from auth_org()) with check (org_id is not distinct from auth_org())',
      t, t
    );
  end loop;
end $$;
