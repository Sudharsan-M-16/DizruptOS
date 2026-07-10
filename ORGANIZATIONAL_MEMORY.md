# DIZRUPT — Organizational Memory Architecture

> How DIZRUPT remembers *why* it did things and *what came of them*.
> Engine: `src/server/engine/org-memory.ts`. Substrate: `decisions`, `approvals`,
> `outcomes`, `learnings`, `causal_signals`, `entity_relationships`.

## The questions it answers
For any decision, `decisionMemory()` composes:
1. **Why was it made?** — the decision's rationale.
2. **Who approved it?** — owner + approvers (from `approvals`).
3. **What evidence existed?** — rationale, context, approval rationales.
4. **What happened afterward?** — linked `outcomes` (status + actual).
5. **What did we learn?** — linked `learnings`.
6. **Would we decide this again?** — derived from the latest outcome:
   succeeded → `yes`; partial → `yes_with_changes`; failed/reversed → `no`;
   none yet → `too_early`.

## The memory graph (ontology)
```
Person ──owns──▶ Decision ──has──▶ Outcome ──yields──▶ Learning
                    │                  │                   │
                 Approval          Capability / Project    └─ links back to Capability/Project/Person
```
Tables added this sprint: `outcomes` (0005), `learnings` (0005), `approvals` (0003).
A decision without an outcome is explicitly flagged "unmeasured."

## Lineage
`decisionMemory().lineage` returns the human-readable chain
`Decision → Outcome (status) → Learning`. Verified live on the ledger-first decision.

## Governance intelligence
`governanceSignals(approvals)` computes pending/approved/declined counts, the
busiest approver tier, and **ownership concentration** (share decided by the single
busiest tier) — the seed of governance bottleneck detection.

## Why this is a moat
UI is copyable; an organization's accumulated, explained, outcome-linked decision
history is not. Six months later DIZRUPT can still say *why* a call was made, *who*
made it, *what happened*, and *whether to repeat it* — knowledge that normally walks
out the door with the people who held it.

## Tests
`src/lib/__tests__/decision-intelligence.test.ts` (memory section) — why/what/learned,
repeat recommendation derivation, too-early case, governance concentration.

## Next
- Evidence lineage over `causal_signals`.
- GraphRAG retrieval across the memory graph (embeddings table exists).
- Memory surface UI (API ready).
