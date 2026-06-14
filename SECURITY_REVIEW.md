# DIZRUPT — Security Review

> Honest security posture after the identity/tenancy sprint.

## Enforced & verified
- **Tenant isolation** — restrictive RLS; active escape attempts blocked (admin cannot
  cross orgs). See TENANCY_ARCHITECTURE.md.
- **RLS row scoping** — earlier 10/10 positive/negative suite (dept/user/anon).
- **API auth gate** — every `/api/v1` route resolves a principal; unauthenticated → 401
  (verified live on org-health/risk/dependency intelligence routes).
- **Audit immutability** — UPDATE/DELETE revoked on `audit_events`; triggers insert-only.
- **Secrets** — server-only (service-role key never shipped to client); `.env.local` git-ignored.
- **Money integrity** — int4→bigint (no overflow/corruption).

## Known weaknesses (must fix before production)
1. **No real authentication** — demo personas; RLS depends on a JWT that app flows don't
   yet issue. Highest priority. (OAuth blocked on provider config.)
2. **JWT role/org claims** not yet minted by a real sign-in (tests simulate them).
3. **CSRF** tokens not on mutations; **CSP** not strict/nonce-based.
4. **Rate limiting** is per-IP in-memory (not distributed).
5. **Penetration testing** beyond RLS not performed (IDOR, mass-assignment on writes).
6. **Service-role usage** is broad server-side; scope to least-privilege per route later.

## Validation performed this sprint
- Tenant-escape (cross-org read/write) → denied.
- Privilege escalation via RLS (anon/employee reading governance) → denied (prior suite).
- Unauthenticated intelligence access → 401.

## Recommendation
Tenancy and authorization are sound *given a real identity*. The single gate to
legitimate multi-tenant deployment is **production auth that issues role+org JWT claims**.
