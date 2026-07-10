# DIZRUPT — Final Gap Analysis

| Gap | Status | Blocker / effort |
|---|---|---|
| Repo↔schema model split | ✅ closed (0008) | done |
| CI/CD | ✅ added | done (workflow); needs repo on GitHub Actions to run |
| Production build | ✅ verified | done |
| Real authentication | ❌ | multi-day refactor; OAuth needs Supabase provider config (external) |
| Org admin / invitations / membership | ❌ | depends on real auth |
| Executive intelligence surface | ❌ | UI, ~1wk; data is API-ready |
| Intelligence consumption UIs | 🟡 1 of ~7 (`/capabilities`) | UI, multi-day; APIs ready |
| Realtime (event→recompute→push) | 🟡 publication only | ~1wk |
| Observability (OTel/Sentry/metrics) | ❌ | ~M |
| Accessibility audit | ❌ | ~M |
| Data import (CSV/Jira/HRIS) | ❌ | foundations ~M; real connectors XL |
| GraphRAG/copilot | ❌ | needs embeddings populated + LLM wiring |
| Active security pen-test | 🟡 RLS+tenancy verified | IDOR/mass-assignment untested |

## What only real-world inputs can resolve
- Intelligence **calibration** (do scores predict outcomes?) — needs real history.
- **Adoption/wedge/market** proof — needs design partners.
- **Live digital twin** — needs continuous external data feeds.
- **Compliance** — needs business/legal, not code.

## Single highest-leverage next action
Email+magic-link auth (self-contained, no external config) → then one real org's data via
CSV import → then the executive surface. That sequence converts the platform from
"computes on seed" to "used on real data".
