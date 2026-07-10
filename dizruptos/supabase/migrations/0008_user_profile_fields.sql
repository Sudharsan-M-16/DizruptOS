-- ============================================================================
-- Migration 0008 — Close the employee model split (P0 / repo↔schema alignment).
-- The TS `Employee` type carried fields the `users` table lacked (title,
-- location, pto, burnout) → a lossy mapper + a second source of truth. Per
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
