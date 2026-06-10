# DIZRUPT — Resource Intelligence Platform

A dark, premium enterprise command center for workforce capacity, project
execution, organizational memory, and AI-agent collaboration. Built from
`DIZRUPT_Supreme_PRD_v3.md` and the DizruptOS UI inspiration brief.

## Run

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build (all routes verified)
npm test          # vitest — 22 tests pinning the product laws
```

> Continuation manual: see [`../MASTER_EXECUTION_PLAN.md`](../MASTER_EXECUTION_PLAN.md)
> — full architecture, catalogs, debt register, and version-by-version roadmap.

## Stack

Next.js 14 App Router · TypeScript · Tailwind CSS · Radix primitives ·
Framer Motion · TanStack Table · cmdk · @xyflow/react · Recharts · Zustand.
Typography: IBM Plex Sans / IBM Plex Mono (tabular data) + Sora display.

## Surfaces

| Route | What it does |
|---|---|
| `/` | Command Center — over-allocation rate, capacity hotlist, agent inbox preview, portfolio health, live audit feed |
| `/capacity` | **The wedge.** Employees × 6-week heatmap. Drag task chips from red rows to green — optimistic update, ≥100% trips the hard-stop override modal, every move lands in the audit log |
| `/projects` · `/projects/[id]` | Portfolio cards → detail with "why this status" causal-signal panel, drag-between-column Kanban, linked risks & decisions |
| `/people` · `/people/[id]` | TanStack dense directory (skill search, load-sorted) → profile with capacity ring, expertise depth, manager-private burnout panel |
| `/executive` | Revenue-at-risk, strategy drift, OHI, burnout rate — every tile explains itself; drift-vs-OHI chart; AI morning brief with source links |
| `/proposals` | Agent Negotiation Inbox — priority hierarchy, coordinated-compromise cards, causal reasoning + pre-surface validation, 2-click approve/reject with 30-day rejection memory |
| `/risks` | Probability × impact severity matrix (auto-computed) + signal-carrying register |
| `/decisions` | Decision timeline — rationale, options weighed, expected vs actual outcome calibration |
| `/goals` | OKR scorecard with project traceability |
| `/graph` | React Flow organizational graph with canonical typed edges (`funds`, `threatened_by`, `causes`…) |
| `/audit` | Insert-only audit table — live-updates from your own actions, override reasons surfaced |

## Doctrine encoded in code

- **Never a score without a why** — `Explain` popover wraps every metric, health badge, and burnout flag with stored causal signals.
- **Two-Click Rule** — reallocate from heatmap drag or task-drawer shortlist; approve/reject proposals from one card.
- **Invisible guardrails** — capacity drops projecting ≥100% open a typed-override modal; the reason is written to the audit log (`store.ts`).
- **Atomic capacity math** — `utilization = Σ estimated hours due in week ÷ weekly capacity`; mutations are deltas, never overwrites.
- **Agents propose, humans decide** — approvals execute through the same reallocation path as manual drags; rejections write agent memory.

## Where the backend goes

`src/lib/data.ts` is a typed seed of the PRD's schema (§12). Swap it for
Supabase reads and replace the Zustand mutations in `src/lib/store.ts` with
the PRD's RPCs (`/tasks/reallocate` with advisory lock, dept-scoped Realtime
channels) — the optimistic-update / rollback shape is already in place.
