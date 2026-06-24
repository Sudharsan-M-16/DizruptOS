// POST /api/v1/import { entity, csv } — parse+validate+upsert to the live graph.
// GET  /api/v1/import?template=capabilities — download a CSV template.
import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { importCsv } from "@/server/services/import";
import { csvTemplate, SCHEMAS, type ImportEntity } from "@/lib/import/csv";
import { guarded, ok, fail, principalView } from "@/server/api";
import { createJob, finishJob } from "@/server/services/import-jobs";
import { sanitizeCsv } from "@/server/lib/sanitize";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("template") as ImportEntity | null;
  if (t && SCHEMAS[t]) {
    return new Response(csvTemplate(t), {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${t}.csv"` },
    });
  }
  return fail(422, "INVALID_INPUT", "template must be one of: " + Object.keys(SCHEMAS).join(", "));
}

export async function POST(req: NextRequest) {
  return guarded(req, "api_import", async () => {
    const principal = resolvePrincipal(req);
    const body = await req.json().catch(() => null);
    const entity = body?.entity as ImportEntity | undefined;
    const csv = body?.csv as string | undefined;
    if (!entity || !SCHEMAS[entity]) return fail(422, "INVALID_INPUT", "entity must be one of: " + Object.keys(SCHEMAS).join(", "));
    if (!csv || typeof csv !== "string") return fail(422, "INVALID_INPUT", "csv string required");

    // Sanitize CSV before processing (size limit + formula injection neutralization).
    let cleanCsv: string;
    try {
      cleanCsv = sanitizeCsv(csv);
    } catch (err) {
      return fail(422, "INVALID_INPUT", String(err));
    }

    const source = entity === "hris_bulk" ? "hris_bulk" : "csv";
    const job = createJob({ entity, source, triggeredBy: principal.id });
    try {
      const result = await importCsv(entity, cleanCsv);
      finishJob(job.id, {
        status: result.errors.length === 0 ? "success" : "partial",
        parsed: result.parsed,
        imported: result.imported,
        errors: result.errors,
      });
      return ok({ ...result, jobId: job.id }, { ...principalView(principal) });
    } catch (err) {
      finishJob(job.id, { status: "failed", parsed: 0, imported: 0, errors: [{ message: String(err) }] });
      throw err;
    }
  });
}
