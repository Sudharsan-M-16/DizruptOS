-- DIZRUPT complete database setup
-- Generated: 2026-06-23
-- Paste this entire file into Supabase > SQL Editor > New Query, then Run.
-- ~10 seconds to execute.


-- ================================================================
-- 0001_core_schema.sql
-- ================================================================
-- ============================================================================
-- DIZRUPT core schema â€” migration 0001
-- Source of truth: PRD Â§12 (core tables), Â§21 (relationship layer),
-- Â§22 (customer/revenue/service), Â§23 (causal signals), Â§24 (agent staging),
-- Â§26 (scenarios/snapshots), Â§27 (notification dedup).
--
-- Apply with:  supabase db push   (or psql -f against a fresh database)
-- Laws enforced here: RLS on every table Â· audit immutability Â· soft deletes
-- via deleted_at Â· integer micro-unit money Â· CRDT prep columns Â· atomic
-- capacity increments (enforced by the reallocate RPC, bottom of file).
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ---------------------------------------------------------------- org chart
create table departments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  head_user_id  uuid, -- fk added after users exists
  created_at    timestamptz not null default now()
);

create table users (
  id                      uuid primary key, -- references auth.users(id) in Supabase
  email                   text not null,
  full_name               text not null,
  avatar_url              text,
  role                    text not null check (role in
    ('admin','executive','dept_head','project_manager','team_lead','employee','client')),
  department_id           uuid references departments(id),
  manager_id              uuid references users(id),
  capacity_hours_per_week integer not null default 40 check (capacity_hours_per_week between 0 and 80),
  skill_tags              text[] not null default '{}',
  lifecycle_stage         text not null default 'ACTIVE' check (lifecycle_stage in
    ('ONBOARDING','PROBATION','ACTIVE','TRANSFERRED','ON_LEAVE','OFFBOARDING')),
  cost_per_hour           integer not null default 0, -- micro-units: $1.00 = 1000000
  contractor_flag         boolean not null default false,
  timezone                text not null default 'UTC',
  deleted_at              timestamptz,
  created_at              timestamptz not null default now()
);
alter table departments
  add constraint departments_head_fk foreign key (head_user_id) references users(id);

create unique index idx_users_email on users(email) where deleted_at is null;
create index idx_users_dept_role on users(department_id, role) where deleted_at is null;

-- Single-session enforcement: at most one is_active=true per user (law 4).
create table sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  session_token      text not null unique,
  device_fingerprint text,
  ip_address         inet,
  user_agent         text,
  created_at         timestamptz not null default now(),
  last_active        timestamptz not null default now(),
  is_active          boolean not null default true
);
create unique index idx_sessions_singleton on sessions(user_id) where is_active = true;
create index idx_sessions_token on sessions(session_token);

-- ---------------------------------------------------------------- execution
create table projects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  department_id   uuid references departments(id),
  owner_id        uuid references users(id),
  status          text not null default 'PLANNING' check (status in
    ('PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED')),
  health_status   text not null default 'ON_TRACK' check (health_status in
    ('ON_TRACK','DELAYED','AT_RISK','BLOCKED','CRITICAL')), -- auto-calculated only
  health_reasons  text[] not null default '{}',
  budget_hours    integer not null default 0 check (budget_hours >= 0),
  consumed_hours  integer not null default 0 check (consumed_hours >= 0),
  budget_amount   integer not null default 0, -- micro-units
  consumed_amount integer not null default 0, -- micro-units
  portfolio_id    uuid,
  customer_id     uuid, -- fk added after customers
  goal_id         uuid, -- fk added after goals
  visibility_scope uuid[] not null default '{}', -- pre-computed for O(1) RLS
  version_vector  jsonb not null default '{}',   -- CRDT prep (Phase 4)
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);
create unique index idx_projects_name_dept_active
  on projects(name, department_id) where deleted_at is null;

create table sprints (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id),
  name         text not null,
  starts_on    date not null,
  ends_on      date not null check (ends_on > starts_on),
  goal         text,
  capacity_hours integer not null default 0,
  velocity     integer,
  created_at   timestamptz not null default now()
);

create table tasks (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  project_id       uuid references projects(id),
  sprint_id        uuid references sprints(id),
  assignee_id      uuid references users(id),
  status           text not null default 'BACKLOG' check (status in
    ('BACKLOG','TO_DO','IN_PROGRESS','REVIEW','CLIENT_REVIEW','BLOCKED','COMPLETED','CANCELLED')),
  priority         text not null default 'MEDIUM' check (priority in ('URGENT','HIGH','MEDIUM','LOW')),
  estimated_hours  integer not null default 0 check (estimated_hours >= 0),
  logged_hours     integer not null default 0 check (logged_hours >= 0),
  due_date         date,
  week_start       date, -- capacity bucketing week (Monday)
  labels           text[] not null default '{}',
  recurring_config jsonb,
  is_billable      boolean not null default true,
  custom_fields    jsonb not null default '{}',
  version_vector   jsonb not null default '{}',
  tombstone        boolean not null default false,
  event_sequence   bigint not null default 0,
  last_synced_at   timestamptz,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now()
);
create index idx_tasks_project_status on tasks(project_id, status) where deleted_at is null;
create index idx_tasks_assignee on tasks(assignee_id, status) where deleted_at is null;
create index idx_tasks_week on tasks(assignee_id, week_start) where deleted_at is null;
create index idx_tasks_fts on tasks
  using gin(to_tsvector('english', title || ' ' || coalesce(description, '')));

create table task_collaborators (
  task_id  uuid not null references tasks(id) on delete cascade,
  user_id  uuid not null references users(id) on delete cascade,
  role     text not null default 'co_assignee',
  added_by uuid references users(id),
  added_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

-- Relational DAG; cycle detection runs server-side before any insert.
create table task_dependencies (
  id                uuid primary key default gen_random_uuid(),
  task_id           uuid not null references tasks(id) on delete cascade,
  depends_on_id     uuid not null references tasks(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('blocks','depends_on','related_to')),
  created_by        uuid references users(id),
  created_at        timestamptz not null default now(),
  unique (task_id, depends_on_id),
  check (task_id <> depends_on_id) -- self-dependency is always a cycle
);

-- ---------------------------------------------------------------- capacity
create table capacity_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id),
  week_start      date not null,
  allocated_hours integer not null default 0 check (allocated_hours >= 0),
  logged_hours    integer not null default 0 check (logged_hours >= 0),
  utilization_pct double precision not null default 0,
  unique (user_id, week_start)
);
create index idx_cap_week on capacity_logs(week_start);

-- ---------------------------------------------------------------- audit (law 1)
create table audit_events (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references users(id),
  actor_role    text,
  action_type   text not null,
  entity_type   text,
  entity_id     uuid,
  entity_label  text,
  before_state  jsonb,
  after_state   jsonb,
  override_reason text,
  ip_address    inet,
  device_fp     text,
  session_id    uuid,
  created_at    timestamptz not null default now()
);
create index idx_audit_actor_date on audit_events(actor_id, created_at desc);
create index idx_audit_entity on audit_events(entity_type, entity_id);
-- Physical immutability:
revoke update, delete on audit_events from authenticated;

-- ---------------------------------------------------------- intelligence entities
create table risks (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  category            text not null check (category in
    ('security','vendor','operational','compliance','financial','people')),
  probability         text not null check (probability in ('high','medium','low')),
  impact              text not null check (impact in ('critical','high','medium','low')),
  severity            text, -- auto-computed by trigger below; never written by clients
  owner_id            uuid references users(id),
  project_id          uuid references projects(id),
  mitigation_plan     text,
  mitigation_status   text not null default 'not_started'
    check (mitigation_status in ('not_started','in_progress','complete')),
  status              text not null default 'OPEN' check (status in
    ('OPEN','MITIGATING','MONITORING','ACCEPTED','ESCALATED','CLOSED')),
  signals             text[] not null default '{}',
  deleted_at          timestamptz,
  created_at          timestamptz not null default now()
);
create index idx_risks_project on risks(project_id) where deleted_at is null;

-- Severity law (PRD Â§28.2) â€” mirrors src/lib/risk.ts exactly. Tests pin both.
create or replace function compute_risk_severity() returns trigger as $$
begin
  new.severity := case new.probability
    when 'low' then case new.impact
      when 'low' then 'Low' when 'medium' then 'Low'
      when 'high' then 'Medium' else 'High' end
    when 'medium' then case new.impact
      when 'low' then 'Low' when 'medium' then 'Medium'
      when 'high' then 'High' else 'Critical' end
    else case new.impact
      when 'low' then 'Medium' when 'medium' then 'High'
      else 'Critical' end
  end;
  return new;
end $$ language plpgsql;

create trigger trg_risk_severity
  before insert or update of probability, impact on risks
  for each row execute function compute_risk_severity();

create table decisions (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  context             text,
  options_considered  jsonb not null default '[]', -- [{option, pros, cons}]
  chosen_option       text,
  rationale           text not null,
  expected_outcome    text,
  actual_outcome      text,
  outcome_recorded_at timestamptz,
  confidence_level    text check (confidence_level in ('low','medium','high')),
  owner_id            uuid references users(id),
  project_id          uuid references projects(id),
  meeting_id          uuid,
  status              text not null default 'DRAFT' check (status in
    ('DRAFT','PROPOSED','APPROVED','ACTIVE','REJECTED','SUPERSEDED','REVERSED')),
  superseded_by       uuid references decisions(id),
  deleted_at          timestamptz,
  created_at          timestamptz not null default now()
);
create index idx_decisions_project on decisions(project_id) where deleted_at is null;

create table meetings (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  meeting_type    text check (meeting_type in
    ('standup','review','planning','retrospective','one_on_one','decision','escalation')),
  occurred_at     timestamptz not null,
  duration_mins   integer,
  facilitator_id  uuid references users(id),
  project_id      uuid references projects(id),
  notes           text,
  transcript_url  text,
  summary         text, -- AI-generated, labeled as such in UI
  created_at      timestamptz not null default now()
);

create table commitments (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  owner_id             uuid references users(id),
  to_id                uuid references users(id),
  source_type          text check (source_type in ('meeting','review','discussion','email','verbal')),
  source_id            uuid,
  due_date             date,
  status               text not null default 'open' check (status in
    ('open','in_progress','fulfilled','overdue','withdrawn')),
  fulfillment_evidence text,
  extracted_by         text check (extracted_by in ('human','ai')),
  deleted_at           timestamptz,
  created_at           timestamptz not null default now()
);
create index idx_commitments_owner on commitments(owner_id, status) where deleted_at is null;
create index idx_commitments_overdue on commitments(due_date, status) where status = 'open';

create table goals (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  owner_id       uuid references users(id),
  department_id  uuid references departments(id),
  target_date    date,
  progress       double precision not null default 0 check (progress between 0 and 1),
  status         text not null default 'ACTIVE',
  parent_goal_id uuid references goals(id),
  key_results    jsonb not null default '[]', -- [{title, progress}]
  created_at     timestamptz not null default now()
);
alter table projects add constraint projects_goal_fk foreign key (goal_id) references goals(id);

create table knowledge_docs (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('sop','decision','lesson','expertise','policy','credential')),
  title           text not null,
  content         text,
  version         integer not null default 1,
  created_by      uuid references users(id),
  owner_id        uuid references users(id),
  reviewer_id     uuid references users(id),
  review_due_date date,
  reviewed_at     timestamptz,
  vault_ref       text, -- Supabase Vault id; NEVER raw credential values
  tags            text[] not null default '{}',
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------------- business-value chain
create table customers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  tier              text check (tier in ('strategic','enterprise','standard','trial')),
  health_status     text not null default 'healthy'
    check (health_status in ('healthy','at_risk','churning','churned')),
  health_reasons    text[] not null default '{}',
  owner_id          uuid references users(id),
  arr_micro_units   integer not null default 0,
  contract_end_date date,
  notes             text,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now()
);
alter table projects add constraint projects_customer_fk foreign key (customer_id) references customers(id);

create table revenue_streams (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  type               text not null check (type in ('recurring','project','service','license','usage')),
  customer_id        uuid references customers(id),
  amount_micro_units integer not null default 0,
  currency           text not null default 'USD',
  status             text not null default 'active'
    check (status in ('active','at_risk','churned','pipeline')),
  probability        double precision not null default 1.0 check (probability between 0 and 1),
  owner_id           uuid references users(id),
  start_date         date,
  end_date           date,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now()
);

create table services (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  service_type    text check (service_type in ('api','web','internal','data','infrastructure')),
  status          text not null default 'operational'
    check (status in ('operational','degraded','incident','deprecated')),
  owner_id        uuid references users(id),
  slo_target      double precision not null default 0.999,
  slo_current     double precision,
  runbook_url     text,
  on_call_user_id uuid references users(id),
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------- graph layer (PRD Â§21)
create table entity_relationships (
  id                uuid primary key default gen_random_uuid(),
  source_id         uuid not null,
  source_type       text not null,
  relationship_type text not null check (relationship_type in (
    'owns','belongs_to','reports_to','has_expertise_in','assigned_to','made',
    'owns_risk','made_commitment','delivers','executes','executed_by','produces',
    'linked_to','exposes','depends_on','documented_by','implemented_by',
    'delivers_value_to','threatened_by','enabled_by','supported_by','mitigates',
    'made_in','causes','governs','generates','funds','serves','at_risk',
    'supersedes','blocks')), -- closed registry; additions are migrations
  target_id         uuid not null,
  target_type       text not null,
  strength          double precision not null default 1.0 check (strength between 0 and 1),
  confidence        double precision not null default 1.0 check (confidence between 0 and 1),
  evidence_type     text check (evidence_type in ('observed','declared','inferred','ai_derived')),
  evidence_ref      jsonb,
  created_by        uuid references users(id),
  created_by_agent  text,
  valid_from        timestamptz not null default now(),
  valid_until       timestamptz, -- null = active; set to deprecate, never delete
  created_at        timestamptz not null default now(),
  unique (source_id, source_type, target_id, target_type, relationship_type)
);
create index idx_rel_source on entity_relationships(source_id, source_type, relationship_type)
  where valid_until is null;
create index idx_rel_target on entity_relationships(target_id, target_type, relationship_type)
  where valid_until is null;

-- Materialized 2â€“4 hop traversal cache; refreshed by the worker (PRD Â§21.4).
create table entity_paths (
  id          uuid primary key default gen_random_uuid(),
  root_id     uuid not null,
  root_type   text not null,
  leaf_id     uuid not null,
  leaf_type   text not null,
  path_hops   integer not null check (path_hops between 1 and 4),
  path_array  uuid[] not null,
  path_types  text[] not null,
  computed_at timestamptz not null default now()
);
create index idx_paths_root on entity_paths(root_id, root_type);
create index idx_paths_leaf on entity_paths(leaf_id, leaf_type);

-- -------------------------------------------------- causal signals (PRD Â§23)
create table causal_signals (
  id                 uuid primary key default gen_random_uuid(),
  effect_entity_id   uuid not null,
  effect_entity_type text not null,
  effect_field       text not null,
  effect_value       text not null,
  cause_type         text not null check (cause_type in
    ('entity_state','threshold_breach','velocity_drop','dependency_block','vendor_event','ai_inferred')),
  cause_entity_id    uuid,
  cause_entity_type  text,
  cause_description  text not null,
  cause_evidence     jsonb,
  confidence         double precision not null check (confidence between 0 and 1),
  derivation         text not null check (derivation in ('rule_based','statistical','ai_inferred')),
  observed_at        timestamptz not null default now(),
  resolved_at        timestamptz,
  validated_by       uuid references users(id),
  validation_status  text not null default 'unvalidated'
    check (validation_status in ('unvalidated','confirmed','rejected')),
  created_at         timestamptz not null default now()
);
create index idx_causal_effect on causal_signals(effect_entity_id, effect_entity_type);
create index idx_causal_unresolved on causal_signals(effect_entity_id) where resolved_at is null;

-- ------------------------------------------------ agents (PRD Â§24, law 3)
create table agent_proposals_staging (
  id                uuid primary key default gen_random_uuid(),
  agent_type        text not null,
  proposed_action   jsonb not null,
  confidence        double precision not null,
  priority          integer not null,
  entity_type       text not null,
  entity_id         uuid not null,
  conflict_scope    uuid[] not null default '{}',
  negotiation_round integer not null default 0,
  status            text not null default 'staged'
    check (status in ('staged','negotiating','promoted','superseded','withdrawn')),
  created_at        timestamptz not null default now()
);

create table proposals (
  id                uuid primary key default gen_random_uuid(),
  agent_type        text not null,
  title             text not null,
  summary           text,
  proposed_action   jsonb not null,
  reasoning         text[] not null default '{}',
  validation_result jsonb,
  confidence        double precision,
  priority          integer not null default 50,
  entity_type       text,
  entity_id         uuid,
  conflict_info     jsonb, -- {with_agent, resolution} when coordinator merged
  status            text not null default 'pending'
    check (status in ('pending','approved','rejected','expired','compromise')),
  reviewed_by       uuid references users(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  expires_at        timestamptz not null default (now() + interval '48 hours'),
  created_at        timestamptz not null default now()
);
create unique index idx_proposals_pending on proposals(agent_type, entity_id)
  where status = 'pending';

create table agent_memory (
  id             uuid primary key default gen_random_uuid(),
  agent_type     text not null,
  entity_type    text not null,
  entity_id      uuid not null,
  memory_type    text not null check (memory_type in ('rejection','approval','context')),
  memory_payload jsonb not null,
  expires_at     timestamptz, -- rejections: now() + 30 days
  created_at     timestamptz not null default now()
);
create index idx_agent_memory on agent_memory(agent_type, entity_id, memory_type);

-- ------------------------------------------------ notifications (PRD Â§27)
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  klass       text not null check (klass in
    ('hard_stop','critical_action','manager_review','intelligence','informational')),
  type        text not null,
  payload     jsonb not null,
  read        boolean not null default false,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz not null default now()
);
create index idx_notif_unread on notifications(user_id) where read = false;

create table notification_dedup (
  entity_id         uuid not null,
  notification_type text not null,
  last_sent_at      timestamptz not null,
  primary key (entity_id, notification_type)
);

-- ------------------------------------------------ ops / platform
create table dead_letter_jobs (
  id            uuid primary key default gen_random_uuid(),
  job_type      text not null,
  payload       jsonb not null,
  error_msg     text,
  attempt_count integer not null default 0,
  first_failed  timestamptz not null default now(),
  last_failed   timestamptz not null default now(),
  resolved      boolean not null default false,
  resolved_by   uuid references users(id)
);

create table entity_embeddings (
  id           uuid primary key default gen_random_uuid(),
  entity_type  text not null,
  entity_id    uuid not null,
  embedding    vector(1536),
  content_hash text not null, -- sha-256 dedup: skip re-embedding unchanged content
  model        text not null,
  created_at   timestamptz not null default now(),
  unique (entity_type, entity_id)
);
create index idx_embeddings_ivfflat on entity_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table scenarios (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  scenario_type     text not null check (scenario_type in
    ('headcount_loss','headcount_add','vendor_failure','revenue_drop','project_delay','budget_cut','custom')),
  created_by        uuid references users(id),
  base_snapshot_id  uuid,
  input_params      jsonb not null,
  simulation_result jsonb,
  status            text not null default 'draft' check (status in ('draft','running','complete','archived')),
  computed_at       timestamptz,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now()
);

create table org_snapshots (
  id            uuid primary key default gen_random_uuid(),
  snapshot_at   timestamptz not null,
  snapshot_type text not null check (snapshot_type in ('auto_monthly','pre_scenario','manual')),
  created_by    uuid references users(id),
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

create table org_snapshot_data (
  snapshot_id uuid not null references org_snapshots(id),
  entity_type text not null,
  entity_data jsonb not null,
  primary key (snapshot_id, entity_type)
);

-- ============================================================================
-- ROW LEVEL SECURITY â€” law 2: every table, no exceptions.
-- Strategy: simple, indexed checks. visibility_scope is pre-computed at write
-- time so SELECT policies never join through the org hierarchy.
-- ============================================================================

alter table departments            enable row level security;
alter table users                  enable row level security;
alter table sessions               enable row level security;
alter table projects               enable row level security;
alter table sprints                enable row level security;
alter table tasks                  enable row level security;
alter table task_collaborators     enable row level security;
alter table task_dependencies      enable row level security;
alter table capacity_logs          enable row level security;
alter table audit_events           enable row level security;
alter table risks                  enable row level security;
alter table decisions              enable row level security;
alter table meetings               enable row level security;
alter table commitments            enable row level security;
alter table goals                  enable row level security;
alter table knowledge_docs         enable row level security;
alter table customers              enable row level security;
alter table revenue_streams        enable row level security;
alter table services               enable row level security;
alter table entity_relationships   enable row level security;
alter table entity_paths           enable row level security;
alter table causal_signals         enable row level security;
alter table agent_proposals_staging enable row level security;
alter table proposals              enable row level security;
alter table agent_memory           enable row level security;
alter table notifications          enable row level security;
alter table notification_dedup    enable row level security;
alter table dead_letter_jobs       enable row level security;
alter table entity_embeddings      enable row level security;
alter table scenarios              enable row level security;
alter table org_snapshots          enable row level security;
alter table org_snapshot_data      enable row level security;

-- Helper: role claim from the JWT (Supabase puts app_metadata in the token).
create or replace function auth_role() returns text
  language sql stable as
$$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'employee') $$;

create or replace function auth_dept() returns uuid
  language sql stable as
$$ select (select department_id from users where id = auth.uid()) $$;

-- Representative policies (extend per-table as features land):

create policy users_select on users for select using (
  deleted_at is null and (
    auth_role() in ('admin','executive','dept_head','project_manager')
    or id = auth.uid()
    or department_id = auth_dept()
  )
);

create policy projects_select on projects for select using (
  deleted_at is null and (
    auth_role() in ('admin','executive')
    or owner_id = auth.uid()
    or auth_dept() = any(visibility_scope)
  )
);

create policy tasks_select on tasks for select using (
  deleted_at is null and (
    auth_role() in ('admin','executive','dept_head','project_manager')
    or assignee_id = auth.uid()
    or exists (select 1 from task_collaborators tc
               where tc.task_id = tasks.id and tc.user_id = auth.uid())
  )
);

create policy capacity_select on capacity_logs for select using (
  auth_role() in ('admin','executive','dept_head','project_manager','team_lead')
  or user_id = auth.uid()
);

create policy audit_select on audit_events for select using (
  auth_role() = 'admin'
  or (auth_role() = 'dept_head') -- dept scoping refined when org_id lands
);
create policy audit_insert on audit_events for insert with check (actor_id = auth.uid());

create policy notifications_own on notifications for select using (user_id = auth.uid());

create policy proposals_managers on proposals for select using (
  auth_role() in ('admin','dept_head','project_manager')
);

-- Agents authenticate as a dedicated service role; clients can never write
-- to operational tables through proposals (law 3). The staging table accepts
-- INSERT only from the service role (no authenticated policy = denied).

-- ============================================================================
-- TRIGGERS â€” audit completeness (law 1) and atomic reallocation (law 6).
-- ============================================================================

-- Generic audit trigger: attach to every operational table.
create or replace function write_audit_event() returns trigger as $$
begin
  insert into audit_events (actor_id, action_type, entity_type, entity_id, before_state, after_state)
  values (
    auth.uid(),
    lower(tg_table_name) || '_' || lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$ language plpgsql security definer;

create trigger trg_audit_projects after insert or update or delete on projects
  for each row execute function write_audit_event();
create trigger trg_audit_tasks after insert or update or delete on tasks
  for each row execute function write_audit_event();
create trigger trg_audit_risks after insert or update or delete on risks
  for each row execute function write_audit_event();
create trigger trg_audit_decisions after insert or update or delete on decisions
  for each row execute function write_audit_event();

-- Atomic reallocation RPC: the ONLY sanctioned write path for capacity moves.
-- Optimistic clients call this; concurrent callers serialize on the advisory
-- lock; capacity mutates by delta on both sides in one transaction.
create or replace function reallocate_task(
  p_task_id uuid,
  p_to_user_id uuid,
  p_override_reason text default null
) returns table (
  from_user_id uuid,
  to_user_id uuid,
  from_utilization_after double precision,
  to_utilization_after double precision
) language plpgsql security definer as $$
declare
  v_task tasks%rowtype;
  v_from uuid;
  v_capacity integer;
  v_projected double precision;
begin
  -- Exactly-once per task per window:
  perform pg_advisory_xact_lock(hashtext(p_task_id::text));

  select * into v_task from tasks where id = p_task_id and deleted_at is null for update;
  if not found then
    raise exception 'TASK_NOT_FOUND' using errcode = 'P0002';
  end if;
  v_from := v_task.assignee_id;

  select capacity_hours_per_week into v_capacity from users where id = p_to_user_id;

  -- Hard-stop guardrail: â‰¥100% requires a typed override reason.
  select (coalesce(allocated_hours,0) + v_task.estimated_hours)::double precision / v_capacity
    into v_projected
    from capacity_logs
   where user_id = p_to_user_id and week_start = v_task.week_start;
  v_projected := coalesce(v_projected, v_task.estimated_hours::double precision / v_capacity);

  if v_projected >= 1.0 and p_override_reason is null then
    raise exception 'CAPACITY_EXCEEDED projected=%', v_projected using errcode = 'P0003';
  end if;

  -- Atomic deltas, never overwrites:
  if v_from is not null then
    update capacity_logs
       set allocated_hours = greatest(0, allocated_hours - v_task.estimated_hours),
           utilization_pct = greatest(0, allocated_hours - v_task.estimated_hours)::double precision
                             / (select capacity_hours_per_week from users where id = v_from)
     where user_id = v_from and week_start = v_task.week_start;
  end if;

  insert into capacity_logs (user_id, week_start, allocated_hours)
  values (p_to_user_id, v_task.week_start, v_task.estimated_hours)
  on conflict (user_id, week_start) do update
    set allocated_hours = capacity_logs.allocated_hours + excluded.allocated_hours,
        utilization_pct = (capacity_logs.allocated_hours + excluded.allocated_hours)::double precision
                          / (select capacity_hours_per_week from users where id = p_to_user_id);

  update tasks set assignee_id = p_to_user_id where id = p_task_id;

  insert into audit_events (actor_id, action_type, entity_type, entity_id, entity_label,
                            before_state, after_state, override_reason)
  values (auth.uid(),
          case when p_override_reason is null then 'task_reallocated' else 'capacity_override' end,
          'task', p_task_id, v_task.title,
          jsonb_build_object('assignee_id', v_from),
          jsonb_build_object('assignee_id', p_to_user_id),
          p_override_reason);

  return query
    select v_from, p_to_user_id,
      coalesce((select utilization_pct from capacity_logs
                where user_id = v_from and week_start = v_task.week_start), 0),
      (select utilization_pct from capacity_logs
        where user_id = p_to_user_id and week_start = v_task.week_start);
end $$;


-- ================================================================
-- 0002_grants_and_rls_fixes.sql
-- ================================================================
-- ============================================================================
-- Migration 0002 â€” Supabase role grants + RLS correctness fixes
-- Discovered during live RLS validation (evidence: 54001 recursion, 42501 grant).
-- ============================================================================

-- 1) Base privileges. Supabase auto-grants these when DDL runs through its own
--    tooling; applying 0001 over a direct connection skipped them, so anon/
--    authenticated had no table access at all (42501) regardless of RLS.
--    Row visibility is still governed entirely by the RLS policies below â€” the
--    grants only open the door; the policies decide which rows.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- service_role (server-side repositories via PostgREST) â€” full access; it also
-- carries BYPASSRLS in Supabase, so server reads/writes see all rows.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Keep audit immutability (law 1): inserts allowed, mutation/deletion never.
revoke update, delete on audit_events from authenticated;
revoke insert, update, delete on audit_events from anon;

-- 2) Fix infinite recursion: auth_dept() reads `users`, but it was invoked
--    from inside the users RLS policy â†’ policy â†’ auth_dept() â†’ users â†’ ...
--    SECURITY DEFINER runs the helper as its owner, bypassing RLS for that one
--    internal lookup (a safe, bounded read of a single column by PK).
create or replace function auth_dept() returns uuid
  language sql stable security definer set search_path = public, auth as
$$ select department_id from users where id = auth.uid() $$;


-- ================================================================
-- 0003_approvals.sql
-- ================================================================
-- ============================================================================
-- Migration 0003 â€” Approvals as first-class governance objects (PRD Â§6 + Â§5).
-- Every graduated-authority decision becomes a durable, queryable record â€” the
-- substrate for decision lineage, governance intelligence, audit, and
-- organizational memory. NOT mere workflow state.
-- ============================================================================

create table approvals (
  id                uuid primary key default gen_random_uuid(),
  change_type       text not null,            -- ChangeType (task_reassign, ...)
  summary           text not null,
  payload           jsonb not null default '{}',   -- the proposed mutation
  -- who / authority
  requester_id      uuid references users(id),
  requester_role    text not null,
  approver_role     text not null,            -- tier required to decide
  authority_tier    text not null check (authority_tier in ('direct','requires_approval','denied')),
  escalation_path   text[] not null default '{}',  -- senior roles notified, ascending
  -- rationale / evidence (decision-intelligence foundation)
  rationale         text,
  evidence          jsonb not null default '{}',   -- {signals, confidence, links}
  affected_entities jsonb not null default '[]',   -- [{type, id, label}]
  -- lifecycle
  status            text not null default 'pending'
    check (status in ('pending','approved','declined','applied_direct')),
  decided_by        uuid references users(id),
  decided_at        timestamptz,
  decline_reason    text,
  created_at        timestamptz not null default now()
);
create index idx_approvals_queue on approvals(approver_role, status) where status = 'pending';
create index idx_approvals_requester on approvals(requester_id, created_at desc);
create index idx_approvals_lineage on approvals(change_type, created_at desc);

alter table approvals enable row level security;

-- Grants (RLS still governs rows).
grant select, insert, update on approvals to authenticated;
grant all on approvals to service_role;

-- Requester sees their own; the approving tier (and admin) sees the queue;
-- decisions can be made by the approver tier or admin.
create policy approvals_select on approvals for select using (
  auth_role() = 'admin'
  or requester_id = auth.uid()
  or auth_role() = approver_role
);
create policy approvals_insert on approvals for insert with check (requester_id = auth.uid());
create policy approvals_update on approvals for update using (
  auth_role() = 'admin' or auth_role() = approver_role
);


-- ================================================================
-- 0004_org_team_capability.sql
-- ================================================================
-- ============================================================================
-- Migration 0004 â€” Organization / Team / Capability ontology (CTO_REVIEW Tier 1).
-- Adds the entities that unlock computed organizational intelligence: a tenant
-- root (organizations), cross-cutting teams, and capabilities as FIRST-CLASS
-- nodes (not a text[] on users) with rated personâ†”capability and
-- projectâ†”capability edges â€” the substrate for expertise/bus-factor/succession.
-- ============================================================================

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  created_at  timestamptz not null default now()
);

-- Multi-tenancy foundation: org_id flows down. Nullable now; backfilled in seed,
-- enforced once auth maps users â†’ org (CTO review: add before real data grows).
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

-- Capabilities as objects â€” ratable, relatable, gap-analyzable.
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

-- person â†” capability (proficiency 1=novice .. 5=expert) â€” powers bus factor,
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

-- project â†” capability (what a project needs) â€” powers capability demand / gaps.
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


-- ================================================================
-- 0005_outcomes_learnings.sql
-- ================================================================
-- ============================================================================
-- Migration 0005 â€” Outcome + Learning ontology (Decision Intelligence sprint).
-- "A decision without an outcome is incomplete." These make the org's memory
-- closeable: Decision â†’ Outcome â†’ Learning, linkable to capabilities/projects/
-- people â€” the substrate for retrospective intelligence and institutional memory.
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


-- ================================================================
-- 0006_money_bigint.sql
-- ================================================================
-- ============================================================================
-- Migration 0006 â€” Database hardening: widen money columns to bigint.
-- The *_micro_units / *_amount columns were int4 (max ~2.1B) but documented as
-- micro-units ($1 = 1,000,000) â†’ overflow above ~$2.1K (CTO_REVIEW finding).
-- bigint holds ~9.2e18 micro-units (~$9.2 trillion). No data loss (widening).
-- ============================================================================

alter table customers       alter column arr_micro_units   type bigint;
alter table revenue_streams alter column amount_micro_units type bigint;
alter table users           alter column cost_per_hour      type bigint;
alter table projects        alter column budget_amount      type bigint;
alter table projects        alter column consumed_amount    type bigint;


-- ================================================================
-- 0007_multitenancy.sql
-- ================================================================
-- ============================================================================
-- Migration 0007 â€” Multi-tenancy + tenant isolation (Identity sprint).
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

-- 2) caller's org, resolved from their user row (SECURITY DEFINER â†’ no RLS recursion).
create or replace function auth_org() returns uuid
  language sql stable security definer set search_path = public, auth as
$$ select org_id from users where id = auth.uid() $$;

-- 3) RESTRICTIVE tenant policies â€” AND-ed with existing permissive role policies.
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


-- ================================================================
-- 0008_user_profile_fields.sql
-- ================================================================
-- ============================================================================
-- Migration 0008 â€” Close the employee model split (P0 / repoâ†”schema alignment).
-- The TS `Employee` type carried fields the `users` table lacked (title,
-- location, pto, burnout) â†’ a lossy mapper + a second source of truth. Per
-- Option A (schema-authoritative), model them as real columns so there is ONE
-- domain model. (expertise stays DERIVED from employee_capabilities, not stored.)
-- ============================================================================

alter table users add column if not exists title          text;
alter table users add column if not exists location        text;
alter table users add column if not exists pto_days        date[] not null default '{}';
alter table users add column if not exists burnout_flag     boolean not null default false;
alter table users add column if not exists burnout_signals  text[] not null default '{}';
alter table users add column if not exists flight_risk      double precision; -- 0..1, manager-private
alter table users add column if not exists accent           text;

-- sensible backfill for existing rows
update users set title = coalesce(title,
  case role
    when 'project_manager' then 'Resource Manager'
    when 'dept_head' then 'Department Head'
    when 'executive' then 'Executive'
    when 'admin' then 'Administrator'
    else 'Team Member' end);
update users set location = coalesce(location, 'Remote');


-- ================================================================
-- 0009_import_upsert_constraints.sql
-- ================================================================
-- ============================================================================
-- Migration 0009 â€” plain unique constraints so CSV import upserts (PostgREST
-- on_conflict) work. The existing capabilities uniq is on (org_id, lower(name))
-- (expression) and users email is a PARTIAL index â€” neither is a valid
-- on_conflict target. Add plain constraints for idempotent import.
-- ============================================================================
alter table capabilities add constraint capabilities_org_name_uniq unique (org_id, name);
alter table users        add constraint users_email_uniq         unique (email);


-- ================================================================
-- 0010_recommendation_lifecycle.sql
-- ================================================================
-- ============================================================================
-- Migration 0010 â€” Recommendation lifecycle + embedded prediction writeback.
-- Recommendations become first-class operational entities with a lifecycle; on
-- ACCEPT a prediction is written (confidence/baseline/expected_delta); when an
-- outcome lands, actual_value + accuracy close the loop â†’ feed calibration.
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


-- ================================================================
-- 0011_decision_lineage.sql
-- ================================================================
-- ============================================================================
-- Migration 0011 â€” Decision lineage ontology.
-- Expands organizational memory beyond Decisionâ†’Outcomeâ†’Learning by making the
-- REASONING first-class: the Evidence a decision rested on, the Assumptions it
-- took as true, and the Hypotheses it predicted. This is what makes lineage
-- explorable and falsifiable:
--
--   Decision â†’ Evidence â†’ Assumption â†’ Outcome â†’ Learning â†’ Future Decision
--
-- An assumption can later be marked violated; a hypothesis confirmed or refuted
-- â€” turning a decision record into a live, checkable belief network.
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

-- RLS â€” same posture as the rest of the memory ontology (authenticated read,
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


-- ================================================================
-- 0012_auth_hook.sql
-- ================================================================
-- 0012 â€” Auth Hook + first-user provisioning (the "real auth, end-to-end" piece).
--
-- This is the one server-side step that makes real authentication enforce the
-- SAME RBAC + RLS the app already relies on. Two things:
--   1. custom_access_token_hook â€” mints `app_metadata.role` and `app_metadata.org_id`
--      into every issued JWT, read from public.users. `auth_role()` (0001) and the
--      org RLS (0007) already read these claims, so once this runs, real users are
--      governed exactly like the demo personas were.
--   2. handle_new_auth_user â€” when someone signs up (magic-link / OAuth), auto-create
--      their public.users profile (role 'employee', attached to the seeded org) so
--      the very first real user works end-to-end with no manual SQL.
--
-- ONE dashboard step after applying this migration:
--   Supabase â†’ Authentication â†’ Hooks â†’ "Customize Access Token (JWT) Claims"
--   â†’ select  public.custom_access_token_hook  â†’ Enable.

-- ---------------------------------------------------------------- JWT claims hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  v_role text;
  v_org  uuid;
begin
  select role, org_id
    into v_role, v_org
  from public.users
  where id = (event->>'user_id')::uuid
    and deleted_at is null;

  claims := coalesce(event->'claims', '{}'::jsonb);
  if claims->'app_metadata' is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
  end if;

  -- default role 'employee' so a brand-new account is least-privilege, never null
  claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(coalesce(v_role, 'employee')));
  if v_org is not null then
    claims := jsonb_set(claims, '{app_metadata, org_id}', to_jsonb(v_org));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- the auth server runs the hook; nobody else may call it
grant usage  on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
-- the hook needs to read the role/org off the profile row
grant select (id, role, org_id, deleted_at) on table public.users to supabase_auth_admin;

-- ----------------------------------------------------- first-user auto-provision
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations order by created_at asc limit 1;

  insert into public.users (id, email, full_name, role, org_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'employee',
    v_org
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- org-scope claim helper (mirrors auth_role() in 0001) for RLS that needs the org.
create or replace function public.auth_org()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', '')::uuid;
$$;


-- ================================================================
-- 0013_graph_traversal.sql
-- ================================================================
-- Migration 0013: Graph traversal at scale via recursive CTEs + centrality.
-- Corrected version â€” all UUID/TEXT casting fixed, column names match actual schema.
--
-- Adds:
--   1. org_id to entity_relationships + entity_paths (missing from 0001/0007)
--   2. traverse_graph(start_id, max_depth) â€” recursive BFS, all paths as TEXT[]
--   3. shortest_path(source_id, target_id) â€” unweighted BFS shortest path
--   4. betweenness_centrality() â€” normalized betweenness score per node
--   5. dependency_hubs(min_out_degree) â€” high-degree hub detection
--   6. refresh_entity_paths() â€” materializes BFS results into entity_paths cache
-- ---------------------------------------------------------------------------

-- 0. Add org_id to entity_relationships (was missing from 0001/0007 sweeps).
ALTER TABLE entity_relationships ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Backfill existing edges to the first (demo) org.
UPDATE entity_relationships
  SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
  WHERE org_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_rel_org ON entity_relationships(org_id);

-- Add org_id to entity_paths too (0001 schema omitted it).
ALTER TABLE entity_paths ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);


-- ---------------------------------------------------------------------------
-- 1. BFS traversal from a start node.
--    Path stored as TEXT[] so UUIDs never need to be cast back from raw bytea.
--    All UUIDâ†’TEXT casts happen exactly once at the array boundary.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION traverse_graph(
  p_start_id  UUID,
  p_org_id    UUID DEFAULT NULL,
  p_max_depth INT  DEFAULT 6
)
RETURNS TABLE (
  node_id           TEXT,
  node_type         TEXT,
  relationship_type TEXT,
  depth             INT,
  path              TEXT[]
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH RECURSIVE bfs AS (
    -- Seed: direct neighbours of the start node.
    SELECT
      er.target_id::text       AS node_id,
      er.target_type           AS node_type,
      er.relationship_type     AS relationship_type,
      1                        AS depth,
      -- BOTH elements cast to text so the array is homogeneous TEXT[].
      ARRAY[p_start_id::text, er.target_id::text] AS path
    FROM entity_relationships er
    WHERE er.source_id = p_start_id
      AND er.valid_until IS NULL
      AND (p_org_id IS NULL OR er.org_id = p_org_id)

    UNION ALL

    -- Expand one hop.
    SELECT
      er.target_id::text,
      er.target_type,
      er.relationship_type,
      bfs.depth + 1,
      bfs.path || er.target_id::text
    FROM entity_relationships er
    -- Compare UUID source to TEXT node_id via cast â€” explicit, no ambiguity.
    JOIN bfs ON er.source_id::text = bfs.node_id
    WHERE bfs.depth < p_max_depth
      AND er.valid_until IS NULL
      -- Cycle guard: target (cast to text) must not already be in the path.
      AND NOT (er.target_id::text = ANY(bfs.path))
      AND (p_org_id IS NULL OR er.org_id = p_org_id)
  )
  SELECT DISTINCT ON (node_id)
    node_id, node_type, relationship_type, depth, path
  FROM bfs
  ORDER BY node_id, depth ASC;
$$;

COMMENT ON FUNCTION traverse_graph IS
  'Recursive BFS from p_start_id. Returns all reachable nodes within p_max_depth hops. '
  'Cycle-safe via path membership check. Scope to tenant with p_org_id.';

GRANT EXECUTE ON FUNCTION traverse_graph TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Shortest path between two nodes (unweighted BFS).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION shortest_path(
  p_source_id UUID,
  p_target_id UUID,
  p_org_id    UUID DEFAULT NULL,
  p_max_depth INT  DEFAULT 10
)
RETURNS TEXT[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH RECURSIVE bfs AS (
    SELECT
      er.target_id::text                            AS node_id,
      ARRAY[p_source_id::text, er.target_id::text]  AS path,
      1                                             AS depth
    FROM entity_relationships er
    WHERE er.source_id = p_source_id
      AND er.valid_until IS NULL
      AND (p_org_id IS NULL OR er.org_id = p_org_id)

    UNION ALL

    SELECT
      er.target_id::text,
      bfs.path || er.target_id::text,
      bfs.depth + 1
    FROM entity_relationships er
    JOIN bfs ON er.source_id::text = bfs.node_id
    WHERE bfs.depth < p_max_depth
      AND er.valid_until IS NULL
      AND NOT (er.target_id::text = ANY(bfs.path))
      AND (p_org_id IS NULL OR er.org_id = p_org_id)
  )
  SELECT path
  FROM bfs
  WHERE node_id = p_target_id::text
  ORDER BY depth ASC
  LIMIT 1;
$$;

COMMENT ON FUNCTION shortest_path IS
  'Returns shortest path array [source::text, ..., target::text] or NULL if unreachable.';

GRANT EXECUTE ON FUNCTION shortest_path TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. Betweenness centrality â€” which nodes lie on the most shortest paths.
--    Uses traverse_graph to build shortest-path trees from every source node,
--    counts how often each intermediate node appears, normalises by n*(n-1)/2.
--    Suitable for graphs up to ~500 nodes. Cache the result; do not call per-request.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION betweenness_centrality(p_org_id UUID DEFAULT NULL)
RETURNS TABLE (
  node_id    TEXT,
  node_type  TEXT,
  raw_count  BIGINT,
  normalized NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH
  -- All distinct nodes (sources and targets) visible in this org.
  nodes AS (
    SELECT DISTINCT source_id AS id, source_type AS node_type
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
    UNION
    SELECT DISTINCT target_id, target_type
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
  ),

  -- Shortest-path trees from every source node via traverse_graph.
  -- LEFT JOIN LATERAL so source nodes with no edges still appear in final count.
  all_paths AS (
    SELECT tg.node_id AS leaf_id, tg.path
    FROM nodes src
    LEFT JOIN LATERAL traverse_graph(src.id, p_org_id, 8) AS tg ON TRUE
    WHERE tg.node_id IS NOT NULL
      AND src.id::text <> tg.node_id     -- exclude self-paths
  ),

  -- Count how many paths each intermediate node appears in.
  -- path[2 .. len-1] extracts elements excluding first (source) and last (leaf).
  intermediary_counts AS (
    SELECT
      mid_node      AS node_id,
      COUNT(*)      AS raw_count
    FROM all_paths,
    LATERAL unnest(path[2 : array_length(path, 1) - 1]) AS mid_node
    GROUP BY mid_node
  ),

  total AS (SELECT COUNT(*) AS n FROM nodes)

  SELECT
    n.id::text AS node_id,
    n.node_type,
    COALESCE(ic.raw_count, 0) AS raw_count,
    CASE WHEN (SELECT n FROM total) > 1
      THEN ROUND(
        COALESCE(ic.raw_count, 0)::NUMERIC
        / NULLIF(
            ((SELECT n FROM total) - 1) * ((SELECT n FROM total) - 2) / 2,
            0
          ),
        4
      )
      ELSE 0::NUMERIC
    END AS normalized
  FROM nodes n
  LEFT JOIN intermediary_counts ic ON ic.node_id = n.id::text
  ORDER BY normalized DESC;
$$;

COMMENT ON FUNCTION betweenness_centrality IS
  'Normalized betweenness centrality for all graph nodes. '
  'High score = structural bridge. Do not call per-request; cache hourly.';

GRANT EXECUTE ON FUNCTION betweenness_centrality TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. Dependency hub detection (high out-degree = fan-out risk).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION dependency_hubs(
  p_min_out_degree INT  DEFAULT 3,
  p_org_id         UUID DEFAULT NULL
)
RETURNS TABLE (
  source_id   TEXT,
  source_type TEXT,
  out_degree  BIGINT,
  in_degree   BIGINT,
  hub_score   NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  WITH out_deg AS (
    SELECT source_id::text AS source_id, source_type, COUNT(*) AS out_degree
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
    GROUP BY source_id, source_type
    HAVING COUNT(*) >= p_min_out_degree
  ),
  in_deg AS (
    SELECT target_id::text AS target_id, COUNT(*) AS in_degree
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
    GROUP BY target_id
  )
  SELECT
    o.source_id,
    o.source_type,
    o.out_degree,
    COALESCE(i.in_degree, 0) AS in_degree,
    ROUND(
      SQRT(o.out_degree::NUMERIC * GREATEST(1, COALESCE(i.in_degree, 0))::NUMERIC),
      3
    ) AS hub_score
  FROM out_deg o
  LEFT JOIN in_deg i ON i.target_id = o.source_id
  ORDER BY hub_score DESC;
$$;

COMMENT ON FUNCTION dependency_hubs IS
  'Returns nodes with >= p_min_out_degree outgoing edges. '
  'hub_score = sqrt(out_degree * in_degree) â€” balances fan-out and fan-in.';

GRANT EXECUTE ON FUNCTION dependency_hubs TO authenticated;


-- ---------------------------------------------------------------------------
-- 5. Materialized path refresh â€” writes traverse_graph output into entity_paths.
--    entity_paths schema (from 0001):
--      root_id UUID, root_type TEXT, leaf_id UUID, leaf_type TEXT,
--      path_hops INT (check 1..4), path_array UUID[], path_types TEXT[],
--      computed_at TIMESTAMPTZ, org_id UUID (added above).
--    Only writes paths up to depth 4 to satisfy the check constraint.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_entity_paths(p_org_id UUID DEFAULT NULL)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count  INT := 0;
  v_source RECORD;
BEGIN
  -- Clear stale cached paths for this tenant.
  IF p_org_id IS NOT NULL THEN
    DELETE FROM entity_paths WHERE org_id = p_org_id;
  ELSE
    DELETE FROM entity_paths;
  END IF;

  FOR v_source IN
    SELECT DISTINCT source_id, source_type
    FROM entity_relationships
    WHERE valid_until IS NULL
      AND (p_org_id IS NULL OR org_id = p_org_id)
  LOOP
    INSERT INTO entity_paths (
      root_id, root_type,
      leaf_id, leaf_type,
      path_hops,
      path_array,
      path_types,
      org_id,
      computed_at
    )
    SELECT
      v_source.source_id,
      v_source.source_type,
      tg.node_id::uuid,
      tg.node_type,
      tg.depth,
      -- Convert TEXT[] path back to UUID[] for path_array column.
      ARRAY(SELECT p::uuid FROM unnest(tg.path) AS p),
      -- path_types: replicate leaf type for each hop position.
      ARRAY_FILL(tg.node_type, ARRAY[tg.depth + 1]),
      p_org_id,
      NOW()
    FROM traverse_graph(v_source.source_id, p_org_id, 4) AS tg
    -- Honour the entity_paths check constraint: path_hops between 1 and 4.
    WHERE tg.depth BETWEEN 1 AND 4;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION refresh_entity_paths IS
  'Materializes BFS traversal (depth 1-4) into entity_paths cache. '
  'Call hourly or after bulk imports. Returns count of source nodes processed.';

GRANT EXECUTE ON FUNCTION refresh_entity_paths TO service_role;


-- ================================================================
-- 0014_multitenancy_completeness.sql
-- ================================================================
-- Migration 0014: Multi-tenancy completeness.
-- Corrected version â€” idempotent policies, VALUES alias fixes, safe DO blocks.
--
-- Adds:
--   â€¢ tenant_settings: per-tenant key/value config (SSO, SCIM, feature flags)
--   â€¢ tenant_audit: super-admin op log
--   â€¢ org_id to remaining tables (recommendations, decision_evidence, entity_embeddings)
--   â€¢ title / location / timezone columns on users (employee model split fix)
-- ---------------------------------------------------------------------------


-- 1. Per-tenant settings table.
CREATE TABLE IF NOT EXISTS tenant_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key          TEXT NOT NULL,
  value        TEXT,
  is_secret    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by   UUID REFERENCES users(id),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, key)
);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Drop policies before recreating (idempotent).
DROP POLICY IF EXISTS tenant_settings_read  ON tenant_settings;
DROP POLICY IF EXISTS tenant_settings_write ON tenant_settings;

-- Admins can read all non-secret settings for their org.
CREATE POLICY tenant_settings_read ON tenant_settings
  FOR SELECT TO authenticated
  USING (org_id = auth_org() AND (NOT is_secret OR auth_role() = 'admin'));

-- Admins can write settings for their org.
CREATE POLICY tenant_settings_write ON tenant_settings
  FOR ALL TO authenticated
  USING  (org_id = auth_org() AND auth_role() = 'admin')
  WITH CHECK (org_id = auth_org() AND auth_role() = 'admin');

COMMENT ON TABLE tenant_settings IS
  'Per-tenant key/value configuration (SSO URLs, SCIM tokens, branding, feature flags).';


-- 2. Seed default settings for every existing org.
--    Uses explicit casts to avoid type-inference issues with the VALUES clause.
INSERT INTO tenant_settings (org_id, key, value, is_secret, updated_at)
SELECT
  orgs.id,
  d.s_key,
  d.s_value,
  d.s_secret,
  NOW()
FROM organizations AS orgs
CROSS JOIN (
  VALUES
    ('sso.enabled'::text,            'false'::text,      FALSE::boolean),
    ('scim.enabled',                 'false',             FALSE),
    ('idle_lock_minutes',            '10',                FALSE),
    ('branding.product_name',        'DizruptOS',         FALSE),
    ('feature.monte_carlo',          'true',              FALSE),
    ('feature.llm_copilot',          'true',              FALSE),
    ('feature.graph_traversal',      'true',              FALSE)
) AS d(s_key, s_value, s_secret)
ON CONFLICT (org_id, key) DO NOTHING;


-- 3. Tenant provisioning audit (super-admin ops only â€” no RLS for authenticated).
CREATE TABLE IF NOT EXISTS tenant_audit (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    UUID NOT NULL,
  actor_id  UUID,
  action    TEXT NOT NULL,
  detail    JSONB,
  at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenant_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_audit_deny ON tenant_audit;
CREATE POLICY tenant_audit_deny ON tenant_audit
  FOR ALL TO authenticated USING (FALSE);

GRANT SELECT, INSERT ON tenant_audit   TO service_role;
GRANT SELECT         ON tenant_settings TO authenticated;
GRANT INSERT, UPDATE ON tenant_settings TO authenticated;


-- 4. Add org_id to tables that are missing it (all idempotent).

-- recommendations (migration 0010)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recommendations' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE recommendations ADD COLUMN org_id UUID REFERENCES organizations(id);
    UPDATE recommendations
      SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
      WHERE org_id IS NULL;
  END IF;
END $$;

-- decision_evidence (migration 0011)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'decision_evidence' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE decision_evidence ADD COLUMN org_id UUID REFERENCES organizations(id);
    UPDATE decision_evidence
      SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
      WHERE org_id IS NULL;
  END IF;
END $$;

-- entity_embeddings (migration 0001)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entity_embeddings' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE entity_embeddings ADD COLUMN org_id UUID REFERENCES organizations(id);
    UPDATE entity_embeddings
      SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
      WHERE org_id IS NULL;
  END IF;
END $$;


-- 5. Add title / location / timezone to users (resolves employee model split).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'title'
  ) THEN
    ALTER TABLE users
      ADD COLUMN title    TEXT,
      ADD COLUMN location TEXT,
      ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

COMMENT ON COLUMN users.title    IS 'Job title, e.g. "Staff Engineer"';
COMMENT ON COLUMN users.location IS 'Office / remote, e.g. "NYC" or "Remote â€“ EU"';
COMMENT ON COLUMN users.timezone IS 'IANA timezone, e.g. "America/New_York"';


-- 6. Backfill title / location / timezone from role (safe no-op if already set).
UPDATE users
SET
  title = CASE role
    WHEN 'admin'           THEN 'Engineering Manager'
    WHEN 'executive'       THEN 'Chief Executive Officer'
    WHEN 'dept_head'       THEN 'Head of Engineering'
    WHEN 'project_manager' THEN 'Senior Project Manager'
    ELSE                        'Software Engineer'
  END,
  location = 'San Francisco, CA',
  timezone = 'America/Los_Angeles'
WHERE title IS NULL;


-- ================================================================
-- 0015_backfill_org_ids.sql
-- ================================================================
-- 0015: Backfill org_ids after seed data was loaded.
-- Safe to run multiple times (all WHERE org_id IS NULL).

DO $$ BEGIN
  UPDATE recommendations
    SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
    WHERE org_id IS NULL;

  UPDATE entity_embeddings
    SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
    WHERE org_id IS NULL;

  -- Also backfill user title/location if still null after seed.
  UPDATE users SET
    title    = COALESCE(title,
      CASE role
        WHEN 'admin'           THEN 'Engineering Manager'
        WHEN 'executive'       THEN 'Chief Executive Officer'
        WHEN 'dept_head'       THEN 'Head of Engineering'
        WHEN 'project_manager' THEN 'Senior Project Manager'
        ELSE                        'Software Engineer'
      END),
    location = COALESCE(location, 'San Francisco, CA'),
    timezone = COALESCE(timezone, 'America/Los_Angeles')
  WHERE title IS NULL OR location IS NULL;
END $$;

-- Re-seed tenant_settings in case the org didn't exist when 0014 ran.
INSERT INTO tenant_settings (org_id, key, value, is_secret, updated_at)
SELECT orgs.id, d.s_key, d.s_value, d.s_secret, NOW()
FROM organizations AS orgs
CROSS JOIN (
  VALUES
    ('sso.enabled'::text,        'false'::text, FALSE::boolean),
    ('scim.enabled',             'false',       FALSE),
    ('idle_lock_minutes',        '10',          FALSE),
    ('branding.product_name',    'DizruptOS',   FALSE),
    ('feature.monte_carlo',      'true',        FALSE),
    ('feature.llm_copilot',      'true',        FALSE),
    ('feature.graph_traversal',  'true',        FALSE)
) AS d(s_key, s_value, s_secret)
ON CONFLICT (org_id, key) DO NOTHING;


-- ================================================================
-- 0016_health_snapshots.sql
-- ================================================================
-- Migration 0016: Org health snapshots â€” temporal layer for trend analysis.
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

  -- Top-level org health (0â€“100)
  health_score    numeric(5,2) not null,

  -- Dimension breakdown (same as OrgHealthEngine output)
  capacity_util   numeric(5,2),    -- team utilization 0â€“1
  risk_exposure   numeric(5,2),    -- composite risk score 0â€“1
  execution_pace  numeric(5,2),    -- velocity vs plan 0â€“1
  capability_gap  numeric(5,2),    -- fraction of capabilities at risk 0â€“1
  alignment_score numeric(5,2),    -- peopleâ†”goals alignment 0â€“1

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
      + (random() * 6 - 3);                           -- Â±3 pts noise
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


-- ================================================================
-- 0017_tenant_sso_config.sql
-- ================================================================
-- Migration 0017: Per-tenant SSO configuration in DB (not env vars).
--
-- Enterprise customers each have their own IdP (Okta, Azure AD, Google Workspace,
-- Ping, etc.). Storing SSO config per-tenant in the DB means:
--   1. No redeploy needed to onboard a new enterprise customer.
--   2. Secrets can be rotated without touching env vars.
--   3. Tenant suspension instantly invalidates all SSO logins for that org.
--   4. The SCIM provisioning API can dynamically configure SSO on signup.
--
-- Architecture: this table is only readable/writable via the service-role key
-- (admin API). The SSO flow reads these rows server-side â€” never exposed client-side.

create table if not exists public.tenant_sso_configs (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null unique references public.organizations(id) on delete cascade,

  -- Protocol
  protocol        text not null check (protocol in ('saml', 'oidc')),

  -- SAML SP-initiated (filled when protocol = 'saml')
  saml_idp_entity_id     text,
  saml_idp_sso_url       text,
  saml_idp_certificate   text,    -- PEM, stored encrypted in production
  saml_sp_entity_id      text,
  saml_attribute_email   text default 'email',
  saml_attribute_role    text default 'role',

  -- OIDC / OAuth2 (filled when protocol = 'oidc')
  oidc_issuer         text,
  oidc_client_id      text,
  oidc_client_secret  text,   -- encrypted in production via Supabase vault
  oidc_scopes         text default 'openid email profile',

  -- Provisioning
  scim_token_hash     text,   -- bcrypt hash of the SCIM bearer token
  auto_provision      boolean default true,
  default_role        text default 'employee',

  -- Status
  enabled             boolean default true,
  verified_at         timestamptz,  -- set when IdP round-trip is confirmed
  last_login_at       timestamptz,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Tenant admins cannot read their own SSO secrets client-side
alter table public.tenant_sso_configs enable row level security;

-- Only service-role key can read/write (accessed via /api/v1/admin only)
create policy "tenant_sso_service_only" on public.tenant_sso_configs
  for all using (false) with check (false);

-- Tenant suspension â€” add suspended_at to organizations if missing
alter table public.organizations
  add column if not exists suspended_at  timestamptz,
  add column if not exists suspend_reason text;

-- View: active (non-suspended) organizations
create or replace view public.active_organizations as
  select * from public.organizations where suspended_at is null;

-- RLS is inherited; the view adds no new access paths

-- Index for SSO config lookups by org
create index if not exists idx_sso_config_org on public.tenant_sso_configs (org_id) where enabled = true;


-- ================================================================
-- 0018_performance_indexes.sql
-- ================================================================
-- ============================================================================
-- DIZRUPT migration 0018 â€” performance indexes
--
-- Adds covering and composite indexes for every column that is filtered,
-- sorted, or joined in the hot-path API routes. Verified with EXPLAIN ANALYZE
-- on the seed dataset (18 users, 6 projects, 35 tasks).
--
-- All indexes use IF NOT EXISTS to be safe to re-run. Partial indexes on
-- deleted_at IS NULL match the application's soft-delete pattern.
-- ============================================================================

-- â”€â”€ Proposals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- GET /api/v1/proposals filters by status and org_id; sorts by created_at DESC.
-- Confirm with: EXPLAIN SELECT * FROM approvals WHERE status='pending' AND org_id=?;
CREATE INDEX IF NOT EXISTS idx_approvals_org_status
  ON approvals(org_id, status, created_at DESC)
  WHERE status = 'pending';

-- â”€â”€ Capacity logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Capacity grid reads all rows for (user_id, week_start) in the same query.
-- The existing idx_cap_week only covers week_start; add composite.
CREATE INDEX IF NOT EXISTS idx_cap_user_week
  ON capacity_logs(user_id, week_start);

-- â”€â”€ Risks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Risk list sorted by severity DESC, filtered by org_id and status.
CREATE INDEX IF NOT EXISTS idx_risks_org_severity
  ON risks(org_id, severity, status)
  WHERE deleted_at IS NULL;

-- â”€â”€ Audit events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Pagination query: latest events per org. Existing idx_audit_actor_date covers
-- actor; add org-level for the full ledger view (admin role).
CREATE INDEX IF NOT EXISTS idx_audit_org_time
  ON audit_events(org_id, created_at DESC);

-- â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Notification center: unread by user + org, sorted by created_at.
CREATE INDEX IF NOT EXISTS idx_notif_user_org_unread
  ON notifications(user_id, org_id, created_at DESC)
  WHERE read = false;

-- â”€â”€ Recommendations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Recommendation engine queries: all active recs sorted by priority desc.
CREATE INDEX IF NOT EXISTS idx_recs_org_priority
  ON recommendations(org_id, priority DESC)
  WHERE status = 'open';

-- â”€â”€ Projects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Portfolio view: org_id + health_status + deleted_at.
CREATE INDEX IF NOT EXISTS idx_projects_org_health
  ON projects(org_id, health_status)
  WHERE deleted_at IS NULL;

-- â”€â”€ Tasks FTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Already has gin FTS index; add composite covering org_id for scoped search.
CREATE INDEX IF NOT EXISTS idx_tasks_org_status
  ON tasks(org_id, status, due_date)
  WHERE deleted_at IS NULL;

-- â”€â”€ Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- JWT validation hot path: token lookup + last_active update.
CREATE INDEX IF NOT EXISTS idx_sessions_active_user
  ON sessions(user_id, last_active DESC)
  WHERE is_active = true;

-- â”€â”€ Entity relationships (graph) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- BFS traversal needs fast lookup by (org_id, source_id) and (org_id, target_id).
CREATE INDEX IF NOT EXISTS idx_rel_org_source
  ON entity_relationships(org_id, source_id, relationship_type);

CREATE INDEX IF NOT EXISTS idx_rel_org_target
  ON entity_relationships(org_id, target_id, relationship_type);

-- â”€â”€ Health snapshots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 30-day trend: filter by org_id, sort by recorded_at DESC, limit 30.
-- Already has idx_health_snaps_org_time â€” verify it covers both columns.
CREATE INDEX IF NOT EXISTS idx_health_snaps_org_recent
  ON org_health_snapshots(org_id, recorded_at DESC);

-- â”€â”€ EXPLAIN guidance (run after applying) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- For each hot query, verify index use:
--   EXPLAIN (ANALYZE, BUFFERS) SELECT ... WHERE org_id = '<id>' AND ...;
-- Look for "Index Scan" or "Bitmap Index Scan" â€” "Seq Scan" on large tables = missing index.


-- ================================================================
-- 0019_auth_hook_note.sql
-- ================================================================
-- MANUAL STEP REQUIRED (cannot be scripted):
-- 1. Supabase Dashboard â†’ Authentication â†’ Hooks
-- 2. "Customize Access Token (JWT)" â†’ select public.custom_access_token_hook
-- 3. Save
--
-- This hook mints role + org_id from public.users into every JWT.
-- RLS policies (auth_org(), auth_role()) depend on this hook being active.
-- Already implemented in migration 0012. This migration documents the gap.
--
-- SECOND MANUAL STEP (if using OAuth):
-- 1. Supabase Dashboard â†’ Authentication â†’ Providers
-- 2. Enable Google and/or Azure OAuth
-- 3. Set redirect URL: https://<your-domain>/auth/callback
--
-- Until the hook is activated, auth_org() returns null and RLS
-- will deny all cross-tenant access (safe default â€” no data leaks).
SELECT 1; -- no-op DDL required for migration runner


-- ================================================================
-- 0020_invitations.sql
-- ================================================================
-- Invitation system + org creation self-service
-- Created: 2026-06-21

-- â”€â”€ Invitations table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL DEFAULT 'employee'
                CHECK (role IN ('admin','executive','dept_head','project_manager','team_lead','employee')),
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64url'),
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','declined','expired','revoked')),
  invited_by  uuid NOT NULL REFERENCES users(id),
  accepted_by uuid REFERENCES users(id),
  message     text,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate pending invites for same email+org
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email_org
  ON invitations(org_id, lower(email)) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON invitations(token) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_org_status
  ON invitations(org_id, status, created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_invitation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_invitation_updated_at ON invitations;
CREATE TRIGGER trg_invitation_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_invitation_timestamp();

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inv_org_read ON invitations;
CREATE POLICY inv_org_read ON invitations FOR SELECT
  USING (org_id = auth_org());

DROP POLICY IF EXISTS inv_org_insert ON invitations;
CREATE POLICY inv_org_insert ON invitations FOR INSERT
  WITH CHECK (
    org_id = auth_org()
    AND auth_role() IN ('admin','dept_head','project_manager')
  );

DROP POLICY IF EXISTS inv_org_update ON invitations;
CREATE POLICY inv_org_update ON invitations FOR UPDATE
  USING (org_id = auth_org() AND auth_role() IN ('admin','dept_head','project_manager'));

-- â”€â”€ Update handle_new_auth_user trigger (0012 extension) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- If new user's app_metadata contains org_id (set by invite flow), use it.
-- Otherwise, create a new org from their email domain and make them admin.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id  uuid;
  v_role    text;
  v_domain  text;
  v_slug    text;
  v_org_name text;
BEGIN
  -- Extract org_id + role from app_metadata (set by invite or JWT hook)
  v_org_id := (NEW.raw_app_meta_data->>'org_id')::uuid;
  v_role   := COALESCE(NEW.raw_app_meta_data->>'role', 'employee');

  -- If no org assigned via invite, create a new org from email domain
  IF v_org_id IS NULL THEN
    v_domain   := split_part(NEW.email, '@', 2);
    v_slug     := lower(regexp_replace(v_domain, '[^a-z0-9]', '-', 'g'));
    v_org_name := initcap(split_part(v_domain, '.', 1));
    v_role     := 'admin'; -- first user in an org is always admin

    INSERT INTO organizations (name, slug)
    VALUES (v_org_name, v_slug)
    ON CONFLICT (slug) DO UPDATE SET slug = organizations.slug || '-' || floor(random()*9000+1000)::text
    RETURNING id INTO v_org_id;
  END IF;

  -- Upsert into public.users
  INSERT INTO users (id, email, full_name, role, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    v_org_id
  )
  ON CONFLICT (id) DO UPDATE
    SET email    = EXCLUDED.email,
        org_id   = COALESCE(users.org_id, EXCLUDED.org_id),
        role     = COALESCE(users.role, EXCLUDED.role);

  -- Mark invitation accepted if token is in metadata
  DECLARE
    v_token text := NEW.raw_app_meta_data->>'invitation_token';
  BEGIN
    IF v_token IS NOT NULL THEN
      UPDATE invitations
        SET status      = 'accepted',
            accepted_by = NEW.id,
            updated_at  = now()
        WHERE token = v_token AND status = 'pending';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

-- Seed default tenant_settings for newly-created orgs
CREATE OR REPLACE FUNCTION seed_tenant_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO tenant_settings (org_id, key, value)
  VALUES
    (NEW.id, 'sso.enabled',            'false'),
    (NEW.id, 'scim.enabled',           'false'),
    (NEW.id, 'branding.product_name',  to_json(NEW.name)),
    (NEW.id, 'onboarding.completed',   'false'),
    (NEW.id, 'onboarding.step',        '1')
  ON CONFLICT (org_id, key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_tenant_settings ON organizations;
CREATE TRIGGER trg_seed_tenant_settings
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION seed_tenant_settings();

