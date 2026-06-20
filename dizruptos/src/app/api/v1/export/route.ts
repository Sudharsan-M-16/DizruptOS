// GET /api/v1/export?format=csv|json&type=employees|projects|risks|proposals
// Enterprise data export — requires view_audit or admin role.
// Returns CSV or JSON of the requested entity type.
// Cache-Control: no-store (exports are sensitive, never cached)

import { type NextRequest, NextResponse } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { getRepositories } from "@/server/repositories";
import { guarded, fail } from "@/server/api";

export const dynamic = "force-dynamic";

type ExportType = "employees" | "projects" | "risks" | "proposals";
type ExportFormat = "csv" | "json";

const VALID_TYPES: ExportType[] = ["employees", "projects", "risks", "proposals"];
const VALID_FORMATS: ExportFormat[] = ["csv", "json"];

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

async function fetchData(type: ExportType): Promise<Record<string, unknown>[]> {
  const repos = getRepositories();
  switch (type) {
    case "employees": {
      const employees = await repos.employees.list();
      return employees.map((e) => ({
        id: e.id,
        name: e.name,
        initials: e.initials,
        role: e.role,
        title: e.title ?? "",
        department_id: e.departmentId ?? "",
        location: e.location ?? "",
        timezone: e.timezone ?? "",
        capacity_hours_per_week: e.capacityHoursPerWeek,
        joined_at: e.joinedAt ?? "",
      }));
    }
    case "projects": {
      const projects = await repos.projects.list();
      return projects.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status ?? "",
        health: p.health,
        owner_id: p.ownerId ?? "",
        department_id: p.departmentId ?? "",
        budget_hours: p.budgetHours,
        consumed_hours: p.consumedHours,
        start_date: p.startDate ?? "",
        target_date: p.targetDate ?? "",
      }));
    }
    case "risks": {
      const risks = await repos.risks.list();
      return risks.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        probability: r.probability,
        impact: r.impact,
        status: r.status,
        mitigation_status: r.mitigationStatus,
        owner_id: r.ownerId ?? "",
        created_at: r.createdAt ?? "",
      }));
    }
    case "proposals": {
      const proposals = await repos.proposals.list();
      return proposals.map((p) => ({
        id: p.id,
        title: p.title,
        agent_type: p.agentType,
        status: p.status,
        confidence: p.confidence,
        priority: p.priority,
        created_at: p.createdAt ?? "",
      }));
    }
  }
}

export async function GET(req: NextRequest) {
  return guarded(req, "api_export", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");

    const typeParam = req.nextUrl.searchParams.get("type") as ExportType | null;
    const formatParam = req.nextUrl.searchParams.get("format") as ExportFormat | null;

    if (!typeParam || !VALID_TYPES.includes(typeParam)) {
      return fail(422, "INVALID_INPUT", `type must be one of: ${VALID_TYPES.join(", ")}`);
    }
    if (formatParam && !VALID_FORMATS.includes(formatParam)) {
      return fail(422, "INVALID_INPUT", `format must be one of: ${VALID_FORMATS.join(", ")}`);
    }

    const format: ExportFormat = formatParam ?? "json";
    const data = await fetchData(typeParam);
    const ts = new Date().toISOString().slice(0, 10);
    const filename = `dizrupt-${typeParam}-${ts}.${format}`;

    if (format === "csv") {
      const csv = toCSV(data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Export-Type": typeParam,
          "X-Export-Count": String(data.length),
          "X-Exported-By": principal.id,
        },
      });
    }

    const body = JSON.stringify({
      apiVersion: "v1",
      exportedAt: new Date().toISOString(),
      exportedBy: principal.id,
      type: typeParam,
      count: data.length,
      data,
    }, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Export-Type": typeParam,
        "X-Export-Count": String(data.length),
        "X-Exported-By": principal.id,
      },
    });
  });
}
