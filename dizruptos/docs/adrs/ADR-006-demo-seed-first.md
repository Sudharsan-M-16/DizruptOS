# ADR-006: Seed-First Product Development

**Status:** Accepted  
**Date:** 2026-05-10  
**Deciders:** Product + Engineering

## Context

Building org-intelligence software is a chicken-and-egg problem: the product needs real org data to demonstrate value, but no org will connect their data until they see value. We needed a way to ship a fully-functional, fully-believable product without real customers.

## Decision

Ship with a **hand-crafted seed organization** ("FinTech Ops Co") that tells a coherent, realistic story. Every entity in the seed is interconnected: Sarah's overload creates a risk that drives a proposal that changes the executive view that appears in the simulation. The product demonstrates its full intelligence loop on fake-but-believable data.

The seed is authoritative in demo mode:
- `src/lib/data.ts` — employees, projects, tasks, capacity, risks, proposals, decisions, goals
- `src/server/repositories/memory.ts` — in-memory implementation of every repository interface
- `makeResilient()` proxy falls back to this seed automatically

## Consequences

**Positive:**
- Product can be demoed without a single real customer
- Sales can demo to any audience (no PII risk)
- Development can proceed without a live database
- The seed tests the complete product story (not just unit tests)

**Negative:**
- Seed data can drift from the DB schema when schema evolves
- Must maintain both `data.ts` seed AND SQL migrations in sync
- Seed is a 18-person team — hard to test scale behavior

## Seed Maintenance Rules

1. Every new DB column that affects the product story needs a corresponding seed field
2. Every new API route must fall back gracefully to seed data via `makeResilient()`
3. The `connect.md` document is the human-readable spec of what the seed tells

## Related

- `src/lib/data.ts`
- `src/server/repositories/memory.ts`
- `src/server/repositories/index.ts` — `makeResilient()`
- `connect.md` — complete documentation of the seed organization
