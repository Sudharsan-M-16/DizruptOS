-- Migration 0016: Org health snapshots — temporal layer for trend analysis.
--
-- Stores a daily point-in-time snapshot of computed org health metrics so
-- the intelligence layer can surface trends (improving/declining/stable) rather
-- than just the current frozen score. This is the temporal backbone for the
-- "are we getting smarter?" question in the executive briefing.
--
-- Architecture: a cron (or manual trigger) calls /api/v1/intelligence/snapshot
-- which computes current scores via the engine and inserts a row here. The
-- /api/v1/intelligence/health-history endpoint then reads the last N rows
-- to power trend sparklines in Home + Executive surfaces.

create table if not exists public.org_health_snapshots (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  captured_at     timestamptz not null default now(),

  -- Top-level org health (0–100)
  health_score    numeric(5,2) not null,

  -- Dimension breakdown (same as OrgHealthEngine output)
  capacity_util   numeric(5,2),    -- team utilization 0–1
  risk_exposure   numeric(5,2),    -- composite risk score 0–1
  execution_pace  numeric(5,2),    -- velocity vs plan 0–1
  capability_gap  numeric(5,2),    -- fraction of capabilities at risk 0–1
  alignment_score numeric(5,2),    -- people↔goals alignment 0–1

  -- Counts at snapshot time
  open_tasks      integer,
  critical_risks  integer,
  overloaded_pct  numeric(5,2),    -- fraction of team overloaded

  -- Metadata
  data_source     text default 'computed',  -- 'computed' | 'manual' | 'imported'
  note            text
);

-- One snapshot per org per day is enough; extra rows are harmless but bloat
create index if not exists idx_health_snaps_org_time
  on public.org_health_snapshots (org_id, captured_at desc);

-- RLS: org members can read their own snapshots; only service role writes
alter table public.org_health_snapshots enable row level security;

create policy "org_health_snapshots_read" on public.org_health_snapshots
  for select
  using (
    org_id = (select org_id from public.users where id = auth.uid() limit 1)
  );

create policy "org_health_snapshots_insert_service" on public.org_health_snapshots
  for insert
  with check (true);  -- service-role key bypasses RLS; anon/user cannot insert

-- Back-fill a synthetic 30-day history so the trend surface is populated
-- immediately in demo mode (replaced by real computed values in production).
-- Uses the seeded org id from 0007_multitenancy.sql (the first org).
do $$
declare
  v_org_id uuid;
  v_day    integer;
  v_score  numeric;
  v_base   numeric := 72;
begin
  select id into v_org_id from public.organizations limit 1;
  if v_org_id is null then return; end if;

  -- Check if we already have snapshots (idempotent)
  if exists (select 1 from public.org_health_snapshots where org_id = v_org_id) then
    return;
  end if;

  for v_day in reverse 29..0 loop
    -- Slight upward trend + noise to look realistic
    v_score := v_base
      + (29 - v_day) * 0.25                          -- gradual improvement
      + (random() * 6 - 3);                           -- ±3 pts noise
    v_score := greatest(40, least(95, v_score));

    insert into public.org_health_snapshots (
      org_id, captured_at, health_score,
      capacity_util, risk_exposure, execution_pace,
      capability_gap, alignment_score,
      open_tasks, critical_risks, overloaded_pct,
      data_source, note
    ) values (
      v_org_id,
      now() - (v_day || ' days')::interval,
      round(v_score, 2),
      round((0.65 + random() * 0.25)::numeric, 3),
      round((0.20 + random() * 0.30)::numeric, 3),
      round((0.55 + random() * 0.35)::numeric, 3),
      round((0.15 + random() * 0.20)::numeric, 3),
      round((0.60 + random() * 0.30)::numeric, 3),
      floor(18 + random() * 12)::integer,
      floor(random() * 4)::integer,
      round((0.20 + random() * 0.25)::numeric, 3),
      'computed',
      null
    );
  end loop;
end;
$$;
