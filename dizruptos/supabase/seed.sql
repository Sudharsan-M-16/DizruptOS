-- DIZRUPT live seed — the NEW connected story (matches src/lib/data.ts):
-- a small software studio where the AI Support Chatbot is overloaded/critical,
-- the Sales Analytics Dashboard is understaffed, and Ray/Inés are free.
--
-- Deterministic UUIDs so auth/RLS can reference known principals. Idempotent
-- (ON CONFLICT DO NOTHING). Apply via the Supabase SQL editor, then you may set
-- DZ_DEMO_DATA=0 for real persistence. The interactive demo runs on the
-- in-memory seed (DZ_DEMO_DATA=1) regardless of this file.

begin;

-- organization
insert into organizations (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001','Dizrupt Studio','dizrupt-studio')
on conflict (id) do nothing;

-- departments  (d-eng=d1, d-design=d2, d-data=d3, d-ops=d4)
insert into departments (id, name, org_id) values
  ('00000000-0000-0000-0000-0000000000d1','Engineering','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000d2','Design','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000d3','Data & AI','00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000d4','Product','00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- users (16) — roles match the app matrix; skill_tags drive skill-matching
insert into users (id, email, full_name, role, department_id, org_id, capacity_hours_per_week, skill_tags) values
  ('00000000-0000-0000-0000-0000000000a2','noor@dizrupt.io','Noor Al-Rashid','executive','00000000-0000-0000-0000-0000000000d4','00000000-0000-0000-0000-000000000001',40,'{strategy,roadmap}'),
  ('00000000-0000-0000-0000-0000000000a3','priya@dizrupt.io','Priya Sharma','dept_head','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{architecture,leadership,backend}'),
  ('00000000-0000-0000-0000-0000000000a1','asha@dizrupt.io','Asha Venkat','project_manager','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{planning,coordination}'),
  ('00000000-0000-0000-0000-0000000000a6','sarah@dizrupt.io','Sarah Okafor','team_lead','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{backend,apis,databases}'),
  ('00000000-0000-0000-0000-0000000000a4','ahmed@dizrupt.io','Ahmed Hassan','employee','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{backend,apis,databases}'),
  ('00000000-0000-0000-0000-0000000000a7','mei@dizrupt.io','Mei Lin','employee','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{backend,apis,databases}'),
  ('00000000-0000-0000-0000-0000000000a8','diego@dizrupt.io','Diego Ruiz','employee','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{frontend,react,ui}'),
  ('00000000-0000-0000-0000-0000000000a9','jonas@dizrupt.io','Jonas Weber','employee','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{testing,qa}'),
  ('00000000-0000-0000-0000-0000000000aa','fatima@dizrupt.io','Fatima Zahra','employee','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{devops,cloud,cicd}'),
  ('00000000-0000-0000-0000-0000000000a5','elias@dizrupt.io','Elias Brandt','admin','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-000000000001',40,'{it,security,access}'),
  ('00000000-0000-0000-0000-0000000000ab','kofi@dizrupt.io','Kofi Mensah','employee','00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-000000000001',40,'{ui-design,figma}'),
  ('00000000-0000-0000-0000-0000000000ac','ines@dizrupt.io','Inés Castillo','employee','00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-000000000001',32,'{ux-research,ui-design}'),
  ('00000000-0000-0000-0000-0000000000ad','zara@dizrupt.io','Zara Iqbal','employee','00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-000000000001',40,'{ai-ml,python}'),
  ('00000000-0000-0000-0000-0000000000ae','ray@dizrupt.io','Ray Donnelly','employee','00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-000000000001',40,'{data-pipelines,sql}'),
  ('00000000-0000-0000-0000-0000000000af','marcus@dizrupt.io','Marcus Bell','dept_head','00000000-0000-0000-0000-0000000000d4','00000000-0000-0000-0000-000000000001',40,'{product,strategy,planning}'),
  ('00000000-0000-0000-0000-0000000000b0','yuki@dizrupt.io','Yuki Tanaka','employee','00000000-0000-0000-0000-0000000000d4','00000000-0000-0000-0000-000000000001',40,'{coordination,qa}')
on conflict (id) do nothing;

update departments set head_user_id='00000000-0000-0000-0000-0000000000a3' where id='00000000-0000-0000-0000-0000000000d1';
update departments set head_user_id='00000000-0000-0000-0000-0000000000af' where id='00000000-0000-0000-0000-0000000000d4';
update departments set head_user_id='00000000-0000-0000-0000-0000000000ad' where id='00000000-0000-0000-0000-0000000000d3';

-- customer (the chatbot's client — Acme Support; also the client-portal login)
insert into customers (id, name, tier, health_status, owner_id, arr_micro_units) values
  ('00000000-0000-0000-0000-0000000000c1','Acme Support','enterprise','at_risk','00000000-0000-0000-0000-0000000000af',300000000)
on conflict (id) do nothing;

-- projects (6)  pb1..pb6
insert into projects (id, name, department_id, owner_id, status, health_status, health_reasons, budget_hours, consumed_hours, customer_id, visibility_scope) values
  ('00000000-0000-0000-0000-0000000000b1','AI Support Chatbot','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000a6','ACTIVE','CRITICAL','{"3 tasks overdue","Sarah & Zara over 100% this week","work going slower than planned"}',1200,998,'00000000-0000-0000-0000-0000000000c1','{00000000-0000-0000-0000-0000000000d1}'),
  ('00000000-0000-0000-0000-0000000000b2','Fitness Mobile App','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000a1','ACTIVE','ON_TRACK','{"On schedule"}',640,312,null,'{00000000-0000-0000-0000-0000000000d1}'),
  ('00000000-0000-0000-0000-0000000000b3','Sales Analytics Dashboard','00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-0000000000ad','ACTIVE','AT_RISK','{"Just started, almost no team","several tasks unassigned"}',880,84,null,'{00000000-0000-0000-0000-0000000000d3}'),
  ('00000000-0000-0000-0000-0000000000b4','Cloud & Deployment Setup','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000aa','ACTIVE','DELAYED','{"Security review blocked on vendor","2 setup tasks behind"}',520,305,null,'{00000000-0000-0000-0000-0000000000d1}'),
  ('00000000-0000-0000-0000-0000000000b5','App Design System','00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-0000000000ab','ACTIVE','ON_TRACK','{"Most core components built"}',400,238,null,'{00000000-0000-0000-0000-0000000000d2}'),
  ('00000000-0000-0000-0000-0000000000b6','Online Store','00000000-0000-0000-0000-0000000000d4','00000000-0000-0000-0000-0000000000af','PLANNING','ON_TRACK','{"Kickoff scheduled"}',360,18,null,'{00000000-0000-0000-0000-0000000000d4}')
on conflict (id) do nothing;

-- a representative set of tasks (the chatbot + dashboard story). week_start is the
-- current sprint Monday; adjust as needed. Status/priority match the app enums.
insert into tasks (id, title, project_id, assignee_id, status, priority, estimated_hours, week_start) values
  ('00000000-0000-0000-0000-0000000000f1','Build the chat window UI','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a8','IN_PROGRESS','HIGH',12,current_date),
  ('00000000-0000-0000-0000-0000000000f2','Build the message API','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a6','IN_PROGRESS','URGENT',14,current_date),
  ('00000000-0000-0000-0000-0000000000f3','Set up the chatbot database','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a6','TO_DO','HIGH',9,current_date),
  ('00000000-0000-0000-0000-0000000000f4','Train the AI reply model','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000ad','BLOCKED','URGENT',16,current_date),
  ('00000000-0000-0000-0000-0000000000f5','Connect the chatbot to live chat','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a4','IN_PROGRESS','HIGH',10,current_date),
  ('00000000-0000-0000-0000-0000000000f7','Test the chatbot answers for accuracy','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a9','TO_DO','HIGH',10,current_date),
  ('00000000-0000-0000-0000-00000000f015','Build the dashboard layout','00000000-0000-0000-0000-0000000000b3',null,'TO_DO','HIGH',12,current_date),
  ('00000000-0000-0000-0000-00000000f016','Build the sales data pipeline','00000000-0000-0000-0000-0000000000b3',null,'TO_DO','HIGH',14,current_date),
  ('00000000-0000-0000-0000-00000000f018','Connect the dashboard to the database','00000000-0000-0000-0000-0000000000b3','00000000-0000-0000-0000-0000000000ae','IN_PROGRESS','MEDIUM',8,current_date),
  ('00000000-0000-0000-0000-00000000f020','Set up the production servers','00000000-0000-0000-0000-0000000000b4','00000000-0000-0000-0000-0000000000aa','IN_PROGRESS','HIGH',10,current_date),
  ('00000000-0000-0000-0000-00000000f024','Security review of the cloud setup','00000000-0000-0000-0000-0000000000b4','00000000-0000-0000-0000-0000000000a5','BLOCKED','HIGH',6,current_date),
  ('00000000-0000-0000-0000-00000000f031','Review & approve the chat screens','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a8','CLIENT_REVIEW','MEDIUM',4,current_date)
on conflict (id) do nothing;

-- capacity logs (this week) — the overload/underload story
insert into capacity_logs (user_id, week_start, allocated_hours, utilization_pct) values
  ('00000000-0000-0000-0000-0000000000a6',current_date,46,1.15),  -- Sarah overloaded
  ('00000000-0000-0000-0000-0000000000ad',current_date,44,1.10),  -- Zara overloaded
  ('00000000-0000-0000-0000-0000000000a4',current_date,26,0.65),  -- Ahmed headroom
  ('00000000-0000-0000-0000-0000000000ae',current_date,18,0.45),  -- Ray free
  ('00000000-0000-0000-0000-0000000000ac',current_date,16,0.50)   -- Inés free
on conflict (user_id, week_start) do nothing;

-- risks (severity auto-computed by trigger)
insert into risks (id, title, category, probability, impact, owner_id, project_id, status, signals) values
  ('00000000-0000-0000-0000-00000000c001','Only one person knows how the AI model works','people','high','critical','00000000-0000-0000-0000-0000000000ad','00000000-0000-0000-0000-0000000000b1','MITIGATING','{"Zara is the only one who can train the model","she is overloaded at 110%"}'),
  ('00000000-0000-0000-0000-00000000c002','Cloud security vendor is running late','vendor','high','high','00000000-0000-0000-0000-0000000000af','00000000-0000-0000-0000-0000000000b4','ESCALATED','{"security review blocked 2 days","vendor missed start date"}'),
  ('00000000-0000-0000-0000-00000000c003','The Sales Dashboard has no team yet','operational','high','high','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b3','OPEN','{"3 tasks have no owner","deadline Sep 11"}'),
  ('00000000-0000-0000-0000-00000000c004','Sarah is overloaded and has not taken a break','people','high','high','00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000b1','MITIGATING','{"115% this week","no time off in 112 days"}'),
  ('00000000-0000-0000-0000-00000000c006','The chatbot could leak customer information','security','low','critical','00000000-0000-0000-0000-0000000000a5','00000000-0000-0000-0000-0000000000b1','OPEN','{"chat messages may contain personal data"}')
on conflict (id) do nothing;

-- decisions
insert into decisions (id, title, rationale, owner_id, project_id, status, confidence_level) values
  ('00000000-0000-0000-0000-00000000de01','Build the chatbot UI and AI model at the same time','Parallel build is the only way to hit the August launch, with weekly syncs.','00000000-0000-0000-0000-0000000000a6','00000000-0000-0000-0000-0000000000b1','ACTIVE','high'),
  ('00000000-0000-0000-0000-00000000de02','Use one shared design system across all apps','Reuse makes every app faster to build and consistent.','00000000-0000-0000-0000-0000000000ab','00000000-0000-0000-0000-0000000000b5','ACTIVE','high'),
  ('00000000-0000-0000-0000-00000000de03','Start the Sales Dashboard now with a small team','Starting the data pipeline early de-risks the September deadline.','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b3','ACTIVE','medium')
on conflict (id) do nothing;

-- goals + key results
insert into goals (id, title, owner_id, department_id, target_date, progress, key_results) values
  ('00000000-0000-0000-0000-000000009001','Launch the AI Support Chatbot by August','00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000d4','2026-08-31',0.62,'[{"title":"Chatbot answers real questions","progress":0.55},{"title":"Support workload drops 30%","progress":0.4}]'),
  ('00000000-0000-0000-0000-000000009002','Ship the Fitness App and start the Online Store','00000000-0000-0000-0000-0000000000af','00000000-0000-0000-0000-0000000000d4','2026-10-30',0.41,'[{"title":"Fitness App live","progress":0.48},{"title":"Store team staffed","progress":0.1}]'),
  ('00000000-0000-0000-0000-000000009003','Make the chatbot answer 80% of questions correctly','00000000-0000-0000-0000-0000000000ad','00000000-0000-0000-0000-0000000000d3','2026-09-15',0.70,'[{"title":"Model trained on real chats","progress":0.85},{"title":"Replies under 3s","progress":0.75}]')
on conflict (id) do nothing;

-- notifications (per-user, realtime)
insert into notifications (user_id, klass, type, payload) values
  ('00000000-0000-0000-0000-0000000000a1','critical_action','risk_escalation','{"title":"AI Support Chatbot is CRITICAL","entity":"b1"}')
on conflict do nothing;

-- ============================ THE GRAPH (entity_relationships) ===============
insert into entity_relationships (source_id, source_type, relationship_type, target_id, target_type, strength, confidence, evidence_type) values
  -- assignments (person → project)
  ('00000000-0000-0000-0000-0000000000a6','user','executes','00000000-0000-0000-0000-0000000000b1','project',0.95,1.0,'declared'),
  ('00000000-0000-0000-0000-0000000000ad','user','executes','00000000-0000-0000-0000-0000000000b1','project',0.9,1.0,'declared'),
  ('00000000-0000-0000-0000-0000000000a4','user','executes','00000000-0000-0000-0000-0000000000b1','project',0.8,1.0,'declared'),
  ('00000000-0000-0000-0000-0000000000ae','user','executes','00000000-0000-0000-0000-0000000000b3','project',0.8,1.0,'declared'),
  -- reporting + expertise (bus factor: Zara sole AI holder)
  ('00000000-0000-0000-0000-0000000000a4','user','reports_to','00000000-0000-0000-0000-0000000000a3','user',1.0,1.0,'declared'),
  ('00000000-0000-0000-0000-0000000000a1','user','reports_to','00000000-0000-0000-0000-0000000000a3','user',1.0,1.0,'declared'),
  -- risk propagation
  ('00000000-0000-0000-0000-0000000000b1','project','threatened_by','00000000-0000-0000-0000-00000000c001','risk',0.9,0.95,'inferred'),
  ('00000000-0000-0000-0000-0000000000ad','user','owns_risk','00000000-0000-0000-0000-00000000c001','risk',1.0,1.0,'declared'),
  ('00000000-0000-0000-0000-0000000000b1','project','delivers_value_to','00000000-0000-0000-0000-0000000000c1','customer',0.9,1.0,'declared'),
  -- decision lineage
  ('00000000-0000-0000-0000-00000000de01','decision','governs','00000000-0000-0000-0000-0000000000b1','project',0.85,1.0,'declared')
on conflict (source_id, source_type, target_id, target_type, relationship_type) do nothing;

-- causal signal
insert into causal_signals (effect_entity_id, effect_entity_type, effect_field, effect_value, cause_type, cause_entity_id, cause_entity_type, cause_description, confidence, derivation) values
  ('00000000-0000-0000-0000-0000000000b1','project','health_status','CRITICAL','threshold_breach','00000000-0000-0000-0000-0000000000a6','user','Backend lead at 115% for 3 consecutive weeks',0.85,'rule_based')
on conflict do nothing;

commit;
