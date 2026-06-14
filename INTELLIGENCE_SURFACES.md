# DIZRUPT — Intelligence Surfaces

> The computed intelligence is exposed via secured, tenant-aware API surfaces.
> All require authentication (401 otherwise) and are tenant-isolated by RLS.

| Surface | Route | Answers |
|---|---|---|
| Capability Intelligence | `GET /api/v1/capabilities/intelligence` + `/capabilities` page | what exists / fragile / no backup / concentrated / at risk / experts |
| People Intelligence | `GET /api/v1/people/intelligence` | who is critical / irreplaceable / org-dependency / succession |
| Decision Intelligence + Memory | `GET /api/v1/decisions/memory` | why / who / evidence / outcome / learned / would-repeat / lineage |
| Organizational Health | `GET /api/v1/org-health` | score + band + top concerns + the driving signals |
| Dependency Intelligence | `GET /api/v1/intelligence/dependency` | critical hubs, blast radius, concentration |
| Risk Intelligence | `GET /api/v1/intelligence/risk` | dependency-adjusted risk, propagation, ranking |
| Departure Simulation | `GET /api/v1/simulation/departure?personId=` | lost/weakened capabilities, fragility Δ, mitigation |

## Reasoning-first contract
Every surface returns not just a score but `evidence[]` + `explanation` — the platform
explains *why*, not just *what*. The one shipped UI surface (`/capabilities`) demonstrates
the pattern (reasoning cards, not charts); the others have UIs pending (data is live).

## Future AI integration points
These routes are the retrieval layer for an Organizational Copilot: graph-aware +
relationship-aware answers ("biggest execution risk?", "who should own this?", "what
breaks if Sarah leaves?") compose directly from the engine outputs + memory graph.
