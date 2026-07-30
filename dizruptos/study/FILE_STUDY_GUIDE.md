# DizruptOS File Study Guide

This document identifies the critical files that must be deeply understood to master this repository. 
Do not skim these files. Study them line by line.

## Critical Foundation Files

### 1. `src/middleware.ts`
* **Why it exists:** Edge guard for all incoming requests. Handles CORS, CSRF, Session, Rate Limiting.
* **Difficulty:** High
* **Prerequisites:** Next.js Edge Runtime, HTTP Security
* **Recommended Focus:** Trace the path of an unauthenticated vs authenticated request. How does `dz_session` get evaluated?

### 2. `src/lib/rbac.ts` & `src/lib/personas.ts`
* **Why it exists:** The absolute source of truth for Role-Based Access Control.
* **Difficulty:** Medium
* **Prerequisites:** TypeScript Types
* **Recommended Focus:** Understand the permission matrix. Why are these files shared between client and server? 

### 3. `src/lib/store.ts` (useOps)
* **Why it exists:** Manages the entire operational state of the organization.
* **Difficulty:** High
* **Prerequisites:** Zustand, React Hooks, Concurrency Concepts
* **Recommended Focus:** The `applyDelta` function. Why is it built this way? How does the `audit` array work?

### 4. `src/server/repositories/index.ts`
* **Why it exists:** The gateway for all data access, switching seamlessly between memory and Supabase.
* **Difficulty:** High
* **Prerequisites:** Repository Pattern, TypeScript Interfaces
* **Recommended Focus:** How does it determine which backend to use? What is the contract in `types.ts`?

## Important Operational Files

### 5. `src/server/api.ts`
* **Why it exists:** Provides the `guarded()` wrapper for all API routes.
* **Difficulty:** Medium
* **Prerequisites:** Next.js API Routes, NextRequest
* **Recommended Focus:** How does it enforce `requirePermission()`? How are errors trapped and formatted?

### 6. `src/lib/realtime.ts`
* **Why it exists:** Synchronizes state across browser tabs in demo mode.
* **Difficulty:** Advanced
* **Prerequisites:** BroadcastChannel API
* **Recommended Focus:** How does it avoid infinite loops when tabs broadcast state changes to each other?

### 7. `e2e/desktop.mjs`
* **Why it exists:** The Playwright smoke test suite.
* **Difficulty:** High
* **Prerequisites:** Playwright, Node.js
* **Recommended Focus:** How are personas seeded into the browser context? Why is this written in raw JS instead of `@playwright/test`?

## Deep Intelligence Files

### 8. `src/server/engine/copilot.ts`
* **Why it exists:** Translates natural language into actionable system commands.
* **Difficulty:** High
* **Prerequisites:** LLM Prompting, Parsing
* **Recommended Focus:** How does the prompt constrain the LLM to output valid JSON commands?

### 9. `src/server/engine/simulation.ts`
* **Why it exists:** The what-if scenario engine for capacity planning.
* **Difficulty:** Advanced
* **Prerequisites:** Graph Algorithms, Deep Copying State
* **Recommended Focus:** How does it fork the state without corrupting `useOps`?

---
*Mark off each file as you master it.*
