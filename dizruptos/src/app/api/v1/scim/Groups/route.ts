// SCIM 2.0 Groups resource — maps IdP groups to DIZRUPT roles/departments.
// Okta / Azure AD push group membership changes here during provisioning.

import { type NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/telemetry";

const SCIM_TOKEN = process.env.SCIM_TOKEN;

function verifyToken(req: NextRequest): boolean {
  if (!SCIM_TOKEN) return true;
  return req.headers.get("authorization") === `Bearer ${SCIM_TOKEN}`;
}

function scimError(status: number, detail: string) {
  return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: String(status), detail }, { status });
}

// Mapping from IdP group names to DIZRUPT roles (configurable per-tenant).
const GROUP_ROLE_MAP: Record<string, string> = {
  "dizrupt-admins": "admin",
  "dizrupt-executives": "executive",
  "dizrupt-managers": "department_head",
  "dizrupt-project-managers": "project_manager",
  "dizrupt-employees": "employee",
};

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return scimError(401, "Bearer token invalid");
  const groups = Object.entries(GROUP_ROLE_MAP).map(([displayName, role], i) => ({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: `group-${i + 1}`,
    displayName,
    "urn:ietf:params:scim:schemas:extension:dizrupt:Group": { role },
    meta: { resourceType: "Group", location: `${req.nextUrl.origin}/api/v1/scim/Groups/group-${i + 1}` },
  }));
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: groups.length,
    startIndex: 1,
    itemsPerPage: groups.length,
    Resources: groups,
  });
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return scimError(401, "Bearer token invalid");
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return scimError(400, "Invalid JSON"); }

  const displayName = body.displayName as string | undefined;
  if (!displayName) return scimError(400, "displayName required");

  const role = GROUP_ROLE_MAP[displayName] ?? "employee";
  metrics.importRows.inc({ connector: "scim", action: "create_group" });

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: `group-${Date.now()}`,
    displayName,
    "urn:ietf:params:scim:schemas:extension:dizrupt:Group": { role },
    meta: { resourceType: "Group", location: `${req.nextUrl.origin}/api/v1/scim/Groups/group-new` },
  }, { status: 201 });
}
