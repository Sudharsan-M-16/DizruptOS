# DIZRUPT Knowledge Map

This document outlines every critical concept, subsystem, and pattern required to achieve founder-level mastery of the DizruptOS platform.

## 1. System Architecture & Foundation
| Topic | Purpose | Difficulty | Prerequisites | Dependencies | Est. Time | Rep. Importance | Relevant Files |
|-------|---------|------------|---------------|--------------|-----------|-----------------|----------------|
| **In-Browser OS Desktop** | Simulates a native macOS-like desktop environment using React and Framer Motion. | High | React, DOM | Framer Motion, Zustand | 6 hours | Critical | `components/desktop/*`, `os.ts` |
| **Three-Layer RBAC** | Ensures security across UI, State, and API via robust permission matrix. | High | Next.js API, Zustand | `session.ts`, Middleware | 8 hours | Critical | `rbac.ts`, `personas.ts`, `middleware.ts` |
| **Dual Backend Pattern** | Seamlessly swap between in-memory demo mode and Supabase production mode. | Medium | Repository Pattern | Next.js API | 4 hours | High | `repositories/index.ts`, `repositories/memory.ts`, `repositories/supabase.ts` |
| **Client-Side State** | Zustand usage for `useSession`, `useOS`, and `useOps`. | Medium | React Hooks | Zustand | 3 hours | High | `store.ts`, `session.ts`, `os.ts` |
| **Cross-Tab Sync** | Sync state mutations across browser tabs using `BroadcastChannel`. | Advanced | Web APIs | Zustand | 2 hours | Medium | `realtime.ts` |

## 2. Intelligence & AI Subsystems
| Topic | Purpose | Difficulty | Prerequisites | Dependencies | Est. Time | Rep. Importance | Relevant Files |
|-------|---------|------------|---------------|--------------|-----------|-----------------|----------------|
| **AI Copilot (Gemini)** | LLM integration for contextual intelligence and commands. | High | LLMs, Prompts | Gemini API | 5 hours | High | `engine/copilot.ts`, `engine/copilot-llm.ts` |
| **Risk & People Intelligence** | Heuristic and AI-driven risk calculation for employees. | High | Math, Data processing | `useOps` State | 6 hours | High | `engine/risk-intelligence.ts`, `engine/people-intelligence.ts` |
| **Simulation Engine** | What-if scenario modeling for capacity planning. | Advanced | Algorithms | `useOps` State | 8 hours | High | `engine/simulation.ts` |
| **Org Health Scoring** | Mathematical computation of overall organization health. | Medium | Math | Data Models | 3 hours | Medium | `engine/org-health.ts` |

## 3. Database & Data Layer
| Topic | Purpose | Difficulty | Prerequisites | Dependencies | Est. Time | Rep. Importance | Relevant Files |
|-------|---------|------------|---------------|--------------|-----------|-----------------|----------------|
| **Atomic Capacity Math** | Safe delta-based allocation of hours to prevent race conditions. | Advanced | Math, DB Tx | Postgres | 4 hours | Critical | `store.ts` |
| **Supabase Migrations** | Sequential SQL schema setup and RLS policies. | High | Postgres, SQL | Supabase | 6 hours | Critical | `supabase/migrations/*` |
| **Supabase Realtime** | Production cross-tab sync via WebSocket. | High | Supabase | Postgres | 4 hours | High | `realtime-supabase.ts` |

## 4. API & Middleware
| Topic | Purpose | Difficulty | Prerequisites | Dependencies | Est. Time | Rep. Importance | Relevant Files |
|-------|---------|------------|---------------|--------------|-----------|-----------------|----------------|
| **Next.js Edge Middleware** | Rate limiting, CORS, CSRF, Session Gating. | High | HTTP, Edge | Next.js | 5 hours | Critical | `middleware.ts` |
| **Guarded API Pattern** | Consistent API handler wrapping for AuthZ and error handling. | Medium | Next.js API | `rbac.ts` | 3 hours | High | `server/api.ts` |
| **Data Ingestion** | Robust bulk HRIS data ingestion. | High | Data Validation | Zod | 6 hours | High | `api/v1/ingest/*` |

## 5. UI, UX & Data Visualization
| Topic | Purpose | Difficulty | Prerequisites | Dependencies | Est. Time | Rep. Importance | Relevant Files |
|-------|---------|------------|---------------|--------------|-----------|-----------------|----------------|
| **Drag and Drop Engine** | Moving tasks/employees efficiently. | Medium | React | `@hello-pangea/dnd` | 4 hours | High | `components/desktop/apps/*` |
| **Visual Analytics** | Rendering capacity and financials via charts. | Medium | React | Recharts | 3 hours | Medium | `components/ui/charts/*` |
| **Node Graph Vis** | Interactive intelligence graph visualization. | High | React | `@xyflow/react` | 5 hours | Medium | `components/desktop/apps/Intelligence.tsx` |

## 6. Testing & CI/CD
| Topic | Purpose | Difficulty | Prerequisites | Dependencies | Est. Time | Rep. Importance | Relevant Files |
|-------|---------|------------|---------------|--------------|-----------|-----------------|----------------|
| **Playwright E2E** | Full browser automation using direct cookie seeding. | High | Testing | Playwright | 6 hours | Critical | `e2e/desktop.mjs` |
| **Vitest Unit** | Fast, local logic verification. | Medium | Testing | Vitest | 3 hours | High | `vitest.config.ts`, `src/**/*.test.ts` |
| **GitHub Actions Pipeline** | Complete CI validation matrix before merge. | Medium | CI/CD | GitHub Actions | 3 hours | High | `.github/workflows/ci.yml` |
