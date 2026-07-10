// SCIM 2.0 Users/:id — GET (individual), PUT (replace), PATCH (update), DELETE (deprovision)

import { type NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/telemetry";

const SCIM_TOKEN = process.env.SCIM_TOKEN;

function scimError(status: number, scimType: string, detail: string) {
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: String(status),
    scimType,
    detail,
  }, { status });
}

function verifyToken(req: NextRequest): boolean {
  if (!SCIM_TOKEN) return true;
  return req.headers.get("authorization") === `Bearer ${SCIM_TOKEN}`;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyToken(req)) return scimError(401, "invalidCredentials", "Bearer token invalid");
  // Production: load from users table by id.
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: params.id,
    userName: "user@example.com",
    active: true,
    meta: { resourceType: "User", location: `${req.nextUrl.origin}/api/v1/scim/Users/${params.id}` },
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyToken(req)) return scimError(401, "invalidCredentials", "Bearer token invalid");
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return scimError(400, "invalidSyntax", "Invalid JSON"); }
  metrics.importRows.inc({ connector: "scim", action: "replace" });
  // Production: full user replace in users table.
  return NextResponse.json({ ...body, id: params.id, schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyToken(req)) return scimError(401, "invalidCredentials", "Bearer token invalid");
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return scimError(400, "invalidSyntax", "Invalid JSON"); }

  const ops = body.Operations as Array<{ op: string; path?: string; value: unknown }> | undefined;
  if (!ops) return scimError(400, "invalidValue", "Operations required for PATCH");

  // Handle active=false = deprovision (Okta / Azure AD deactivate flow).
  const deactivate = ops.some((op) => op.path === "active" && op.value === false);
  if (deactivate) {
    metrics.authEvents.inc({ event: "scim_user_deactivated" });
    // Production: supabase.auth.admin.deleteUser(userId) or set active=false + revoke sessions.
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", event: "scim_user_deprovisioned", ctx: { id: params.id } }));
  }

  metrics.importRows.inc({ connector: "scim", action: "patch" });
  return NextResponse.json({ id: params.id, schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"], active: !deactivate });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyToken(req)) return scimError(401, "invalidCredentials", "Bearer token invalid");
  metrics.authEvents.inc({ event: "scim_user_deleted" });
  // Production: hard-delete from users, cascade session revocation.
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", event: "scim_user_deleted", ctx: { id: params.id } }));
  return new NextResponse(null, { status: 204 });
}
