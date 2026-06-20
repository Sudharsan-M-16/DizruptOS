# ADR-005: Three-Layer RBAC Enforcement

**Status:** Accepted  
**Date:** 2026-05-25  
**Deciders:** Engineering + Security

## Context

Standard SPA access control only hides UI elements. This fails when users know API endpoints directly (API probing, curl). Enterprise software requires defense in depth.

## Decision

Enforce RBAC at **three independent layers**:

1. **OS Layer** — apps are hidden from Dock, Spotlight, and Launchpad if the principal lacks the required permission. Launching a gated app via URL shows an access-denied toast.

2. **API Layer** — every route handler calls `requirePermission(principal, "view_executive")` (or equivalent). This throws a 403 if the role doesn't have the permission, regardless of what the UI shows.

3. **Store Layer** — Zustand mutations check `useSession.can()` before executing. `requestReallocate()` returns `{ ok: false }` if the caller lacks `reallocate` permission, even if the API somehow passed.

Each layer is independently enforced. Bypassing layer 1 (UI hiding) does not help an attacker — they still hit layers 2 and 3.

## Consequences

**Positive:**
- Defense in depth — no single bypass grants access
- Permission matrix in `lib/personas.ts` is the single source of truth for all three layers
- RBAC violations are audited at the API layer (403 events)

**Negative:**
- Adds boilerplate to every route handler (`requirePermission` call)
- Store-layer check is weaker than API-layer (runs client-side; could be bypassed by direct API call)

## Permission Matrix

See `src/lib/personas.ts` and `connect.md §3` for the full matrix.

## Related

- `src/lib/personas.ts` — `roleCan()` function
- `src/server/services/authz.ts` — `requirePermission()`
- `src/lib/hooks/use-session.ts` — `useSession().can()`
- `src/lib/desktop-apps.tsx` — `perm` field on each app definition
