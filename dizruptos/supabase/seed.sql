-- DIZRUPT live seed — a coherent miniature organization with a real graph,
-- so backend persistence, RLS, and graph/blast-radius queries have data to act
-- on. Deterministic UUIDs let auth/RLS tests reference known principals.
-- Idempotent: ON CONFLICT DO NOTHING throughout.

begin;

-- departments
insert into departments (id, name) values
  ('00000000-0000-0000-0000-0000000000d1','Engineering'),
  ('00000000-0000-0000-0000-0000000000d2','Operations')
on conflict (id) do nothing;

-- users (the demo personas, mapped to schema roles)
insert into users (id, email, full_name, role, department_id, capacity_hours_per_week, skill_tags) values
  ('00000000-0000-0000-0000-0000000000a1','asha@dizrupt.io','Asha Venkat','project_manager','00000000-0000-0000-0000-0000000000d1',40,'{resourcing,delivery}'),
  ('00000000-0000-0000-0000-0000000000a2','noor@dizrupt.io','Noor Al-Rashid','executive','00000000-0000-0000-0000-0000000000d2',40,'{strategy,finance}'),
  ('00000000-0000-0000-0000-0000000000a3','priya@dizrupt.io','Priya Sharma','dept_head','00000000-0000-0000-0000-0000000000d1',40,'{architecture,payments}'),
  ('00000000-0000-0000-0000-0000000000a4','ahmed@dizrupt.io','Ahmed Hassan','employee','00000000-0000-0000-0000-0000000000d1',40,'{backend,payments}'),
  ('00000000-0000-0000-0000-0000000000a5','elias@dizrupt.io','Elias Brandt','admin','00000000-0000-0000-0000-0000000000d2',40,'{security,platform}')
on conflict (id) do nothing;

update departments set head_user_id='00000000-0000-0000-0000-0000000000a3' where id='00000000-0000-0000-0000-0000000000d1';
update departments set head_user_id='00000000-0000-0000-0000-0000000000a2' where id='00000000-0000-0000-0000-0000000000d2';
update users set manager_id='00000000-0000-0000-0000-0000000000a3' where id in
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a4');

-- customers + service (operational twin)
insert into customers (id, name, tier, health_status, owner_id, arr_micro_units) values
  -- NOTE: *_micro_units columns are int4 in 0001 (max ~2.1B) — a schema bug for
  -- real money ($4.2M in micro-units overflows). Stored in cents here; flagged
  -- in the readiness audit as "widen money columns to bigint".
  ('00000000-0000-0000-0000-0000000000c1','Northwind Systems','enterprise','at_risk','00000000-0000-0000-0000-0000000000a2',420000000)
on conflict (id) do nothing;
insert into services (id, name, service_type, status, owner_id) values
  ('00000000-0000-0000-0000-0000000000e1','Payments API','api','degraded','00000000-0000-0000-0000-0000000000a4')
on conflict (id) do nothing;

-- projects (execution twin) — visibility_scope holds the dept for RLS reads
insert into projects (id, name, department_id, owner_id, status, health_status, health_reasons, budget_hours, consumed_hours, customer_id, visibility_scope) values
  ('00000000-0000-0000-0000-0000000000b1','Atlas Payments Migration','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000a1','ACTIVE','CRITICAL','{"QA at 112%","velocity -38% vs 3-sprint avg","vendor settlement 8 days late"}',1200,980,'00000000-0000-0000-0000-0000000000c1','{00000000-0000-0000-0000-0000000000d1}'),
  ('00000000-0000-0000-0000-0000000000b2','Helix Data Platform','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000a3','ACTIVE','ON_TRACK','{}',800,300,null,'{00000000-0000-0000-0000-0000000000d1}')
on conflict (id) do nothing;

-- tasks + capacity
insert into tasks (id, title, project_id, assignee_id, status, priority, estimated_hours, week_start) values
  ('00000000-0000-0000-0000-0000000000f1','Atlas QA hardening','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a4','IN_PROGRESS','HIGH',24,'2026-06-08'),
  ('00000000-0000-0000-0000-0000000000f2','Ledger cutover plan','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1','REVIEW','URGENT',12,'2026-06-08')
on conflict (id) do nothing;

insert into capacity_logs (user_id, week_start, allocated_hours, utilization_pct) values
  ('00000000-0000-0000-0000-0000000000a4','2026-06-08',45,1.13),
  ('00000000-0000-0000-0000-0000000000a1','2026-06-08',32,0.80),
  ('00000000-0000-0000-0000-0000000000a3','2026-06-08',24,0.60)
on conflict (user_id, week_start) do nothing;

-- risks (severity auto-computed by trigger)
insert into risks (id, title, category, probability, impact, owner_id, project_id, status, signals) values
  ('00000000-0000-0000-0000-00000000c001','Atlas Payments migration slip','operational','high','critical','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b1','OPEN','{"7 tasks overdue","QA breach"}'),
  ('00000000-0000-0000-0000-00000000c002','Northwind SLA breach exposure','vendor','medium','high','00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000b1','MONITORING','{"settlement file late"}')
on conflict (id) do nothing;

-- decisions + goals (organizational memory)
insert into decisions (id, title, rationale, owner_id, project_id, status, confidence_level) values
  ('00000000-0000-0000-0000-00000000de01','Ledger-first architecture','Double-entry ledger is the durable source of truth; cutover risk is bounded by feature-flagged dual-write.','00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000b1','ACTIVE','high')
on conflict (id) do nothing;

insert into goals (id, title, owner_id, department_id, target_date, progress, key_results) values
  ('00000000-0000-0000-0000-000000009001','Zero-downtime payments cutover','00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000d1','2026-09-30',0.62,'[{"title":"Dual-write live","progress":0.8},{"title":"Cutover rehearsal","progress":0.4}]')
on conflict (id) do nothing;

-- notifications (per-user, for realtime)
insert into notifications (user_id, klass, type, payload) values
  ('00000000-0000-0000-0000-0000000000a1','critical_action','risk_escalation','{"title":"Atlas breaches 113%","entity":"b1"}')
on conflict do nothing;

-- ============================ THE GRAPH (entity_relationships) ===============
-- A real organizational graph so blast-radius / expertise / risk-propagation
-- queries return meaningful answers. Closed relationship registry enforced by
-- the schema CHECK constraint.
insert into entity_relationships (source_id, source_type, relationship_type, target_id, target_type, strength, confidence, evidence_type) values
  -- people → execution
  ('00000000-0000-0000-0000-0000000000a1','user','executes','00000000-0000-0000-0000-0000000000b1','project',0.9,1.0,'declared'),
  ('00000000-0000-0000-0000-0000000000a4','user','assigned_to','00000000-0000-0000-0000-0000000000f1','task',1.0,1.0,'declared'),
  ('00000000-0000-0000-0000-0000000000a4','user','reports_to','00000000-0000-0000-0000-0000000000a3','user',1.0,1.0,'declared'),
  ('00000000-0000-0000-0000-0000000000a1','user','reports_to','00000000-0000-0000-0000-0000000000a3','user',1.0,1.0,'declared'),
  -- expertise concentration (bus factor): Ahmed + Priya hold payments depth
  ('00000000-0000-0000-0000-0000000000a4','user','has_expertise_in','00000000-0000-0000-0000-0000000000e1','service',0.9,0.9,'observed'),
  ('00000000-0000-0000-0000-0000000000a3','user','has_expertise_in','00000000-0000-0000-0000-0000000000e1','service',0.7,0.8,'observed'),
  -- execution → operational
  ('00000000-0000-0000-0000-0000000000b1','project','depends_on','00000000-0000-0000-0000-0000000000e1','service',0.95,1.0,'observed'),
  ('00000000-0000-0000-0000-0000000000b1','project','delivers_value_to','00000000-0000-0000-0000-0000000000c1','customer',0.9,1.0,'declared'),
  -- risk propagation
  ('00000000-0000-0000-0000-0000000000b1','project','threatened_by','00000000-0000-0000-0000-00000000c001','risk',0.9,0.95,'inferred'),
  ('00000000-0000-0000-0000-0000000000a1','user','owns_risk','00000000-0000-0000-0000-00000000c001','risk',1.0,1.0,'declared'),
  ('00000000-0000-0000-0000-00000000c002','risk','exposes','00000000-0000-0000-0000-0000000000c1','customer',0.8,0.85,'inferred'),
  -- decision lineage
  ('00000000-0000-0000-0000-00000000de01','decision','governs','00000000-0000-0000-0000-0000000000b1','project',0.85,1.0,'declared')
on conflict (source_id, source_type, target_id, target_type, relationship_type) do nothing;

-- causal signal (decision/risk causality)
insert into causal_signals (effect_entity_id, effect_entity_type, effect_field, effect_value, cause_type, cause_entity_id, cause_entity_type, cause_description, confidence, derivation) values
  ('00000000-0000-0000-0000-0000000000b1','project','health_status','CRITICAL','threshold_breach','00000000-0000-0000-0000-0000000000a4','user','Payments lead at 113% utilization for 2 consecutive weeks',0.82,'rule_based')
on conflict do nothing;

commit;
