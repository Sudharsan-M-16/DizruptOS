
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

### June 13 (cont.) — People Intelligence (Human Intelligence Layer)

People are now computed nodes, not rows. `server/engine/people-intelligence.ts`
(7 tests) computes per person: primary/secondary expertise, strategic coverage,
**sole-holder (irreplaceability)**, replacement candidates, **degree centrality**
(from entity_relationships), **knowledge concentration**, and an **org-dependency
score (0..1)** — each with an `evidence[]` + plain-language `explanation` (shared
engine contract). Plus `departureImpact(person)` ("if they leave → lost/weakened
capabilities") and `peopleHealth` rollup.

- `RelationshipRepository` added (memory demo edges + Supabase `entity_relationships`).
- `server/services/people-loader.ts` derives people from capability holders +
  graph edges (works on memory and live without the people↔users reconciliation).
- `GET /api/v1/people/intelligence` — **verified live**: 5 people, 1 irreplaceable
  (Noor, sole holder of Finance & Modeling), ranked by org-dependency, explained.
- Intelligence Engine now exposes `capability` + `people` modules under one barrel.

**Still open (honest):** the `employees→users` / `capacity→capacity_logs` repo
table-name mappers (People Intelligence sidestepped them by deriving people from
the capability graph). Dashboard redesign: inspiration assets now present in
`different application pics/` (Asana, ClickUp, Monday, dark-mode ref) — scheduled
as the next dedicated pass. Next intelligence module per sequence: Decision
Intelligence over `approvals`/`decisions` (organizational memory: "why did we do this").

### June 13 (cont.) — Command Center redesign (Monday/Linear-inspired)

Studied inspiration assets in `different application pics/` (Monday, Asana, ClickUp,
dark-mode ref). Redesigned the command center's primary glance: the flat divided
"pulse strip" → **premium hero KPI tiles** — accent-tinted corner gradient per metric,
colored icon chip, 2.5rem numbers, label + trend, Explain popover, hover-lift, whole
card clickable to its page (PULSE_META + PULSE_HREF). Dark/volt palette, not a light
copy. Functionality + live data preserved; `tsc` clean, no page errors, screenshot-verified.
NOTE: other pages share the global de-cramp; bespoke per-page redesigns are a follow-up.
