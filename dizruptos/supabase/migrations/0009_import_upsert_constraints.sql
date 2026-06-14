-- ============================================================================
-- Migration 0009 — plain unique constraints so CSV import upserts (PostgREST
-- on_conflict) work. The existing capabilities uniq is on (org_id, lower(name))
-- (expression) and users email is a PARTIAL index — neither is a valid
-- on_conflict target. Add plain constraints for idempotent import.
-- ============================================================================
alter table capabilities add constraint capabilities_org_name_uniq unique (org_id, name);
alter table users        add constraint users_email_uniq         unique (email);
