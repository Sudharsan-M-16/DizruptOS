-- ============================================================================
-- Migration 0010 — Recommendation lifecycle + embedded prediction writeback.
-- Recommendations become first-class operational entities with a lifecycle; on
-- ACCEPT a prediction is written (confidence/baseline/expected_delta); when an
-- outcome lands, actual_value + accuracy close the loop → feed calibration.
-- ============================================================================
create table recommendations (
  id             text primary key,           -- engine rec key (e.g. cross_train:<capId>), stable per org
  org_id         uuid references organizations(id),
  type           text not null,
  title          text not null,
  rationale      text,
  impact         text,
  priority       double precision,
  evidence       jsonb not null default '[]',
  trace_kind     text, trace_id text, trace_label text,
  status         text not null default 'pending'
    check (status in ('pending','acknowledged','accepted','rejected','deferred','completed','measured')),
  actor_id       uuid references users(id),
  -- prediction (set on accept)
  confidence     double precision,
  baseline_value double precision,
  expected_delta double precision,
  -- outcome (set on measure)
  actual_value   double precision,
  accuracy       double precision,
  accepted_at    timestamptz,
  decided_at     timestamptz,
  measured_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_recs_org_status on recommendations(org_id, status);

alter table recommendations enable row level security;
grant select, insert, update on recommendations to authenticated;
grant all on recommendations to service_role;
create policy recs_read  on recommendations for select using (auth.uid() is not null);
create policy recs_write on recommendations for insert with check (auth.uid() is not null);
create policy recs_upd   on recommendations for update using (auth.uid() is not null);
create policy recs_tenant on recommendations as restrictive for all
  using (org_id is not distinct from auth_org()) with check (org_id is not distinct from auth_org());
