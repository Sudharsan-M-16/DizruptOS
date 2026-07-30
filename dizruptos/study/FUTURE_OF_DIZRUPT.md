# Future of DizruptOS

*From the desk of the Chief Architect.*

This document outlines the strategic technical debt, missing capabilities, and future architectural improvements required to scale DizruptOS.

## 1. Technical Debt & Immediate Fixes

### In-Memory Rate Limiting (Edge Isolate Flaw)
* **Current State:** `middleware.ts` uses an in-memory Map for rate limiting. This resets on Vercel cold starts and isn't shared across edge isolates.
* **Recommendation:** Migrate to Upstash Redis for distributed, persistent rate limiting.
* **Rank:** Engineering: High | Business: Med | Difficulty: Low

### E2E Testing Framework
* **Current State:** `e2e/desktop.mjs` is a raw Node/Playwright script.
* **Recommendation:** Migrate to `@playwright/test` test runner for built-in retries, parallelization, and better reporting.
* **Rank:** Engineering: High | Business: Low | Difficulty: Med

## 2. Architecture & Scalability

### React Server Components (RSC) vs Client Heavy State
* **Current State:** The OS heavily relies on Zustand (`useOps`, `useOS`), meaning a lot of state is shipped to the client.
* **Recommendation:** Move to a thinner client. Stream initial state via RSC and use Server Actions for mutations, keeping Zustand only for ephemeral UI state (window positions, focus).
* **Rank:** Engineering: High | Business: Med | Difficulty: High

### Multi-Tenant Database Isolation
* **Current State:** Supabase tables use a `tenant_id` column with RLS.
* **Recommendation:** Evaluate physical schema separation per enterprise client if data residency requirements tighten.
* **Rank:** Engineering: Med | Business: High | Difficulty: High

## 3. AI & Intelligence Improvements

### Local LLM Fallback (WebGPU)
* **Current State:** Relies on Gemini API.
* **Recommendation:** Integrate `WebLLM` to run smaller models (like Llama 3 8B) directly in the browser via WebGPU for offline/private copilot capabilities.
* **Rank:** Engineering: High | Business: High | Difficulty: High

### Advanced Simulation (Monte Carlo)
* **Current State:** Basic deterministic what-if branches.
* **Recommendation:** Implement Monte Carlo simulations for project capacity forecasting to give probabilistic confidence intervals for delivery dates.
* **Rank:** Engineering: High | Business: High | Difficulty: Advanced

## 4. Developer Experience (DX)

### Hot Module Replacement (HMR) for OS State
* **Current State:** Modifying `store.ts` often requires a hard refresh to re-seed demo data.
* **Recommendation:** Implement a robust state rehydration mechanism during HMR to keep windows open and data intact across code changes.
* **Rank:** Engineering: Med | Business: Low | Difficulty: Med
