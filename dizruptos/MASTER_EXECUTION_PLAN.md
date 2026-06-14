
### June 14 (cont.) — Memory, lineage & narratives

Closed the three deferred product phases on top of the loop:
- **Decision lineage ontology** (`migration 0011`): `decision_evidence`,
  `decision_assumptions`, `decision_hypotheses` as first-class falsifiable
  records (assumptions → holds/violated; hypotheses → confirmed/refuted). Engine
  surfaces the full chain and downgrades "would we repeat?" when a success rested
  on a violated critical assumption. `LineageRepository` on both backends; reads
  are tolerant (no-op until 0011 is applied to a given DB).
- **Organizational Memory workspace** (`/memory`) — answers why / evidence /
  assumptions / what happened / learned / would-we-repeat per decision.
- **Executive Narratives** (`/narratives` + `GET /api/v1/intelligence/narrative`)
  — written weekly/monthly/quarterly briefs composed live from every engine;
  deterministic, grounded prose.
- **Demo mode now seeds a coherent decision-memory graph** (was empty) so the
  decision/memory surfaces work offline.
- **Readiness probe** `/api/ready` does a real backend read (verified live:
  `ready:true`, 264ms) — distinct from `/api/health` liveness.
- +7 tests (**174 total**), typecheck/lint/build clean; both surfaces screenshot-
  verified live on Supabase.

### June 14 — The learning loop closes (Observe → … → Calibrate → Improve)

DIZRUPT stops merely *generating* intelligence and starts *learning* from it.
Recommendations are now first-class operational entities that move through a
lifecycle and write their own accountability record. **Verified live end-to-end
against Supabase** (accept → complete → measure produced confidence 0.75,
baseline 0.875, actual 0.05, **accuracy 0.831**, then surfaced on the Learning
Dashboard + Copilot).

- **Recommendation lifecycle** (`migration 0010` + `RecommendationRepository` on
  both backends): `pending → acknowledged → accepted → completed → measured`
  (plus `rejected`/`deferred`), enforced by a pure state machine
  (`engine/recommendation-lifecycle.ts`). No dead recommendations.
- **Prediction writeback** — accepting a recommendation commits a prediction on
  the record (confidence + baseline + expected Δ). **Outcome tracking** —
  measuring records the actual value and scores accuracy = `1 − |expectedΔ −
  observedΔ|`.
- **Calibration completion** — the calibration engine now consumes *real*
  resolved predictions (measured recs) instead of hypotheticals; rolled up by
  the `learningIntelligence()` loader (accuracy, calibration gap, learning
  velocity, loop-conversion funnel, repeated mistakes, outcome quality).
- **Recommendation Center** (`/recommendations`) — the operational workspace:
  reasoning, evidence, affected entity, lifecycle rail, prediction/outcome
  ledger, and Accept/Defer/Reject/Complete/Measure actions (optimistic, audited).
- **Learning Dashboard** (`/learning`) — "are we getting smarter?": recommendation
  accuracy, calibration gap, learning velocity, accuracy-by-kind, blind spots,
  reusable knowledge.
- **Copilot ascension** — new grounded intents: *which recommendations worked /
  failed*, *what are our blind spots*, *what changed this week*, *best decisions*
  — answered from persisted lifecycle + calibration data (no hallucination).
- **API**: `POST /api/v1/recommendations/:id` (lifecycle transition),
  `GET /api/v1/intelligence/learning`. Chain: repository → loader → engine →
  API → UI, the same spine as every other surface.
- Tests: +14 (lifecycle state machine, prediction writeback, accuracy scoring,
  copilot learning intents, full end-to-end loop) → **167 passing**. typecheck +
  lint + build clean.
- Hardened the PostgREST client to tolerate empty (`return=minimal`/204) bodies
  and to skip non-UUID actor ids in lifecycle/audit writes (demo personas).

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
