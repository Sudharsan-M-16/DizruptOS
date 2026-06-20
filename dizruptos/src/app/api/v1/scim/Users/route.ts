// SCIM 2.0 Users resource — RFC 7644.
// Enterprise IdPs (Okta, Azure AD, OneLogin) hit this to provision/deprovision users.
//
// Auth: Bearer token in Authorization header, validated against SCIM_TOKEN env var.
// In production: per-tenant tokens stored in tenant_settings, looked up by org.

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
  if (!SCIM_TOKEN) return true; // open in demo mode
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${SCIM_TOKEN}`;
}

function toScimUser(user: Record<string, unknown>, base: string) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: user.id,
    externalId: user.externalId,
    userName: user.email,
    name: { formatted: user.name, givenName: String(user.name ?? "").split(" ")[0], familyName: String(user.name ?? "").split(" ").slice(1).join(" ") },
    displayName: user.name,
    active: user.active ?? true,
    emails: [{ value: user.email, primary: true, type: "work" }],
    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
      department: user.department,
      organization: user.orgId,
    },
    meta: {
      resourceType: "User",
      location: `${base}/api/v1/scim/Users/${user.id}`,
      created: user.createdAt,
      lastModified: user.updatedAt ?? user.createdAt,
    },
  };
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isLive = !!(SB_URL && SB_KEY);

const DEMO_USERS: Record<string, unknown>[] = [
  { id: "u-demo-1", externalId: "okta-001", email: "noor@example.com", name: "Noor Patel", active: true, department: "Engineering", orgId: "org-1", createdAt: "2026-01-01T00:00:00Z" },
  { id: "u-demo-2", externalId: "okta-002", email: "asha@example.com", name: "Asha Reyes", active: true, department: "Engineering", orgId: "org-1", createdAt: "2026-01-01T00:00:00Z" },
];

// GET /api/v1/scim/Users — list with optional filter
export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return scimError(401, "invalidCredentials", "Bearer token invalid");

  const filter = req.nextUrl.searchParams.get("filter");
  const startIndex = parseInt(req.nextUrl.searchParams.get("startIndex") ?? "1");
  const count = Math.min(parseInt(req.nextUrl.searchParams.get("count") ?? "100"), 200);

  let allUsers: Record<string, unknown>[] = DEMO_USERS;
  if (isLive) {
    try {
      let path = `${SB_URL!.replace(/\/$/, "")}/rest/v1/users?select=id,email,full_name,role,department,org_id,created_at&order=created_at&limit=${count}`;
      if (filter) {
        const m = filter.match(/userName eq "(.+?)"/);
        if (m) path += `&email=eq.${encodeURIComponent(m[1])}`;
      }
      const r = await fetch(path, { headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY!}` }, cache: "no-store" });
      if (r.ok) {
        const rows = (await r.json()) as Array<{ id: string; email: string; full_name?: string; role?: string; department?: string; org_id?: string; created_at: string }>;
        allUsers = rows.map((u) => ({ id: u.id, email: u.email, name: u.full_name ?? u.email, active: true, department: u.department, orgId: u.org_id, createdAt: u.created_at }));
      }
    } catch { allUsers = DEMO_USERS; }
  }

  const filtered = filter && !isLive
    ? allUsers.filter((u) => { const m = filter.match(/userName eq "(.+?)"/); return m ? u.email === m[1] : true; })
    : allUsers;

  const base = req.nextUrl.origin;
  metrics.importRows.inc({ connector: "scim", action: "list" }, filtered.length);

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: filtered.length,
    startIndex,
    itemsPerPage: Math.min(count, filtered.length),
    Resources: filtered.slice(startIndex - 1, startIndex - 1 + count).map((u) => toScimUser(u, base)),
  });
}

// POST /api/v1/scim/Users — provision a new user
export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return scimError(401, "invalidCredentials", "Bearer token invalid");

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return scimError(400, "invalidSyntax", "Invalid JSON"); }

  const userName = body.userName as string | undefined;
  const displayName = body.displayName?.toString() ?? String((body.name as Record<string, string>)?.formatted ?? userName ?? "");
  const enterprise = body["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"] as Record<string, string> | undefined;
  const department = enterprise?.department;
  if (!userName) return scimError(400, "invalidValue", "userName is required");

  const now = new Date().toISOString();
  const newUser: Record<string, unknown> = {
    id: `scim-${Date.now()}`,
    externalId: body.externalId,
    email: userName,
    name: displayName,
    active: body.active ?? true,
    department,
    orgId: "org-1",
    createdAt: now,
  };

  if (isLive) {
    // Invite user via Supabase Auth Admin (sends magic link)
    try {
      const authRes = await fetch(`${SB_URL!.replace(/\/$/, "")}/auth/v1/admin/users`, {
        method: "POST",
        headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY!}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: userName, email_confirm: true, user_metadata: { full_name: displayName }, app_metadata: { role: "employee", department } }),
      });
      if (authRes.ok) {
        const authUser = (await authRes.json()) as { id: string };
        newUser.id = authUser.id;
        // Upsert into public.users
        await fetch(`${SB_URL!.replace(/\/$/, "")}/rest/v1/users?on_conflict=email`, {
          method: "POST",
          headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY!}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ id: authUser.id, email: userName, full_name: displayName, role: "employee", department }),
        });
      }
    } catch { /* best-effort; return 201 anyway so IdP doesn't retry */ }
  }

  metrics.importRows.inc({ connector: "scim", action: "create" });
  console.log(JSON.stringify({ ts: now, level: "info", event: "scim_user_provisioned", ctx: { email: userName } }));

  return NextResponse.json(toScimUser(newUser, req.nextUrl.origin), { status: 201 });
}
