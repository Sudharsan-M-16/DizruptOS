# DIZRUPT — Data Import Architecture

> Turns "demo data" into "customer data." Pure parse/validate (`lib/import/csv.ts`)
> → import service (`server/services/import.ts`) → live upsert → intelligence reads it.

## Flow (built + verified)
Upload/paste CSV → `parseCSV` (RFC-4180-ish, dependency-free) → `parseAndValidate`
(per-entity schema: required cols, enums, numbers; case-insensitive headers) → POST
`/api/v1/import` {entity, csv} → `importCsv` upserts to Supabase via PostgREST
(`Prefer: resolution=merge-duplicates` = MERGE conflict strategy) → rows land in the live
graph → capability/people/org-health/recommendations engines reflect them on next read.

## Entities supported (this pass)
- **capabilities** — `name, category, strategic_importance`
- **employees** (→ `users`) — `name, email, role, title, capacity_hours`
- **employee_capabilities** (skills) — `email, capability, proficiency`
  (resolves email→user_id and capability name→id, then upserts the rated edge)

UI: `/import` (sidebar ▸ Data ▸ Import Data) — entity picker, paste or file upload,
result counts + per-row errors, template download (`GET /api/v1/import?template=<entity>`).

## Conflict handling
Upsert/MERGE on natural keys: capabilities `(org_id, name)`, users `(email)`,
employee_capabilities `(user_id, capability_id)`. Migration **0009** added the plain unique
constraints these need (the prior indexes were expression/partial → not valid `on_conflict`
targets; this was a real bug found and fixed during live verification).

## Verified (live, end-to-end)
CSV → upsert → `capabilities 5 → 6` (status 201) → cleaned up. Parser/validator: 6 unit
tests (quotes/commas/newlines, required/enum/number validation, case-insensitive headers).
`tsc` clean; production build compiles `/import` + `/api/v1/import`. 143 tests total.

## Templates
`GET /api/v1/import?template=capabilities|employees|employee_capabilities` returns a
header+example CSV. Same headers the validator expects.

## NOT built yet (honest)
- Dedicated mapping workspace (source-col → target-field with saved templates) — current
  UI requires the documented headers (no arbitrary-column remapping).
- Import preview/dry-run before commit; conflict-resolution UI (merge/replace/ignore choices);
  import-history/job audit table.
- The other entities (teams/projects/tasks/risks/decisions/outcomes/learnings/approvals/
  relationships) — same pattern, not yet wired.
- Integrations (Jira/Linear/GitHub/HRIS/Calendar) — connector architecture not built.
- Onboarding flow (create-org → import → briefing) — gated on real auth (AUTH_COMPLETION_PLAN.md).
