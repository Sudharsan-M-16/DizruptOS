# DizruptOS — Comprehensive Project Retrospective & System Architecture Manual

---

## 1. Executive Summary

**DizruptOS** is a full-stack, enterprise-grade project, capacity, and employee intelligence platform delivered as a **web-based operating system (Web OS)**. 

Instead of a traditional, flat dashboard interface, DizruptOS simulates a complete macOS-style desktop inside the browser. Users log in to a multi-stage OS boot sequence, interact with draggable and resizable windows, launch native applications from a dynamic Dock, access Spotlight search (`⌘ + Space`), switch context via Mission Control (`F3`), and manage real-time organizational workloads.

DizruptOS solves the fundamental problem of **unseen workforce burnout and misallocated capacity** by unifying task management, capacity planning, organizational memory, and security guardrails into a single operating environment.

---

## 2. Core Problem & Product Philosophy

### The Problem It Solves
Modern organizations typically rely on disconnected software tools:
1. **Task Managers (Jira, Linear):** Track *what* needs to be done.
2. **HR Systems (Workday, BambooHR):** Track *who* works at the company.
3. **Spreadsheets:** Hack together manual, outdated views of team capacity.

Because these tools operate in silos, managers frequently assign critical tasks to team members who are already severely overallocated across multiple projects. This leads to **unannounced project delays, employee burnout, quality degradation, and unexpected resignations**.

### The Core Philosophy
DizruptOS is built around three fundamental tenets:
* **Predictive Capacity Mapping ("See the break before the break"):** Overload must be flagged visually *weeks before* it results in a missed deadline or resignation.
* **Causal Signals ("Never a score without a why"):** Metrics (burnout indicators, project health scores, execution risks) must expose their underlying data signals when clicked, rather than acting as opaque black boxes.
* **Atomic Capacity Guardrails:** Employee capacity calculations are calculated mathematically (`utilized hours ÷ weekly limit`). If a manager attempts to push an employee past 100% capacity via drag-and-drop, the system triggers a hard-stop override modal requiring a typed, audit-logged justification.

---

## 3. Web OS Desktop Architecture

DizruptOS relies on a custom-built desktop windowing engine powered by Zustand state stores (`src/lib/os.ts` and `components/desktop/use-desktop.ts`).

### Key Desktop Infrastructure Components
1. **OS Boot & Lock Experience:**
   * Simulates an authentic OS boot sequence (`booting -> lock screen -> desktop`).
   * Supports instant persona switching for testing (`Admin`, `Manager`, `Executive`, `Employee`) as well as real passwordless Supabase email/SSO login.
2. **Window Management Engine:**
   * **8-Way Resizing & Dragging:** Windows can be dragged across the viewport and resized from any corner or edge.
   * **Window Snapping:** Supports half-screen snap tiling and full-screen maximization.
   * **Genie Minimize Effect:** Minimizes active windows smoothly into their corresponding app icon on the Dock.
   * **Focus & Z-Ordering:** Clicking any window automatically elevates its z-index focus layer.
   * **Per-User State Persistence:** Desktop layout and window coordinates persist across sessions.
3. **Magnifying Interactive Dock:**
   * Dynamic bottom dock with magnification on hover, running indicator dots under open apps, and launch-bounce animations.
4. **Menubar & System Tray:**
   * Pinned top menubar containing the OS menu, active app name, battery level indicator, online/offline network status, and calendar popover.
   * **Control Center:** Quick-toggle panel for dark/light themes, accent color customization, wallpaper selection, and brightness simulation.
   * **Notification Center:** Grouped notification drawer collecting system alerts, task updates, and security logs.
5. **Global System Shortcuts:**
   * **Spotlight Search (`⌘ + Space`):** Instant search overlay querying tasks, employees, projects, risks, and app settings.
   * **Mission Control (`F3`):** Dynamically tiles all open desktop windows across the screen for quick app switching.
   * **Launchpad (`F4`):** Full-screen grid view showing all installed applications.

---

## 4. Native Applications & Detailed Feature Catalog

DizruptOS includes a suite of integrated enterprise applications:

### 1. Home / Command Center (`/`)
* **Purpose:** Central daily operations dashboard for the signed-in user.
* **Features:**
  * Categorizes daily work into **Today**, **Pending**, and **Critical** items organized by project.
  * Shows portfolio-level health metrics, recent audit feeds, and capacity hotlists.

### 2. Capacity Heatmap (`/capacity`) — The Core Engine
* **Purpose:** 6-to-8 week rolling capacity and workload management tool.
* **Features:**
  * Color-coded load bars: **Green** (<85% load), **Amber** (85–99% load), **Red** (≥100% overload).
  * **Drag-and-Drop Reallocation:** Drag task chips directly from overloaded employees to available employees.
  * **Optimistic UI:** Instant visual feedback while state mutations process in the background.
  * **Overallocation Guardrail Modal:** Automatically intercepts any drag operation that pushes an employee past 100% utilization, requiring an audit-logged reason before proceeding.

### 3. Project Matrix & Kanban (`/projects` & `/projects/[id]`)
* **Purpose:** Multi-project tracking and task execution.
* **Features:**
  * Drag-and-drop Kanban workflow columns (Backlog, In Progress, In Review, Done).
  * Deep-dive project drawers revealing linked risks, assigned team members, and causal-signal diagnostic panels explaining project health status.

### 4. Operative Directory (`/people` & `/people/[id]`)
* **Purpose:** Organization-wide employee and talent directory.
* **Features:**
  * Dense data table built with TanStack Table featuring skill searching, load-level sorting, and department filtering.
  * Detailed profiles showing capacity rings, expertise depth, and manager-private burnout risk flags.

### 5. Executive View (`/executive`)
* **Purpose:** High-level strategic intelligence for leadership.
* **Features:**
  * Tracks Revenue-at-Risk, Strategy Drift, and Organizational Health Index (OHI).
  * Interactive Drift vs. OHI comparative analytics.

### 6. Risk Register (`/risks`)
* **Purpose:** Auto-calculating risk management hub.
* **Features:**
  * Auto-computes Probability × Impact severity matrix.
  * Tracks risk owners, mitigation plans, and connected projects.

### 7. Decision Ledger (`/decisions`)
* **Purpose:** Institutional memory bank.
* **Features:**
  * Immutable ledger recording strategic decisions, options considered, decision makers, and expected vs. actual outcomes to preserve organizational context across reorgs.

### 8. Audit Log (`/audit`)
* **Purpose:** System-wide compliance and activity tracking.
* **Features:**
  * Insert-only ledger displaying all capacity overrides, task reallocations, and permission changes with timestamps and user references.

### 9. Learning Loop & Capabilities (`/learning`, `/capabilities`)
* **Purpose:** Organizational skill tracking and retrospectives.
* **Features:**
  * Tracks skills distribution across departments and logs past sprint execution accuracy.

### 10. Public Landing Page (`/welcome`)
* **Purpose:** Marketing and product presentation page for unauthenticated visitors.
* **Features:**
  * Poster-style design, Three.js GPU-accelerated chroma background field, GSAP scroll-triggered animations, interactive OS preview iframe, and testimonial sliders.

---

## 5. Technical Architecture & Data Flow

### Technology Stack
* **Frontend Framework:** Next.js 14 (App Router) with TypeScript.
* **Styling & Components:** Tailwind CSS, Radix UI Primitives, Lucide Icons, Class Variance Authority.
* **Animation & Graphics:** Framer Motion, GSAP (ScrollTrigger), Three.js (WebGL shaders), @xyflow/react, Recharts.
* **State Management:**
  * **Zustand (`src/lib/os.ts`, `src/lib/store.ts`):** Client-side state, OS windowing engine, optimistic capacity mutations.
  * **TanStack Query (`src/lib/query.ts`):** Async data fetching, server state synchronization, and background revalidation.
* **Testing:** Vitest (329 automated unit and integration tests passing cleanly).

### System Data Flow Modes
1. **Demo Mode (Default):**
   * Operates completely in-memory using pre-seeded data (`src/lib/data.ts`) and a demo cookie (`dz_session`).
   * Allows zero-friction evaluation without requiring database setup.
2. **Production Mode (Supabase Integration):**
   * Setting `NEXT_PUBLIC_SUPABASE_URL` and keys seamlessly switches authentication to Supabase Auth and database operations to PostgreSQL RPCs.

---

## 6. Security, RBAC & Middleware Architecture

DizruptOS implements a 3-tier security model:
1. **Edge Middleware (`src/middleware.ts`):**
   * Intercepts all incoming requests.
   * Redirects unauthenticated visitors from protected routes (`/`, `/capacity`, etc.) to `/welcome` (or `/login`).
   * Strips spoofed identity headers and applies strict OWASP security headers (CSP, HSTS, X-Frame-Options).
2. **Role-Based Access Control (RBAC - `src/lib/rbac.ts`):**
   * Enforces 4 permission tiers (`Admin`, `Manager`, `Executive`, `Employee`).
   * Hides or disables unauthorized actions, app launches, and mutation buttons based on role.
3. **Database Layer (Supabase RLS):**
   * Row-Level Security policies on PostgreSQL tables ensure multi-tenant data isolation.

---

## 7. Deployment & CI/CD Pipeline

* **Vercel Deployment:** Pre-configured via `vercel.json` with rewrites, redirects, headers, and daily cron schedule (`0 0 * * *`) for Hobby tier compliance.
* **Docker Support:** Multi-stage, non-root `Dockerfile` using Node 20 Alpine, optimized for standalone Next.js builds.
* **Continuous Integration:** Fully passing GitHub Actions workflow executing:
  * TypeScript type-checking (`tsc --noEmit`) — **0 Errors**.
  * ESLint validation (`next lint`) — **0 Warnings**.
  * Full test suite execution (`vitest run --coverage`) — **329 Tests Passing**.

---

## 8. Architectural Summary & Scaling Roadmap

DizruptOS represents a state-of-the-art frontend and application architecture. For enterprise scaling to tens of thousands of users:
* **Async Event Queues:** Heavy multi-project simulations can be moved from synchronous serverless routes to asynchronous background queues (Temporal/Inngest).
* **Canvas Rendering:** Large-scale organizational graph rendering can be upgraded to WebGL/Canvas to ensure smooth 60 FPS performance at 50,000+ nodes.

---
*Document auto-generated as a complete retrospective guide for the deployed main branch of DizruptOS.*
