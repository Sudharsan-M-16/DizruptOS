# DizruptOS Personal Learning Path

This roadmap is designed to teach you DizruptOS contextually. You will learn concepts exactly when they become necessary to understand the layer you are studying.

## Step 1: The Browser OS Illusion
**Action:** Boot the app in demo mode (`npm run dev`).
**Study:** Look at `src/components/desktop/os.tsx` and `src/lib/os.ts`.
**Goal:** Understand how Next.js is hijacked to act like a desktop. Look at Framer Motion for window dragging and the Zustand `useOS` store for boot phases.
**Check:** Can you manually set the boot phase to skip the startup animation?

## Step 2: The Security Baseline
**Action:** Try logging in as different personas.
**Study:** `src/middleware.ts`, `src/lib/personas.ts`, `src/lib/rbac.ts`.
**Goal:** Master the 3-layer RBAC. See how `middleware.ts` routes you, how `personas.ts` defines your powers, and how the UI hides buttons you can't click.
**Check:** Can you explain why E2E tests inject a cookie instead of calling `/api/auth/login`?

## Step 3: The Data Abstraction Layer
**Action:** Look at an API route like `src/app/api/v1/capacity/route.ts`.
**Study:** `src/server/repositories/index.ts`, `memory.ts`, `supabase.ts`.
**Goal:** Understand the Repository Pattern. Notice how the API route never knows if it's talking to RAM or PostgreSQL.
**Check:** Can you force the app to crash by half-configuring Supabase? (Set `NEXT_PUBLIC_SUPABASE_URL` but omit the key).

## Step 4: Atomic Math and Operations
**Action:** Move an employee's capacity in the desktop app.
**Study:** `src/lib/store.ts` (`useOps`), specifically the `applyDelta` logic.
**Goal:** Learn why we never overwrite capacity directly. Understand how deltas prevent race conditions when two managers allocate the same person simultaneously.
**Check:** What happens if an allocation pushes someone over 100%? How is the audit log updated?

## Step 5: Intelligence & Copilot
**Action:** Use the AI Copilot to "Find overloaded employees".
**Study:** `src/server/engine/copilot.ts`, `src/server/engine/risk-intelligence.ts`.
**Goal:** Understand how the backend processes context, queries Gemini, and translates intent into actionable `useOps` mutations.
**Check:** How does the Copilot know which API routes to hit?

## Step 6: Production Hardening
**Action:** Run the tests (`npm run e2e`).
**Study:** `e2e/desktop.mjs`, `supabase/migrations/`.
**Goal:** See how a complex OS is tested automatically. Study the SQL migrations to see how Row Level Security (RLS) mimics our `personas.ts` matrix at the database level.
**Check:** Can you explain why `e2e/desktop.mjs` is run *after* a production build in the CI pipeline?
