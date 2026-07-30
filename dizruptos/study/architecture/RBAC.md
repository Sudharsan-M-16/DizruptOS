# Three-Layer RBAC Architecture

## Why This Exists

**Business Motivation:** DizruptOS handles highly sensitive workforce data (capacity, burnout risk, compensation). An employee seeing executive financials or a client seeing internal burnout metrics would be a catastrophic breach. 
**Engineering Motivation:** UI-only hiding is easily bypassed by manipulating DOM or React state. Server-only checks lead to poor UX (buttons are visible but fail when clicked).
**Repository Motivation:** A single source of truth (`personas.ts`) was needed to ensure the UI, State, and API are always perfectly aligned on permissions.

---

## First Principles

Role-Based Access Control (RBAC) maps identities (users) to roles, and roles to permissions.
* **Identity:** *Who* is acting?
* **Role:** A grouping of responsibilities.
* **Permission:** *What* specific action is allowed?

In a distributed web application, authorization must be enforced at the boundary of trust. The client (browser) is entirely untrusted. Therefore, actual security happens on the server, while the client replicates the rules purely for UX.

---

## How DIZRUPT Uses It

DizruptOS employs a strictly enforced **Three-Layer RBAC**:

1. **UI Layer (UX):** Hides buttons and screens.
2. **State Layer (Store Enforcement):** Prevents Zustand actions from executing if the UI is hacked.
3. **API Layer (Hard Boundary):** The actual security. Rejects unauthorized HTTP requests.

All three use the exact same underlying permission matrix.

---

## Repository Walkthrough

### The Source of Truth: `src/lib/personas.ts`
This file defines the role hierarchy and the permission matrix. 
* **Data Flow:** Shared between Client and Server. It contains NO `"use client"` directive.
* **Execution Flow:** Loaded into memory by the edge middleware and the client bundle.

### The UI & State Evaluator: `src/lib/rbac.ts`
* **Purpose:** Pure functions like `can(role, permission)`.
* **Data Flow:** Takes the matrix from `personas.ts` and returns boolean evaluations.

### The Client Session: `src/lib/session.ts`
* **Purpose:** Zustand store `useSession` that tracks the current persona.
* **Relationships:** Exposes `.can(perm)` bound to the current user's role.

### The API Guard: `src/server/services/authz.ts`
* **Purpose:** Server-side functions `resolvePrincipal(req)` and `requirePermission()`.
* **Execution Flow:** API routes call this before doing *any* data access.

---

## Code Walkthrough

### The Permission Matrix (`personas.ts`)
```typescript
export const PERMISSION_MATRIX: Record<Permission, Role[]> = {
  view_capacity: ["admin", "executive", "dept_head", "project_manager", "team_lead"],
  reallocate: ["admin", "dept_head", "project_manager"],
  // ...
};
```
*Note that `admin` is explicitly listed everywhere, but our `can()` function actually short-circuits to `true` for admin anyway as a fallback.*

### State Enforcement (`store.ts`)
```typescript
// Inside useOps.applyDelta
const session = useSession.getState();
if (!session.can("reallocate")) {
  set({ lastActionError: "Insufficient privileges to reallocate capacity." });
  return;
}
```
*Even if a user unhides the Reallocate button using Chrome DevTools, the Zustand action will refuse to execute the state mutation.*

### API Enforcement (`server/api.ts`)
```typescript
export async function guarded(req: NextRequest, resource: string, handler: () => Promise<NextResponse>) {
  try {
    // ... setup
    return await handler();
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // ...
  }
}
```

---

## Architecture

**Tradeoffs:** Sharing `personas.ts` between client and server increases the client bundle size very slightly, but guarantees that the UI never goes out of sync with the backend. 
**Alternatives:** 
* *Attribute-Based Access Control (ABAC):* More granular (e.g., "can edit project IF user is owner of project"). We currently use RBAC for simplicity, but ABAC will be necessary for multi-tenant enterprise scaling.
* *Middleware-only AuthZ:* Next.js Middleware can theoretically check permissions. We don't do this because middleware can't easily fetch database data for complex ownership checks. The API route is the correct place.

---

## Algorithms

The `can(role, permission)` check is an $O(1)$ set lookup (using a pre-computed Set) or $O(N)$ array scan, where $N$ is the number of roles allowed for a permission. Because $N < 10$, array scanning is effectively $O(1)$ and memory-efficient.

---

## Debugging

**Common Bug:** "API returns 403 but the button is visible."
* **Cause:** The permission matrix was updated on the server, but the client has a stale cache of the Next.js bundle, OR the permission is spelled wrong in the UI `can("veiw_capacity")`.

**Common Bug:** "E2E tests fail with 401 Unauthorized."
* **Cause:** The persona ID injected into the `dz_session` cookie in `e2e/desktop.mjs` has a typo and does not exactly match an ID in `PERSONAS`.

---

## Important Repository Files

1. `src/lib/personas.ts` (Read first)
2. `src/lib/rbac.ts` (Read second)
3. `src/server/services/authz.ts` (Read third)
4. `src/app/api/v1/capacity/route.ts` (Observe it in action)

---

## Exercises

**Junior:** Add a new permission called `view_settings` to `personas.ts`. Allow only `admin` and `executive` to use it.
**Mid:** In the Desktop Settings app, wrap the UI elements in a check so they only render if `useSession().can("view_settings")` is true.
**Senior:** Create a new API route `/api/v1/settings` that uses `requirePermission("view_settings")`. Write a Vitest unit test to assert that a `team_lead` gets a 403 Forbidden.

---

## Interview Questions

**Junior:** What is the difference between Authentication and Authorization in DizruptOS?
*Answer: Authentication verifies WHO you are (the `dz_session` cookie). Authorization verifies WHAT you can do (`can()` and `requirePermission()`).*

**Senior:** Why do we enforce RBAC in the Zustand store if the API already blocks the request?
*Answer: Because DizruptOS operates in a "Demo Mode" where the API is bypassed and data lives purely in memory. Without store-level enforcement, demo mode would have zero security, and E2E tests against demo mode would not accurately reflect production security constraints.*

**Founder:** How would you evolve this RBAC system into ABAC (Attribute-Based Access Control) to support a scenario where a `project_manager` can only reallocate employees *currently assigned to their specific project*?
*Answer: I would modify the `requirePermission` signature to accept a context object: `requirePermission(principal, "reallocate", { targetEmployeeId })`. The authz service would need to query the repository to verify the relationship between the principal's managed projects and the target employee's assignments before returning.*
