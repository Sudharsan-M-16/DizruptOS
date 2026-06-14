# DIZRUPT — Recommendation Engine

> NOT AI chat — reasoning. Engine: `server/engine/recommendations.ts`.
> Live: `GET /api/v1/recommendations`.

## Principle
Turns computed intelligence into ranked, **evidence-backed, traceable** actions. Every
recommendation carries: `title`, `rationale` (why), `evidence[]`, `priority` (0..1),
`impact`, and `traceTo` (the entity it concerns).

## Sources → recommendation types
| Signal | Recommendation |
|---|---|
| Fragile / no-backup capability | `cross_train` a backup |
| Sole holder of strategic capability (succession exposure) | `assign_backup` owner |
| Critical dependency hub (blast radius) | `review_dependency` / add redundancy |
| Misjudged decision (retrospective) | `revisit_decision` |

Ranked by priority (strategic importance × succession risk × blast radius).

## Verified live
6 recommendations generated from the seeded org, top: "Reduce reliance on Payments API"
(critical, 0.90), "Cross-train a backup for Finance & Modeling" (critical, 0.88).

## Closes the loop
Decision → Outcome → Learning → **Recommendation** → Future Decision. This is the layer
that makes DIZRUPT *improve* future decisions, not just record past ones.

## Known refinement
Dependency-hub labels currently render entity UUIDs; resolve to human labels via an
entity-name lookup (cosmetic; logic correct).
