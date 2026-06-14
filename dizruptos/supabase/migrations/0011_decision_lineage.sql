-- ============================================================================
-- Migration 0011 — Decision lineage ontology.
-- Expands organizational memory beyond Decision→Outcome→Learning by making the
-- REASONING first-class: the Evidence a decision rested on, the Assumptions it
-- took as true, and the Hypotheses it predicted. This is what makes lineage
-- explorable and falsifiable:
--
--   Decision → Evidence → Assumption → Outcome → Learning → Future Decision
--
-- An assumption can later be marked violated; a hypothesis confirmed or refuted
-- — turning a decision record into a live, checkable belief network.
-- ============================================================================

create table decision_evidence (
  id          uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions(id) on delete cascade,
  org_id      uuid references organizations(id),
  source      text,                       -- where it came from (doc, metric, person)
  summary     text not null,              -- what the evidence says
  strength    text not null default 'moderate'
    check (strength in ('weak','moderate','strong')),
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);
create index idx_devidence_decision on decision_evidence(decision_id);

create table decision_assumptions (
  id          uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions(id) on delete cascade,
  org_id      uuid references organizations(id),
  statement   text not null,              -- what we assumed to be true
  status      text not null default 'unknown'
    check (status in ('holds','violated','unknown')),
  criticality text not null default 'medium'
    check (criticality in ('low','medium','high','critical')),
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);
create index idx_dassumptions_decision on decision_assumptions(decision_id);

create table decision_hypotheses (
  id          uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions(id) on delete cascade,
  org_id      uuid references organizations(id),
  statement   text not null,              -- what we predicted would happen
  status      text not null default 'open'
    check (status in ('open','confirmed','refuted')),
  confidence  numeric(3,2) check (confidence between 0 and 1),
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);
create index idx_dhypotheses_decision on decision_hypotheses(decision_id);

-- RLS — same posture as the rest of the memory ontology (authenticated read,
-- tenant-restricted, service_role full).
alter table decision_evidence    enable row level security;
alter table decision_assumptions enable row level security;
alter table decision_hypotheses  enable row level security;

grant select, insert, update on decision_evidence, decision_assumptions, decision_hypotheses to authenticated;
grant all on decision_evidence, decision_assumptions, decision_hypotheses to service_role;

create policy devidence_read    on decision_evidence    for select using (auth.uid() is not null);
create policy dassumptions_read on decision_assumptions for select using (auth.uid() is not null);
create policy dhypotheses_read  on decision_hypotheses  for select using (auth.uid() is not null);
create policy devidence_write    on decision_evidence    for insert with check (auth.uid() is not null);
create policy dassumptions_write on decision_assumptions for insert with check (auth.uid() is not null);
create policy dhypotheses_write  on decision_hypotheses  for insert with check (auth.uid() is not null);
create policy devidence_upd    on decision_evidence    for update using (auth.uid() is not null);
create policy dassumptions_upd on decision_assumptions for update using (auth.uid() is not null);
create policy dhypotheses_upd  on decision_hypotheses  for update using (auth.uid() is not null);

create policy devidence_tenant on decision_evidence as restrictive for all
  using (org_id is not distinct from auth_org()) with check (org_id is not distinct from auth_org());
create policy dassumptions_tenant on decision_assumptions as restrictive for all
  using (org_id is not distinct from auth_org()) with check (org_id is not distinct from auth_org());
create policy dhypotheses_tenant on decision_hypotheses as restrictive for all
  using (org_id is not distinct from auth_org()) with check (org_id is not distinct from auth_org());
