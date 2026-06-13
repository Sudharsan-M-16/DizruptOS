-- Capability seed — deliberately shaped to produce interesting computed signals:
-- Payments held by 1 expert (bus factor 1, critical → high succession risk),
-- Cloud held by 2, Frontend healthy (3), Finance solo, Vendor Negotiation solo.
begin;

insert into organizations (id, name, slug) values
  ('00000000-0000-0000-0000-0000000f0001','Dizrupt Inc','dizrupt') on conflict (id) do nothing;
update departments set org_id='00000000-0000-0000-0000-0000000f0001' where org_id is null;

insert into teams (id, name, org_id, department_id, lead_id) values
  ('00000000-0000-0000-0000-0000000ee001','Payments Platform','00000000-0000-0000-0000-0000000f0001','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000a3')
on conflict (id) do nothing;
insert into team_members (team_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000ee001','00000000-0000-0000-0000-0000000000a3','lead'),
  ('00000000-0000-0000-0000-0000000ee001','00000000-0000-0000-0000-0000000000a4','member'),
  ('00000000-0000-0000-0000-0000000ee001','00000000-0000-0000-0000-0000000000a1','member')
on conflict do nothing;

insert into capabilities (id, name, category, strategic_importance, org_id) values
  ('00000000-0000-0000-0000-00000000ca01','Payments Systems','engineering','critical','00000000-0000-0000-0000-0000000f0001'),
  ('00000000-0000-0000-0000-00000000ca02','Cloud Infrastructure','engineering','high','00000000-0000-0000-0000-0000000f0001'),
  ('00000000-0000-0000-0000-00000000ca03','Frontend Engineering','engineering','medium','00000000-0000-0000-0000-0000000f0001'),
  ('00000000-0000-0000-0000-00000000ca04','Finance & Modeling','finance','high','00000000-0000-0000-0000-0000000f0001'),
  ('00000000-0000-0000-0000-00000000ca05','Vendor Negotiation','operations','medium','00000000-0000-0000-0000-0000000f0001')
on conflict (id) do nothing;

-- proficiency 1..5.
insert into employee_capabilities (user_id, capability_id, proficiency, is_primary, years_experience) values
  ('00000000-0000-0000-0000-0000000000a4','00000000-0000-0000-0000-00000000ca01',5,true,6),   -- Ahmed: Payments expert (sole deep)
  ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-00000000ca01',3,false,2),  -- Priya: partial backup
  ('00000000-0000-0000-0000-0000000000a4','00000000-0000-0000-0000-00000000ca02',4,true,4),   -- Cloud: Ahmed
  ('00000000-0000-0000-0000-0000000000a5','00000000-0000-0000-0000-00000000ca02',4,true,5),   -- Cloud: Elias
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000ca03',4,true,5),   -- Frontend: Asha
  ('00000000-0000-0000-0000-0000000000a4','00000000-0000-0000-0000-00000000ca03',3,false,3),  -- Frontend: Ahmed
  ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-00000000ca03',3,false,2),  -- Frontend: Priya (3 holders = healthy)
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-00000000ca04',5,true,9),   -- Finance: Noor (sole)
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-00000000ca05',4,true,7)    -- Vendor Neg: Noor (sole)
on conflict (user_id, capability_id) do nothing;

insert into project_capabilities (project_id, capability_id, importance) values
  ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000ca01','required'),
  ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000ca02','required'),
  ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-00000000ca03','required')
on conflict do nothing;

commit;
