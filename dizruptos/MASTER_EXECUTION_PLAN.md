
### June 13 (cont.) — Computed intelligence exposed through the stack

**The chain is live and verified end-to-end** (repository → loader → engine → API → UI):
- `CapabilityRepository` + `EmployeeCapabilityRepository` (contract + memory seed +
  Supabase with PostgREST `users(full_name)` embedding).
- `server/services/capability-loader.ts` — assembles the live graph, feeds the engine.
- `GET /api/v1/capabilities/intelligence` — computed payload (health, ranked risk,
  scarcity, backup coverage, succession exposure, experts). **Verified live**: 5 caps,
  2 fragile, 60% coverage; Finance & Vendor = bus factor 1; Noor = single point of failure.
- **Capability Intelligence surface** `/capabilities` (sidebar: Intelligence ▸ Capability
  Intel) — reasoning-first (a plain-language *why* per capability), TanStack-cached,
  with loading + error + empty states. Answers: what exists / strategic / concentrated /
  fragile / no backup / at risk / who are the experts / who can replace them / why risky.

**Intelligence Engine generalized** (`server/engine/index.ts`): pure modules plug into
one engine (`import { capability } from "@/server/engine"`). Roadmap modules share the
shape: dependency, decision, risk, orgHealth, simulation. `capability` module now also
computes expertise: `experts` (discovery + replacement), `capabilityScarcity`,
`backupCoverage`, `successionExposure` (single points of failure).

#### Organizational Health — metric definitions (computation spec, no UI yet)
The eventual `orgHealth` engine module rolls these computed sub-signals into one score:
- **Capability fragility** — share of capabilities with bus factor ≤ 1 (live: `capabilityHealth.fragile / total`).
- **Backup risk** — share of capabilities with bus factor < 2 (`backupCoverage`).
- **Concentration risk** — mean HHI of expertise across capabilities (`concentration`).
- **Succession risk** — count of strategic capabilities with a single competent holder (`successionExposure`).
- **Workload risk** — share of people at utilization ≥ 1.0 (from `capacity_logs`).
- **Dependency risk** — blast-radius size of critical nodes (future `dependency` module over `entity_relationships`).
- **Decision latency** — median time pending→decided on `approvals`/`decisions` (governance signal).
Each is computed (never surveyed), explainable, and weighted; the rollup is the real
"organizational health" signal (CTO_REVIEW Tier 2 #9).

#### Note — perceived navigation slowness
Diagnosis: store-backed pages (command center, people) don't fetch, so TanStack can't
speed their nav — the lag is **dev-mode route compilation** + the route entrance
animation (prod is materially faster). Mitigations already in: removed per-section
opacity gating, lighter transitions, de-cramp. New data-backed surfaces (capabilities)
ARE TanStack-cached → instant on revisit. Deeper fix (route prefetch tuning / RSC
streaming) tracked, not yet applied.

Verification: `tsc` clean, **103/103 tests**, surface renders live computed data (no
page errors), app `mode=production` at http://localhost:5175.
