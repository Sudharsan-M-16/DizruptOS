# DIZRUPT — Decision Intelligence Architecture

> How DIZRUPT scores, explains, and reasons about organizational decisions.
> Engine: `src/server/engine/decision-intelligence.ts`. Live route:
> `GET /api/v1/decisions/memory`.

## Principle
A decision is a first-class graph object, not a log line. Every computed result
follows the shared engine contract: **score + confidence + evidence + explanation** —
never a bare number.

## Inputs (`DecisionNode`)
Assembled live by `server/services/decision-loader.ts` from the `decisions` table +
its links:
- rationale, context, `confidenceLevel` (low/medium/high), status, ownerId
- `approverIds` — from linked `approvals`
- `affectedEntityCount` — degree in `entity_relationships` (blast radius proxy)
- `outcomeStatus` — latest linked `outcomes` row
- `hasEvidence` — an approval or outcome carried evidence

## Computed signals
| Signal | Definition |
|---|---|
| **evidenceQuality** (0–1) | rationale substance + context + evidence + a measured outcome |
| **confidence** (0–1) | stated confidence × evidence grounding, adjusted by the actual outcome (succeeded ↑, failed ↓) |
| **importance** (0–1) | blast-radius reach + live status + decisions superseded |
| **blastRadius** | linked entities affected |
| **influence** | decisions this one supersedes |
| **stakeholderCoverage** | distinct people involved (owner + approvers) |
| **risk** | failed/reversed → critical; low-confidence + high-importance → high; thin evidence → medium |

Key idea: **confidence is grounded by reality** — a recorded outcome moves stated
confidence toward what actually happened, so the platform stops trusting decisions
that didn't pan out.

## Live verification (seeded ledger-first decision)
`GET /api/v1/decisions/memory` → confidence `0.73`, risk `low`, evidenceQuality `0.80`,
rationale, partial outcome, learning, `repeat = yes_with_changes`, and the
Decision → Outcome → Learning lineage.

## Tests
`src/lib/__tests__/decision-intelligence.test.ts` — evidence quality, outcome-grounded
confidence, the analysis contract, failed-outcome → critical.

## Next
- Decision-to-decision lineage via `superseded_by` chains (table column exists).
- Dependency-adjusted decision impact via the `dependency` engine.
- In-app Decision surface (API ready; UI paused by request).
