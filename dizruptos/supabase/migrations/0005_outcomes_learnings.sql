-- ============================================================================
-- Migration 0005 — Outcome + Learning ontology (Decision Intelligence sprint).
-- "A decision without an outcome is incomplete." These make the org's memory
-- closeable: Decision → Outcome → Learning, linkable to capabilities/projects/
-- people — the substrate for retrospective intelligence and institutional memory.
-- ============================================================================

create table outcomes (
  id            uuid primary key default gen_random_uuid(),
  decision_id   uuid not null references decisions(id) on delete cascade,
  expected      text,
  actual        text,
  measured      text,
  status        text not null default 'pending'
    check (status in ('pending','succeeded','partial','failed','reversed')),
  confidence    numeric(3,2) check (confidence between 0 and 1),
  project_id    uuid references projects(id),
  capability_id uuid references capabilities(id),
  recorded_by   uuid references users(id),
  recorded_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index idx_outcomes_decision on outcomes(decision_id);
create index idx_outcomes_status on outcomes(status);

create table learnings (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  insight       text not null,
  decision_id   uuid references decisions(id),
  outcome_id    uuid references outcomes(id),
  capability_id uuid references capabilities(id),
  project_id    uuid references projects(id),
  created_by    uuid references users(id),
  created_at    timestamptz not null default now()
);
create index idx_learnings_decision on learnings(decision_id);
create index idx_learnings_capability on learnings(capability_id);

alter table outcomes  enable row level security;
alter table learnings enable row level security;
grant select, insert, update on outcomes, learnings to authenticated;
grant all on outcomes, learnings to service_role;
create policy outcomes_read  on outcomes  for select using (auth.uid() is not null);
create policy learnings_read on learnings for select using (auth.uid() is not null);
create policy outcomes_write  on outcomes  for insert with check (auth.uid() is not null);
create policy learnings_write on learnings for insert with check (auth.uid() is not null);
