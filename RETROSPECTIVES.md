# DIZRUPT — Retrospectives & Outcome Architecture

> The platform grades its own judgment. Engines:
> `outcome-intelligence.ts`, `retrospective()` in `decision-intelligence.ts`.

## Outcome Intelligence (`analyzeOutcome`)
Scores the OUTCOME object: successScore (succeeded 1 / partial .5 / failed 0),
variance, quality (measured + confident), strategicImpact. `outcomeQualitySummary`
rolls up average success + failing count across all measured outcomes.

## Decision Retrospective (`retrospective`)
For each decision: successScore, **confidenceAccuracy** = `1 − |stated confidence −
actual success|` (was our confidence calibrated?), evidenceQuality, and **hindsight**:
`validated` / `mixed` / `misjudged` / `too_early`, each with an explanation
("succeeded; high confidence was well-calibrated" vs "failed despite high confidence —
a calibration miss").

## Why it matters
This is how DIZRUPT learns: it doesn't just store decisions, it measures whether its
confidence was warranted and feeds misjudged decisions into the recommendation engine.

Verified: 137 tests incl. validated/misjudged/too-early; live decision-memory exposes it.
