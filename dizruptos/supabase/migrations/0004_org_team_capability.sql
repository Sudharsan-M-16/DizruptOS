-- ============================================================================
-- Migration 0004 — Organization / Team / Capability ontology (CTO_REVIEW Tier 1).
-- Adds the entities that unlock computed organizational intelligence: a tenant
-- root (organizations), cross-cutting teams, and capabilities as FIRST-CLASS
-- nodes (not a text[] on users) with rated person↔capability and
-- project↔capability edges — the substrate for expertise/bus-factor/succession.
-- ============================================================================

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  created_at  timestamptz not null default now()
);

-- Multi-tenancy foundation: org_id flows down. Nullable now; backfilled in seed,
-- enforced once auth maps users → org (CTO review: add before real data grows).
alter table departments add column if not exists org_id uuid references organizations(id);

create table teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  org_id        uuid references organizations(id),
  department_id uuid references departments(id),
  lead_id       uuid references users(id),
  created_at    timestamptz not null default now()
);

create table team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role    text not null default 'member',
  primary key (team_id, user_id)
);

-- Capabilities as objects — ratable, relatable, gap-analyzable.
create table capabilities (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  category             text,  -- engineering | finance | operations | ...
  description          text,
  strategic_importance text not null default 'medium'
    check (strategic_importance in ('low','medium','high','critical')),
  org_id               uuid references organizations(id),
  created_at           timestamptz not null default now()
);
create unique index idx_capabilities_name_org on capabilities(org_id, lower(name));

-- person ↔ capability (proficiency 1=novice .. 5=expert) — powers bus factor,
-- expertise concentration, succession risk.
create table employee_capabilities (
  user_id          uuid not null references users(id) on delete cascade,
  capability_id    uuid not null references capabilities(id) on delete cascade,
  proficiency      integer not null check (proficiency between 1 and 5),
  is_primary       boolean not null default false,
  years_experience numeric(4,1) not null default 0,
  last_used        date,
  primary key (user_id, capability_id)
);
create index idx_empcap_cap on employee_capabilities(capability_id, proficiency desc);

-- project ↔ capability (what a project needs) — powers capability demand / gaps.
create table project_capabilities (
  project_id    uuid not null references projects(id) on delete cascade,
  capability_id uuid not null references capabilities(id) on delete cascade,
  importance    text not null default 'required' check (importance in ('required','preferred','nice_to_have')),
  primary key (project_id, capability_id)
);
create index idx_projcap_cap on project_capabilities(capability_id);

-- RLS + grants (org reference data: authenticated may read; writes server-side).
alter table organizations        enable row level security;
alter table teams                enable row level security;
alter table team_members         enable row level security;
alter table capabilities         enable row level security;
alter table employee_capabilities enable row level security;
alter table project_capabilities enable row level security;

grant select on organizations, teams, team_members, capabilities, employee_capabilities, project_capabilities to anon, authenticated;
grant insert, update, delete on teams, team_members, capabilities, employee_capabilities, project_capabilities to authenticated;
grant all on organizations, teams, team_members, capabilities, employee_capabilities, project_capabilities to service_role;

-- Authenticated members of the org can read this reference data; service_role
-- (server) bypasses. (Tightened to org scope once auth issues org_id claims.)
create policy org_read on organizations for select using (auth.uid() is not null);
create policy teams_read on teams for select using (auth.uid() is not null);
create policy team_members_read on team_members for select using (auth.uid() is not null);
create policy capabilities_read on capabilities for select using (auth.uid() is not null);
create policy empcap_read on employee_capabilities for select using (auth.uid() is not null);
create policy projcap_read on project_capabilities for select using (auth.uid() is not null);
