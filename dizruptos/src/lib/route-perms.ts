// Route → required permission (pure, no JSX) so it's unit-testable and shared by
// the RouteGuard. Defense-in-depth: the OS hides launch buttons by role, but a
// direct URL must be gated too.

import { APPS } from "./desktop-apps";
import type { Permission } from "./personas";

// Routes whose perm isn't on a current dock app (the merged Org-Memory surfaces).
const ROUTE_PERM: Record<string, Permission> = {
  "/decisions": "view_capacity",
  "/capabilities": "view_capacity",
  "/learning": "view_capacity",
  "/narratives": "view_executive",
};

export function requiredPerm(pathname: string): Permission | undefined {
  const app = APPS.find((a) => a.href && (pathname === a.href || pathname.startsWith(a.href + "/")));
  if (app?.perm) return app.perm;
  for (const [route, perm] of Object.entries(ROUTE_PERM)) {
    if (pathname === route || pathname.startsWith(route + "/")) return perm;
  }
  return undefined;
}
