# DIZRUPT — Learning Intelligence

> Engine: `server/engine/learning-intelligence.ts`.

## What it computes (`analyzeLearnings`)
- **reusable** learnings — those from `validated` decisions (proven knowledge).
- **repeatedMistakes / repeatedSuccesses** — learnings grouped by theme (capability),
  surfacing patterns the org keeps hitting.
- **capabilityLessons** — lessons indexed by capability for retrieval.

## The chain (first-class)
`Decision → Outcome → Learning` is persisted (migrations 0003/0005) and tenant-scoped.
Learning Intelligence aggregates the Learning layer into reusable organizational knowledge.

## Future
- Evidence intelligence (which evidence sources predict good decisions) — needs decision
  history volume to be meaningful; architecture ready (causal_signals + outcomes).
- GraphRAG retrieval over learnings (`entity_embeddings`).
