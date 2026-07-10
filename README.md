# DizruptOS

**An enterprise-grade workforce management platform delivered as a full in-browser Desktop Operating System.**

Instead of a traditional dashboard, DizruptOS gives managers and executives a macOS-style desktop environment — complete with draggable windows, a Dock, Mission Control, Spotlight search, and real-time data that updates across every open app simultaneously.

---

## The Problem It Solves

Managers lack real-time visibility into employee workloads. Top performers get burned out. Under-utilised employees go unnoticed. Tasks pile up on the wrong people.

DizruptOS fixes this with:
- A **live capacity heatmap** showing every employee's workload week-by-week
- **Drag-and-drop task reassignment** from overloaded employees to available ones
- An **AI Copilot** that recommends exactly who should take which task based on skills and availability
- **Executive dashboards** with org health, risk scoring, and strategic recommendations
- **Role-based access control** — employees, managers, and executives each see only what they need

---

## Quick Start

```bash
cd dizruptos
npm install
npm run dev        # http://localhost:3000
npm test           # 329 unit tests
npm run e2e        # 16 Playwright browser tests
```

Demo runs fully on in-memory seed data — no database config needed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| State | Zustand (global cross-window state) |
| Styling | Tailwind CSS, Framer Motion, Radix UI |
| Backend | Supabase (PostgreSQL + Edge Functions + Realtime) |
| Drag & Drop | `@hello-pangea/dnd` |
| Testing | Vitest (329 unit tests) + Playwright (16 E2E tests) |

---

## Project Structure

```
dizruptos/          ← Next.js application
├── src/
│   ├── app/        ← Routes (every route = a desktop window)
│   ├── components/ ← Desktop OS shell, apps, UI primitives
│   ├── lib/        ← State, data, RBAC, session logic
│   └── server/     ← AI engines, repositories, services
├── supabase/       ← PostgreSQL schema migrations (20 migrations)
└── e2e/            ← Playwright browser tests
```

---

## Deployment (Vercel)

1. Import repo into [vercel.com](https://vercel.com)
2. Set **Root Directory** → `dizruptos`
3. Add environment variables (see `dizruptos/.env.local.example`)
4. Deploy — CI/CD is automatic on every push to `main`

---

## Architecture

- **3-layer RBAC** — UI hiding + OS surface filtering + database-level mutation denial with audit logging
- **Atomic capacity math** — `utilization = Σ estimated hours ÷ weekly capacity` — updates are deltas, never overwrites
- **Crash isolation** — each desktop app wrapped in an `<ErrorBoundary>` so one crash never takes down the OS
- **Guardrail modal** — dropping a task onto someone at ≥100% capacity requires a typed override reason, written to the audit log

---

*Built during an AI-assisted engineering internship as a demonstration of enterprise-grade full-stack development.*
