-- ============================================================================
-- DIZRUPT core schema — migration 0001
-- Source of truth: PRD §12 (core tables), §21 (relationship layer),
-- §22 (customer/revenue/service), §23 (causal signals), §24 (agent staging),
-- §26 (scenarios/snapshots), §27 (notification dedup).
--
-- Apply with:  supabase db push   (or psql -f against a fresh database)
-- Laws enforced here: RLS on every table · audit immutability · soft deletes
-- via deleted_at · integer micro-unit money · CRDT prep columns · atomic
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

-- Severity law (PRD §28.2) — mirrors src/lib/risk.ts exactly. Tests pin both.
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

-- ------------------------------------------------- graph layer (PRD §21)
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

-- Materialized 2–4 hop traversal cache; refreshed by the worker (PRD §21.4).
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

-- -------------------------------------------------- causal signals (PRD §23)
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

-- ------------------------------------------------ agents (PRD §24, law 3)
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

-- ------------------------------------------------ notifications (PRD §27)
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
-- ROW LEVEL SECURITY — law 2: every table, no exceptions.
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
-- TRIGGERS — audit completeness (law 1) and atomic reallocation (law 6).
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

  -- Hard-stop guardrail: ≥100% requires a typed override reason.
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
