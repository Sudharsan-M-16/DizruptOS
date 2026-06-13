// Server-side authorization — resolves the session cookie to a persona and
// enforces permissions BEFORE any repository call. The client-side checks are
// UX; this is the trust boundary (no trust assumptions past this line).

import type { NextRequest } from "next/server";
import { PERSONAS, roleCan, type Permission } from "@/lib/personas";
import type { Role } from "@/lib/types";

export interface Principal {
  id: string;
  role: Role;
  name: string;
}

export class AuthzError extends Error {
  constructor(
    public readonly status: 401 | 403,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN"
  ) {
    super(code);
  }
}

/** Cookie → principal. Demo tier: cookie value IS the persona id (issued by
 *  /api/auth/login). Production: opaque session id → sessions table lookup. */
export function resolvePrincipal(req: NextRequest): Principal {
  const session = req.cookies.get("dz_session")?.value;
  const persona = PERSONAS.find((p) => p.id === session);
  if (!persona) throw new AuthzError(401, "UNAUTHENTICATED");
  return { id: persona.id, role: persona.role, name: persona.name };
}

export function requirePermission(principal: Principal, perm: Permission): void {
  if (!roleCan(principal.role, perm)) throw new AuthzError(403, "FORBIDDEN");
}
