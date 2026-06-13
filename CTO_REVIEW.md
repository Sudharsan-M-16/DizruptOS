# DIZRUPT — Principal Architect / CTO Review

> Brutally honest, optimized for correctness over agreement. Written against the
> live state (Supabase backend, 34 tables, RBAC + approvals workflow), not the
> aspirational PRD. Date: 2026-06-13.

## Verdict in one line
DIZRUPT has an unusually strong **schema/ontology + graph + governance substrate**
for its age, and an honest, well-tested core — but it is **mostly a frontend with a
freshly-wired backend**: only one read vertical is live, auth is still demo personas,
and the "intelligence" is seeded, not computed. The defensible parts exist as
*foundations*, not yet as *products*.

## Architectural strengths (keep / lean in)
- **Graph-native ontology already in the DB.** `entity_relationships` (closed typed
  registry), `entity_paths` (traversal cache), `causal_signals`, `entity_embeddings`
  (vector 1536), `scenarios`/`org_snapshots`. This is the genuinely hard-to-copy core.
- **Laws enforced at the database, not just the UI** — RLS (validated 10/10), audit
  immutability via triggers, computed risk severity, atomic `reallocate_task` RPC.
- **Governance is now first-class** — `approvals` table + `authorize/submit/decideChange`
  with rationale/evidence/escalation/affected-entities. This is the seed of decision
  intelligence and organizational memory.
- **Clean seams** — repository → service → API envelope; pure tested domain functions.

## Architectural weaknesses (fix deliberately)
1. **Two domain models still coexist.** The live schema (snake/uuid, richer) vs the
   demo TS model (`code`, `velocityTrend`, string ids). Option A is decided but only
   `projects` is migrated. **Every extra week of drift compounds.** Finish the migration.
2. **Money is `int4` micro-units** → overflows above ~$2.1K. Latent data-corruption bug.
   Widen to `bigint` (migration 0004) before any real revenue data.
3. **No `organization`/tenant.** Scoping is by `department_id`. A true multi-tenant SaaS
   needs `org_id` on every table + RLS — retrofitting later is painful. Decide now.
4. **Auth is demo personas.** No real identity, MFA, or `auth.users` linkage. The RLS
   policies assume `auth.uid()`/`app_metadata.role` that nothing currently issues.
5. **"Intelligence" is seeded, not computed.** Severity/health triggers exist, but blast
   radius, bus-factor, expertise, decision lineage are not yet derived from the live graph.
6. **`entity_paths` has no refresher.** The traversal cache will silently rot without a
   worker. Either compute on read (small N) or schedule recompute.

## Missing entities (ontology gaps)
- **Organization / Tenant** (critical — see above).
- **Capability / Competency / Skill** as first-class nodes (today skills are a `text[]`
  on users → can't be related, rated, or gap-analyzed). This blocks expertise & capability
  intelligence, which are core differentiators.
- **Team** (distinct from department) — squads cut across departments.
- **Process / Policy / Control** — needed for governance/compliance intelligence.
- **Vendor / System** as distinct from `services` — operational-twin completeness.
- **Strategic Initiative / Objective** above projects — to trace work → strategy.

## Missing relationships
- `knows`/`mentors`/`backs_up` between people (succession & bus-factor need these).
- `requires_capability` (project/task → capability) — the join that powers staffing
  simulation and capability gap analysis.
- `influences`/`escalates_to` on the org/people graph (already in the registry enum but
  unused) — for influence mapping and approval routing.

## Missing *systems* (not features)
1. **Identity & access system** (real auth + org/tenant + SCIM/SSO).
2. **Capability system** (skills as nodes, proficiency, decay, gap analysis).
3. **Computation/intelligence engine** — the worker that turns the graph into expertise
   maps, blast radius, risk propagation, decision lineage (today there is none).
4. **Simulation engine** — `scenarios` table exists; nothing runs it.
5. **Organizational memory system** — approvals + decisions + causal_signals are the
   substrate, but there is no retrieval/summarization layer over them.
6. **Notification/eventing backbone** — realtime tables are published, but no producer
   fans domain events into them yet.

## Competitive defensibility (what takes a competitor *years*)
- **The ontology + relationship registry + causal + embedding substrate**, *if* it is
  populated from real org activity. UI (Linear-grade) is copyable in months; the
  **graph of an organization's real dependencies, expertise, and decisions** is not.
- **Recommendation:** spend the next sprints making the graph *computed and alive*, not
  prettier. The moat is data + derived intelligence, not pixels.

## Five-year regrets to avoid
- Not adding `org_id` now. / Leaving money as int4. / Letting the two domain models drift.
- Treating intelligence as seeded demo content instead of a real computation engine.

## Natural evolution / where the leverage is
**Organizational Operating System** via the **decision-intelligence + capability-graph**
path. The approvals/decisions/causal substrate is the wedge: every action becomes an
explainable, queryable, simulatable graph event. Lean there.

## Recommended roadmap (leverage order)
1. Finish Option-A migration (people→risks→capacity→decisions→knowledge) + real auth + `org_id`.
2. Promote **Capability** to a first-class entity + `has_capability`/`requires_capability`.
3. Build the **computation engine** (expertise, bus-factor, blast radius, risk propagation)
   over the live graph → the first true intelligence surfaces.
4. Wire the **simulation engine** to `scenarios`.
5. Organizational-memory retrieval (GraphRAG over approvals/decisions/causal_signals/embeddings).
6. Fix `bigint` money; add `entity_paths` refresher; event backbone for realtime.
