// POST /api/v1/import/validate { entity, csv }
// Dry-run: parse + validate a CSV against the entity schema without writing to the DB.
// Returns parsed row count, valid count, and any validation errors.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { parseAndValidate, SCHEMAS, type ImportEntity } from "@/lib/import/csv";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return guarded(req, "import_validate", async () => {
    resolvePrincipal(req); // auth required, no specific permission needed
    const body = await req.json().catch(() => null);
    const entity = body?.entity as ImportEntity | undefined;
    const csv = body?.csv as string | undefined;
    if (!entity || !SCHEMAS[entity]) {
      return fail(422, "INVALID_INPUT", "entity must be one of: " + Object.keys(SCHEMAS).join(", "));
    }
    if (!csv || typeof csv !== "string") {
      return fail(422, "INVALID_INPUT", "csv string required");
    }
    const result = parseAndValidate(entity, csv);
    return ok({
      entity,
      parsed: result.records.length + result.errors.filter((e) => e.row > 0).length,
      valid: result.records.length,
      errors: result.errors,
      dryRun: true,
    });
  });
}
