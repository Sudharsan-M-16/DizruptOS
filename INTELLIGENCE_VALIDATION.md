# DIZRUPT — Intelligence Validation & Calibration

> How DIZRUPT will know whether its intelligence is TRUE — and the copilot that
> makes it consumable. Engines: `calibration.ts`, `copilot.ts`.

## Executive Copilot (built + verified live)
A deterministic, graph-grounded advisor (`/api/v1/copilot?q=`). Maps a question to the
right engine and answers from live computed data with an evidence trail and a `source`
(no LLM, no hallucination). Verified live answering:
- "what should I do next" → top recommendation `[recommendations]`
- "most fragile capability" → Finance & Modeling, bus factor 1 `[capability-intelligence]`
- "what if Noor leaves" → lost capabilities + mitigation `[simulation.simulateDeparture]`
- "who is irreplaceable" → sole-holder `[people-intelligence]`
Future: an LLM can *phrase* these; the substance must always come from the engines.

## Calibration engine (built + tested)
`scorePrediction` / `calibrationReport`: given predictions (a claim + confidence) and the
later observed outcome → accuracy, **calibration gap** (overconfidence detector), per-kind
breakdown, and an improving/declining trend vs a prior period. Answers "are we getting
smarter?". Verified by unit tests (accuracy math, calibration gap, trend detection).

## The validation loop — what's real vs pending
- ✅ The scoring math (does predicted match actual?) is built + tested.
- ⬜ **The write-back** (storing a prediction when a recommendation is acted on, then
  recording the real outcome later) needs the recommendation-action UI + a `predictions`
  table — NOT built. Until then, calibration scores whatever pairs it's handed; it cannot
  yet auto-accumulate from usage.
- This is the honest gap between "can compute calibration" and "is self-improving": the
  latter needs real usage over real time on a real org — which no amount of code manufactures.

## GraphRAG (foundations only — blocked on external key)
`entity_embeddings vector(1536)` exists; the memory graph (decisions→outcomes→learnings,
relationships, causal_signals) is the ideal retrieval substrate. **Real embeddings require
an embeddings API key (OpenAI/Anthropic) — an external dependency I can't provide.** The
copilot today does deterministic intent→engine routing (which is arguably better grounded
than vector RAG for these structured questions); semantic GraphRAG is the additive next step
once a key exists.

## Honest verdict
DIZRUPT can now *advise* (copilot, verified) and *score its own accuracy* (calibration,
tested). It is not yet *self-improving* — that requires the prediction write-back loop +
real longitudinal customer usage. The engineering foundation for the learning system is in
place; the learning itself needs a customer and time.
