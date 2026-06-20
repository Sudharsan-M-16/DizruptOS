# ADR-001: Schema-Authoritative Domain Model (Option A)

**Status:** Accepted  
**Date:** 2026-06-01  
**Deciders:** Engineering team

## Context

We needed to choose between (A) a Postgres-schema-first model where DB migrations are the source of truth, or (B) a TypeScript-first model where types drive migrations.

## Decision

We chose **Option A — schema-authoritative**. The Postgres schema in `supabase/migrations/` is the canonical source of truth. Application types are thin camelCase views over the DB columns. No parallel domain model exists in TypeScript.

## Consequences

**Positive:**
- RLS policies, indexes, and constraints live in one place (Postgres), not scattered across app code
- `makeResilient()` proxy can swap live DB for in-memory seed transparently
- API routes stay thin — business logic lives in SQL functions (RPCs) or repository layer

**Negative:**
- Schema changes require a migration file + manual seed update
- TypeScript types in `lib/types.ts` must be kept in sync manually (no codegen yet)

## Alternatives Considered

- Prisma (rejected: adds complexity, doesn't support pgvector + Supabase Auth patterns cleanly)
- Drizzle ORM (rejected: premature for a seed-first product)
