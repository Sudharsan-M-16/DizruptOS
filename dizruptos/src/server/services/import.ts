// Import service — parses+validates a CSV (pure layer) then persists to the live
// DB via PostgREST upsert (service-role, server-only). Upsert = "merge" conflict
// strategy. Returns per-entity counts + errors; graph/intelligence read live, so
// imported rows immediately flow into capability/people/org-health/recommendations.

import { parseAndValidate, type ImportEntity } from "@/lib/import/csv";

interface Cfg { url: string; key: string }
function cfg(): Cfg | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

async function orgId(c: Cfg): Promise<string | null> {
  const r = await fetch(`${c.url}/rest/v1/organizations?select=id&order=created_at&limit=1`, {
    headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
  });
  const rows = (await r.json()) as { id: string }[];
  return rows[0]?.id ?? null;
}

async function upsert(c: Cfg, table: string, rows: unknown[], onConflict: string) {
  const res = await fetch(`${c.url}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: {
      apikey: c.key,
      Authorization: `Bearer ${c.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as unknown[]).length;
}

export interface ImportResult {
  entity: ImportEntity;
  parsed: number;
  imported: number;
  errors: { row: number; message: string }[];
}

export async function importCsv(entity: ImportEntity, csv: string): Promise<ImportResult> {
  const { records, errors } = parseAndValidate(entity, csv);
  const c = cfg();
  if (!c) return { entity, parsed: records.length, imported: 0, errors: [...errors, { row: 0, message: "Supabase not configured (demo mode) — import is a no-op." }] };
  if (records.length === 0) return { entity, parsed: 0, imported: 0, errors };

  const org = await orgId(c);
  let imported = 0;

  if (entity === "capabilities") {
    const rows = records.map((r) => ({
      name: r.name, category: r.category ?? null,
      strategic_importance: r.strategic_importance ?? "medium", org_id: org,
    }));
    imported = await upsert(c, "capabilities", rows, "org_id,name"); // unique idx is on (org_id, lower(name))
  } else if (entity === "employees") {
    const rows = records.map((r) => ({
      email: r.email, full_name: r.name, role: r.role ?? "employee",
      title: r.title ?? null, capacity_hours_per_week: r.capacity_hours ?? 40, org_id: org,
    }));
    imported = await upsert(c, "users", rows, "email");
  } else if (entity === "hris_bulk") {
    // Upsert users (employees) from an HRIS export — handles name, email, title, role, dept, location
    const rows = records.map((r) => ({
      email: r.email,
      full_name: r.name,
      role: r.role ?? "employee",
      title: r.title ?? null,
      department: r.department ?? null,
      location: r.location ?? null,
      capacity_hours_per_week: r.capacity_hours ?? 40,
      org_id: org,
    }));
    imported = await upsert(c, "users", rows, "email");
  } else if (entity === "employee_capabilities") {
    // resolve email→user_id and capability name→id, then upsert edges
    const emails = [...new Set(records.map((r) => String(r.email)))];
    const names = [...new Set(records.map((r) => String(r.capability)))];
    const q = (t: string, col: string, vals: string[]) =>
      fetch(`${c.url}/rest/v1/${t}?select=id,${col}&${col}=in.(${vals.map((v) => `"${v}"`).join(",")})`, {
        headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
      }).then((r) => r.json() as Promise<Record<string, string>[]>);
    const [users, caps] = await Promise.all([q("users", "email", emails), q("capabilities", "name", names)]);
    const userByEmail = new Map(users.map((u) => [u.email, u.id]));
    const capByName = new Map(caps.map((k) => [k.name, k.id]));
    const rows = records
      .map((r) => ({ user_id: userByEmail.get(String(r.email)), capability_id: capByName.get(String(r.capability)), proficiency: r.proficiency }))
      .filter((x) => x.user_id && x.capability_id);
    if (rows.length) imported = await upsert(c, "employee_capabilities", rows, "user_id,capability_id");
  }

  return { entity, parsed: records.length, imported, errors };
}
