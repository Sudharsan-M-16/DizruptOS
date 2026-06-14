// CSV import — pure parsing + validation + transformation. No deps, no DB, no
// React, so it is fully unit-testable. The server import service feeds parsed
// rows here, then persists; the route + UI are thin shells over this.

/** RFC-4180-ish CSV parser: handles quoted fields, embedded commas/quotes/newlines. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type ImportEntity = "employees" | "capabilities" | "employee_capabilities";

export interface FieldSpec {
  csv: string; // header in the CSV
  required?: boolean;
  enum?: string[];
  number?: boolean;
}

/** What each importable entity expects. Headers are case-insensitive. */
export const SCHEMAS: Record<ImportEntity, { fields: FieldSpec[]; sample: string[] }> = {
  employees: {
    fields: [
      { csv: "name", required: true },
      { csv: "email", required: true },
      { csv: "role", enum: ["admin", "executive", "dept_head", "project_manager", "team_lead", "employee", "client"] },
      { csv: "title" },
      { csv: "capacity_hours", number: true },
    ],
    sample: ["name,email,role,title,capacity_hours", "Dana Lee,dana@acme.io,project_manager,Delivery Lead,40"],
  },
  capabilities: {
    fields: [
      { csv: "name", required: true },
      { csv: "category" },
      { csv: "strategic_importance", enum: ["low", "medium", "high", "critical"] },
    ],
    sample: ["name,category,strategic_importance", "Kubernetes,engineering,high"],
  },
  employee_capabilities: {
    fields: [
      { csv: "email", required: true },
      { csv: "capability", required: true },
      { csv: "proficiency", required: true, number: true },
    ],
    sample: ["email,capability,proficiency", "dana@acme.io,Kubernetes,4"],
  },
};

export interface RowError { row: number; message: string }
export interface ParseResult {
  entity: ImportEntity;
  headers: string[];
  records: Record<string, string | number>[];
  errors: RowError[];
}

/** Parse + validate a CSV string against an entity schema. */
export function parseAndValidate(entity: ImportEntity, csv: string): ParseResult {
  const spec = SCHEMAS[entity];
  const grid = parseCSV(csv);
  const errors: RowError[] = [];
  if (grid.length < 2) {
    return { entity, headers: [], records: [], errors: [{ row: 0, message: "CSV has no data rows" }] };
  }
  const headers = grid[0].map((h) => h.trim().toLowerCase());
  // required headers present?
  for (const f of spec.fields.filter((x) => x.required)) {
    if (!headers.includes(f.csv)) errors.push({ row: 0, message: `Missing required column "${f.csv}"` });
  }
  const records: Record<string, string | number>[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const rec: Record<string, string | number> = {};
    let rowOk = true;
    for (const f of spec.fields) {
      const idx = headers.indexOf(f.csv);
      const raw = idx >= 0 ? (cells[idx] ?? "").trim() : "";
      if (f.required && !raw) { errors.push({ row: r, message: `Row ${r}: "${f.csv}" is required` }); rowOk = false; continue; }
      if (!raw) continue;
      if (f.enum && !f.enum.includes(raw)) { errors.push({ row: r, message: `Row ${r}: "${f.csv}"="${raw}" not in [${f.enum.join("|")}]` }); rowOk = false; continue; }
      if (f.number) {
        const n = Number(raw);
        if (Number.isNaN(n)) { errors.push({ row: r, message: `Row ${r}: "${f.csv}"="${raw}" is not a number` }); rowOk = false; continue; }
        rec[f.csv] = n;
      } else rec[f.csv] = raw;
    }
    if (rowOk) records.push(rec);
  }
  return { entity, headers, records, errors };
}

export function csvTemplate(entity: ImportEntity): string {
  return SCHEMAS[entity].sample.join("\n") + "\n";
}
