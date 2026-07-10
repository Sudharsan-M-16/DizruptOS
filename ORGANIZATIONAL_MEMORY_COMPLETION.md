# DIZRUPT — Organizational Memory Completion

> Extends ORGANIZATIONAL_MEMORY.md with retrospectives (the platform learns).

## The memory graph (complete chain)
Person → Decision → Approval → Outcome → Learning, each with org_id (tenant-scoped),
exposed via `GET /api/v1/decisions/memory`.

## Retrospectives (decision-intelligence `retrospective()`)
For every decision the platform now computes hindsight:
- **successScore** (0..1) from the outcome status (succeeded 1 / partial .5 / failed 0).
- **confidenceAccuracy** = `1 − |stated confidence − actual success|` — was our confidence calibrated?
- **hindsight**: `validated` / `mixed` / `misjudged` / `too_early`.
- explanation: e.g. "succeeded; the high confidence was well-calibrated" vs "did not work
  out despite high confidence — a calibration miss worth studying."

This closes the loop: DIZRUPT doesn't just record decisions, it grades its own judgment
over time — the basis for organizational learning.

## Verified
Retrospective tests: succeeded+high → validated; failed+high → misjudged; none → too_early.
Live decision memory returns rationale, outcome, learning, repeat recommendation, lineage.

## Next
- Evidence lineage over `causal_signals`; GraphRAG retrieval over the memory graph
  (`entity_embeddings` exists). Memory/retrospective surface UI (API ready).
