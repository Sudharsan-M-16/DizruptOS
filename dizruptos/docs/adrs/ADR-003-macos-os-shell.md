# ADR-003: macOS-Style Web OS Shell

**Status:** Accepted  
**Date:** 2026-05-20  
**Deciders:** Product + Engineering

## Context

The product needed a way to show all surfaces (capacity, risks, graph, executive, people, tasks, copilot, simulation) simultaneously without requiring users to navigate between pages. Traditional SPA routing forces linear flows that destroy context.

## Decision

Build **DizruptOS** — a macOS-style web operating system shell. Every surface opens as a floating, resizable, draggable window. Legacy routes (`/goals`, `/risks`, etc.) open as chromeless iframes (`?embed=1`) inside windows. Native apps (Home, Copilot, Simulation, Matrix) are dynamically imported React components rendered directly in the window frame.

## Consequences

**Positive:**
- Users can see executive summary + dependency graph + chat simultaneously
- Window manager handles z-order, snap, genie-minimize, per-persona layout persistence
- RBAC-gated app visibility at the OS layer (apps don't appear in Dock/Launchpad for unauthorized roles)
- Every shortcut has a desktop analogue: ⌘Space=Spotlight, F3=Mission Control, F4=Launchpad

**Negative:**
- Window manager adds ~800 lines of state in `use-desktop.ts` + `lib/os.ts`
- iframe embed mode requires `frame-ancestors 'self'` CSP header and `?embed=1` detection in every route
- Keyboard shortcuts conflict with browser defaults (F3/F4 behavior varies by OS)

## Alternatives Considered

- Standard tabs/routing (rejected: forces context-switching, loses multi-window mental model)
- Sidebar drawer pattern (rejected: too small for complex surfaces like the dependency graph)
- Modal overlays (rejected: can't have multiple surfaces open simultaneously)

## Related

- `src/app/(shell)/page.tsx` — window definitions + `next/dynamic` imports
- `src/components/desktop/use-desktop.ts` — window manager
- `src/lib/os.ts` — `useOS` Zustand store
- `src/middleware.ts` — `frame-ancestors 'self'` CSP
