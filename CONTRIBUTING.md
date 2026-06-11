# Contributing to DIZRUPT

Read `MASTER_EXECUTION_PLAN.md` first — it is the operating manual and assumes
no prior context. This file covers only the mechanics of making a change.

## Setup

```bash
cd dizruptos
npm install
npm run dev        # demo mode — no env vars needed; full UI on seed data
```

Copy `.env.example` → `.env.local` only when wiring real services. With no env
vars the app runs in **demo mode** by design — that is the supported dev loop.

## Before every commit (CI enforces the same four gates)

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Working agreements (non-negotiable)

1. **The tests encode product law.** If a test fails, your change is wrong
   until you can cite the PRD section that changed the law. Never "fix" a
   threshold in `src/lib/risk.ts` or `src/lib/utils.ts` to make a test pass.
2. **No naked scores.** Any new metric on screen gets an `Explain` popover
   with real causal signals.
3. **No raw hex for neutrals.** Use token classes (`bg-ink-*`, `text-fg-*`,
   `border-line-*`); chart inline styles use `rgb(var(--token))`. Both themes
   must work — toggle before you ship.
4. **No loose ID arrays for entity links.** Add typed edges to the registry in
   `src/lib/graph.ts` (closed set — extending the union = schema migration).
5. **Every mutation writes an audit event** in the same change, via the store
   today and the DB trigger in production.
6. **AI actions validate before executing.** Anything that applies an agent
   action goes through `validateProposal` at decision time.
7. **Secrets never reach the client.** Server-only env vars have no
   `NEXT_PUBLIC_` prefix and are read only in API routes/workers.

## Where things live

| Concern | Path |
|---|---|
| Domain types (the contract) | `dizruptos/src/lib/types.ts` |
| Seed organization | `dizruptos/src/lib/data.ts` |
| Ops mutations + realtime sync | `dizruptos/src/lib/store.ts` |
| RBAC + theme + viewer session | `dizruptos/src/lib/session.ts` |
| Graph registry + traversal | `dizruptos/src/lib/graph.ts` |
| AI validation/compression/ranking | `dizruptos/src/lib/ai.ts` |
| Realtime transport (swap point) | `dizruptos/src/lib/realtime.ts` |
| Database schema (executable) | `dizruptos/supabase/migrations/` |
| Edge auth + security headers | `dizruptos/src/middleware.ts` |
| Tests | `dizruptos/src/lib/__tests__/` |

## Commit style

Imperative subject, body explains *why*, cite PRD sections when implementing
spec ("Implements §24 negotiation staging"). One logical change per commit.
