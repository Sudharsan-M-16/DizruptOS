# DIZRUPT — Executive Intelligence Workspace

> Route: `/briefing` (sidebar: Intelligence ▸ Exec Briefing, gated `view_executive`).
> The leadership operating console — a reasoning workspace, not a dashboard.

## What it answers (computed live)
- **What should I worry about?** — Organizational Health score + band + the top concern
  signals (capability fragility / succession / workload / governance / decision grounding),
  computed by `org-health` engine, **not surveyed**.
- **Why?** — every concern shows the driver percentages behind the score (no opaque 71).
- **What do I do next?** — ROI-ranked **recommendations** (from the recommendation engine),
  each with: rationale (why), evidence chips, impact band, priority, and the entity it
  concerns (`traceTo`). e.g. "Cross-train a backup for Finance & Modeling — bus factor 1,
  succession risk critical, strategic importance high."

## Data path
`/briefing` → `useOrgHealth()` + `useRecommendations()` (TanStack, cached) →
`/api/v1/org-health` + `/api/v1/recommendations` (secured) → loaders → engines → live graph.
Loading + error + empty states handled.

## Verified
`tsc` clean; **production build compiles + prerenders `/briefing`**; 137 tests green.
(Visual screenshot pending a running dev server — see note in PLATFORM_ACTIVATION_REPORT.)

## Honest scope
This is **Phase 1** of the sprint — the highest-ROI consumption surface, now real. It
consumes two engines (health + recommendations). Extending it to embed inline simulation
previews ("accept → expected risk reduction 42%"), decision-memory exploration, and the
people/risk/dependency drill-downs is the natural next iteration (those engines/APIs exist).
