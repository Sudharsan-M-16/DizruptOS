# DIZRUPT — Simulation Architecture

> "Simulate the future." Engine: `src/server/engine/simulation.ts`.
> Live route: `GET /api/v1/simulation/departure?personId=`.

## Principle
A simulation = apply a hypothetical MUTATION to the live graph, recompute the
intelligence, and return the BEFORE → AFTER delta with a reasoned explanation.
Pure functions composing the capability + dependency engines (no DB, no UI).

## Mutators
- `withoutHolder(caps, userId)` — remove a person from the capability graph.
- `withHolder(caps, capId, holder)` — add a (hypothetical) hire.

## Scenarios implemented
| Function | Question | Computes |
|---|---|---|
| `simulateDeparture(userId, name, caps, edges)` | What if X leaves? | lost vs weakened capabilities, fragility Δ, graph reach, mitigation |
| `simulateStaffing(additions, caps)` | What if we hire? | fragility Δ, backup-gap closure |
| `simulateNodeFailure(nodeId, label, edges)` | What if X fails/slips? | blast radius + affected entities |

Every result carries `before`, `after`, `evidence[]`, and a plain-language `explanation`.

## Verified live
Departure of Noor (sole holder of two strategic capabilities) → lost = [Finance &
Modeling, Vendor Negotiation], with cross-train mitigation. A backed-up person (Ahmed) →
only *weakened* capabilities, none lost.

## Future plug-ins (same shape)
Decision simulation (replay with different evidence), dependency cascade (multi-node
failure), project-slip schedule propagation, and AI-proposed mitigations — all mutate
the graph and reuse this before/after delta contract.
