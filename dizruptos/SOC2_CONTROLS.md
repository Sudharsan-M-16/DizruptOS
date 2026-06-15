# DIZRUPT — SOC 2 Type II Controls Map

> Status as of 2026-06-15. This document maps DIZRUPT's implemented controls
> to Trust Services Criteria (TSC) from AICPA. Controls marked ✅ are
> code-implemented and verifiable. Controls marked 🟡 are partially implemented
> (architectural foundation exists; operational verification pending). Controls
> marked ⬜ require external process or SOC2 auditor certification.

---

## Security (CC) — Common Criteria

### CC1 — Control Environment

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Logical access controls | CC1.1 | ✅ | 3-layer RBAC: UI + OS + data-layer deny. `lib/rbac.ts`, `server/services/authz.ts` |
| Role-based access policies | CC1.2 | ✅ | 5-role matrix (admin/exec/dept_head/PM/employee), permission gating in `lib/personas.ts` |
| Principle of least privilege | CC1.3 | ✅ | Every API route calls `requirePermission()` before serving data |
| User provisioning / deprovisioning | CC1.4 | 🟡 | SCIM 2.0 API scaffold (`/api/v1/scim/Users`). Production: wire to Supabase admin API |

### CC2 — Communication

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Security policies documented | CC2.1 | 🟡 | AUTH_SETUP.md, CLAUDE.md; formal policy document pending |
| Incident response plan | CC2.2 | ⬜ | Requires operational runbook |

### CC3 — Risk Assessment

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Risk identification | CC3.1 | ✅ | Built-in risk intelligence engine (`/api/v1/intelligence/risk`) tracks org risks |
| Risk monitoring | CC3.2 | ✅ | Org health score + top concerns computed continuously from live data |

### CC4 — Monitoring

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Audit trail — immutable | CC4.1 | ✅ | Insert-only `audit_events` table (no UPDATE/DELETE surface at repo layer). `AuditRepository.append()` |
| Audit trail — role-denied actions | CC4.2 | ✅ | Every `access_denied` OS-level event written to audit trail |
| Health monitoring | CC4.3 | ✅ | `/api/health` liveness + `/api/ready` readiness + `/api/v1/metrics` Prometheus |
| Alerting | CC4.4 | 🟡 | Metrics endpoint ready; Grafana / PagerDuty integration pending |

### CC5 — Control Activities

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Authentication | CC5.1 | ✅ (code) | Supabase magic-link + OAuth, session-validating middleware, JWT role claims |
| Session management | CC5.2 | ✅ | httpOnly cookies, idle auto-lock (10 min), single-session per persona |
| Password/token policies | CC5.3 | ✅ | No passwords stored — magic-link + OAuth only |
| MFA | CC5.4 | 🟡 | Supabase supports TOTP; not yet enforced for all roles |

### CC6 — Logical & Physical Access

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Network access controls | CC6.1 | ✅ | HTTPS-only (HSTS), CSP in `vercel.json` + `middleware.ts` |
| API rate limiting | CC6.2 | ✅ | 120 req/min/IP in API middleware |
| RLS row-level security | CC6.3 | ✅ | Every table has org_id-scoped RLS; verified 10/10 in BACKEND_READINESS_AUDIT.md |
| Secret management | CC6.4 | ✅ | Secrets in env vars only; `.env.example` never contains real values; gitignored |
| Dependency vulnerability scanning | CC6.5 | 🟡 | `npm audit` in CI (high+critical); lock file committed |

### CC7 — System Operations

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Change management | CC7.1 | 🟡 | GitHub PR + CI required for main. CD workflow deploys automatically |
| Deployment pipeline | CC7.2 | ✅ | `.github/workflows/ci.yml` (typecheck/lint/test/build) + `cd.yml` (Vercel deploy) |
| DB migration management | CC7.3 | 🟡 | Migrations in `supabase/migrations/`; CI runs apply on deploy to prod |
| Incident detection | CC7.4 | 🟡 | Health probes live; full error tracking (Sentry) pending `SENTRY_DSN` config |

### CC8 — Change Management

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Code review requirement | CC8.1 | 🟡 | PR process; branch protection rules to be enforced in GitHub settings |
| Automated testing in CI | CC8.2 | ✅ | 174 unit tests in CI; E2E smoke in workflow |

### CC9 — Risk Mitigation

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Governance workflow | CC9.1 | ✅ | Dual-approval governance queue (`approvals` table + `ApprovalRepository`) |
| Data backup | CC9.2 | 🟡 | Supabase daily backups on Pro+ plan; restore procedure documented pending |

---

## Availability (A)

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Uptime monitoring | A1.1 | 🟡 | Health probe + readiness probe; external uptime monitor (Betterstack/UptimeRobot) pending |
| Recovery objectives | A1.2 | ⬜ | RTO/RPO definition pending ops planning |
| Redundancy | A1.3 | 🟡 | Vercel edge deployment (global CDN); Supabase HA on Pro+ |

---

## Confidentiality (C)

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Data classification | C1.1 | 🟡 | Schema distinguishes PII fields; financial data restricted by RBAC |
| Encryption in transit | C1.2 | ✅ | TLS 1.2+ enforced (HSTS); Supabase uses TLS for all connections |
| Encryption at rest | C1.3 | 🟡 | Supabase Pro: AES-256 at rest. Verify in Supabase dashboard |
| Data subject export/delete | C1.4 | ⬜ | GDPR right-to-erasure API not yet implemented |

---

## Processing Integrity (PI)

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Input validation | PI1.1 | ✅ | API boundary validation (`fail(422)` on missing/invalid inputs) |
| State machine enforcement | PI1.2 | ✅ | Lifecycle state machines for tasks/risks/recommendations/proposals |
| Atomic operations | PI1.3 | ✅ | `reallocate_task` RPC is a single DB transaction; capacity deltas atomic |

---

## Privacy (P) — where applicable

| Control | Ref | Status | Evidence |
|---|---|---|---|
| Privacy notice | P1.1 | ⬜ | Privacy policy document pending |
| Consent | P2.1 | ⬜ | Consent flow pending (required before GA) |
| Data minimization | P3.1 | ✅ | Financial fields (salary, compensation) redacted from employee API responses for non-admin |
| Retention | P4.1 | ⬜ | Retention schedule and purge policy pending |

---

## Gap summary

**To pass SOC2 Type II audit:**
1. Enforce branch protection + mandatory PR reviews in GitHub settings.
2. Wire Sentry (`SENTRY_DSN`) for error tracking.
3. Define and document RTO/RPO.
4. Implement GDPR right-to-erasure `/api/v1/users/:id/erase`.
5. Write formal privacy policy + data processing agreement.
6. Engage external auditor (typically Vanta, Drata, or direct AICPA firm).
7. Run continuous control monitoring for 6 months → Type II report.

**Controls already strong enough for enterprise sales conversations:**
- 3-layer RBAC + audit trail (CC4, CC5, CC6)
- SQL RLS (CC6.3)
- CI/CD + automated testing (CC7, CC8)
- Immutable audit log (CC4.1)
- SCIM provisioning scaffold (CC1.4)
- SSO SAML scaffold (CC5.1)
