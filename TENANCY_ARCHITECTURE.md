# DIZRUPT — Tenancy Architecture

> How DIZRUPT isolates organizations. Migration `0007_multitenancy.sql`.

## Model
- **Organization** is the tenant root (`organizations`). Every tenant-scoped entity
  carries `org_id`: users, projects, tasks, risks, decisions, outcomes, learnings,
  approvals, capabilities, teams (+ departments).
- A user's tenant is `users.org_id`, resolved by `auth_org()` (SECURITY DEFINER,
  pinned search_path → no RLS recursion).

## Isolation mechanism — RESTRICTIVE RLS
Each tenant table has a **restrictive** policy:
`org_id IS NOT DISTINCT FROM auth_org()` (USING + WITH CHECK). Restrictive policies
are **AND-combined** with the existing permissive role policies — so tenancy is a hard
floor: no role (not even admin) can read or write across organizations.

The `service_role` (server-side repositories) bypasses RLS by design; tenant scope is
then applied in the loader layer. Direct `authenticated`/`anon` access is hard-isolated.

## Verified (active tenant-escape attempts)
With a second org "Rival Corp" + a project in it:
- Org A **admin** → sees 2 projects, **0 of Rival's**; **0 Rival users**.
- Org B user → sees only Rival's project.
All run as `authenticated` with simulated JWT claims. Tenant escape is blocked.

## Next
- `auth_org()` depends on a real JWT carrying the user → needs production auth (below).
- Add `org_id` to remaining leaf tables (employee_capabilities via user, capacity_logs).
- Platform super-admin role (cross-tenant) as a separate, audited capability.
