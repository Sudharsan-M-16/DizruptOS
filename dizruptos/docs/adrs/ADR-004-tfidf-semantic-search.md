# ADR-004: TF-IDF In-Process Semantic Search (No Vector DB)

**Status:** Accepted  
**Date:** 2026-06-16  
**Deciders:** Engineering team

## Context

The AI Copilot needed to retrieve relevant context from org data before constructing an LLM prompt. The choices were:
1. pgvector embeddings (requires OpenAI/Anthropic embeddings API + DB storage)
2. TF-IDF in-process (pure math, no external dependencies)
3. Elasticsearch / OpenSearch (operational overhead)

## Decision

Use **TF-IDF with cosine similarity**, implemented entirely in Node.js process memory (`server/services/embeddings.ts`). Documents (employees, projects, tasks, risks, decisions, capabilities) are indexed at startup. Top-K results by cosine similarity are injected into the LLM context as "SEMANTIC CONTEXT".

## Consequences

**Positive:**
- No vector DB needed — reduces cost and operational complexity for the demo tier
- Sub-millisecond search on the 18-person seed (the index fits in RAM)
- Deterministic — same query always returns same results (easier to test)

**Negative:**
- Does not understand synonyms or semantic similarity (e.g. "fired" ≠ "terminated")
- TF-IDF index is rebuilt on every cold start (~20ms for 18 people, ~500ms for 10K people)
- For orgs > 1,000 people, this should be replaced with pgvector + Supabase vector search

## Upgrade Path

When org size exceeds 1,000 employees:
1. Install `pgvector` extension (already in migration 0001)
2. Call Claude Embeddings API to vectorize each entity on upsert
3. Store in `entity_embeddings` table (already in schema)
4. Replace `server/services/embeddings.ts` with a pgvector ANN query

## Related

- `src/server/services/embeddings.ts`
- `src/server/engine/copilot-llm.ts`
- `src/app/api/v1/search/route.ts`
- Migration `0001_core_schema.sql` — `entity_embeddings` table
