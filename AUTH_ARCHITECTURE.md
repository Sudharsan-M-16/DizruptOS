# DIZRUPT — Authentication Architecture

> Identity model + the path from demo personas to production auth.

## Current (verified)
- Edge middleware protects routes; httpOnly `dz_session` cookie; single-session law.
- API routes call `resolvePrincipal(req)` → 401 when unauthenticated (verified on the
  intelligence routes). RBAC: `lib/rbac.ts` (roles, `authorizeChange`, approval tiers,
  `canSeeEverything`/`canApprove`).
- **Demo personas** stand in for real identities today.

## Target (designed; OAuth needs provider config — see Blocked)
- **Supabase Auth** as the identity provider:
  - Google + Microsoft (Entra) OAuth via `supabase.auth.signInWithOAuth({ provider })`
    + an `/auth/callback` route exchanging the code for a session.
  - Email/password, magic links, password reset — Supabase built-ins.
- **Role + org into the JWT**: on sign-in, set `app_metadata.role` and `app_metadata.org_id`
  (Supabase Auth Hook / admin API) so `auth_role()`, `auth_org()`, and RLS work for real
  users exactly as they do for the simulated claims in tests today.
- `users.id` references `auth.users(id)`; an invitation flow creates the membership +
  org_id on first sign-in.

## Blocked (needs you)
Wiring Google/Microsoft OAuth requires **provider client IDs/secrets configured in the
Supabase dashboard** (Auth → Providers) + redirect URLs. I can't set or verify those from
here. Once configured, the client + callback route + JWT-claims hook are small, well-scoped
additions; the RLS/tenancy layer is already built to receive the claims.

## Enterprise readiness (foundations)
SSO/SAML + SCIM provisioning map onto the same `organizations`/`users`/role model;
membership + invitation tables are the next ontology addition.
