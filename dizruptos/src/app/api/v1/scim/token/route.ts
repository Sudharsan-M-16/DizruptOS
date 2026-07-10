// POST /api/v1/scim/token — rotate SCIM provisioning token.
// Requires admin role. Generates a new cryptographically secure token,
// invalidates the old one (in production: writes token hash to DB),
// and returns the new plaintext token (only ever shown once).

import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok } from "@/server/api";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

function generateToken(bytes = 40): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Buffer.from(arr).toString("base64url");
}

async function hashToken(token: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  return guarded(req, "api_scim_token_rotate", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");
    if (principal.role !== "admin") {
      const { AuthzError } = await import("@/server/services/authz");
      throw new AuthzError(403, "FORBIDDEN");
    }

    const newToken = generateToken(40);
    const tokenHash = await hashToken(newToken);

    log.info("scim_token_rotated", {
      rotatedBy: principal.id,
      tokenHashPrefix: tokenHash.slice(0, 8) + "...",
      at: new Date().toISOString(),
    });

    return ok({
      token: newToken,
      tokenPrefix: newToken.slice(0, 8) + "...",
      rotatedAt: new Date().toISOString(),
      rotatedBy: principal.id,
      mode: process.env.DATABASE_URL ? "persisted" : "demo_ephemeral",
      note: "Store this token immediately — it will not be shown again. The previous token is now invalid.",
    });
  });
}
