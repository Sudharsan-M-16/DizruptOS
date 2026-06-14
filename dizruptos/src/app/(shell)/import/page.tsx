"use client";

// Data Import — paste/upload a CSV, pick the entity, import into the live graph.
// Thin shell over POST /api/v1/import (parse → validate → upsert). Imported rows
// flow straight into the intelligence engines (capability/people/health).

import * as React from "react";
import { SectionHeader } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ENTITIES = [
  { id: "capabilities", label: "Capabilities", cols: "name, category, strategic_importance" },
  { id: "employees", label: "People", cols: "name, email, role, title, capacity_hours" },
  { id: "employee_capabilities", label: "Skills (person→capability)", cols: "email, capability, proficiency" },
] as const;

type Result = { entity: string; parsed: number; imported: number; errors: { row: number; message: string }[] };

export default function ImportPage() {
  const [entity, setEntity] = React.useState<(typeof ENTITIES)[number]["id"]>("capabilities");
  const [csv, setCsv] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onFile = (f: File) => f.text().then(setCsv);

  const run = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/v1/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, csv }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message ?? j.code ?? "Import failed");
      setResult(j.data as Result);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const meta = ENTITIES.find((e) => e.id === entity)!;

  return (
    <div className="max-w-3xl space-y-8">
      <SectionHeader title="Import data" hint="Bring a real organization's data into the graph. Imported rows generate intelligence immediately." />

      <div className="panel space-y-5 p-6">
        <div>
          <div className="label-xs mb-2">Entity</div>
          <div className="flex flex-wrap gap-2">
            {ENTITIES.map((e) => (
              <button
                key={e.id}
                onClick={() => setEntity(e.id)}
                className={cn(
                  "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                  entity === e.id ? "border-brand bg-brand-soft text-brand" : "border-line text-fg-secondary hover:border-brand/40"
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-fg-muted">
            <span>Columns: <span className="font-mono text-fg-secondary">{meta.cols}</span></span>
            <a href={`/api/v1/import?template=${entity}`} className="text-brand hover:underline">download template</a>
          </div>
        </div>

        <div>
          <div className="label-xs mb-2">CSV</div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={`Paste CSV or upload below…\n${meta.cols}`}
            className="h-44 w-full resize-y rounded-lg border border-line bg-ink px-3 py-2.5 font-mono text-sm text-fg outline-none focus:border-brand/50"
          />
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            className="mt-2 text-sm text-fg-muted file:mr-3 file:rounded-md file:border-0 file:bg-ink-elevated file:px-3 file:py-1.5 file:text-fg-secondary" />
        </div>

        <button
          onClick={run}
          disabled={busy || !csv.trim()}
          className="h-11 rounded-lg bg-brand px-6 text-sm font-bold text-[#04281A] transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import into graph"}
        </button>
      </div>

      {error && <div className="panel border-danger/40 p-4 text-sm text-danger">{error}</div>}

      {result && (
        <div className="panel space-y-3 p-6">
          <div className="flex items-center gap-4">
            <span className="font-display text-3xl font-bold text-brand">{result.imported}</span>
            <div className="text-sm text-fg-secondary">
              imported into <span className="font-medium text-fg">{result.entity}</span> · {result.parsed} parsed ·{" "}
              {result.errors.length} issue{result.errors.length === 1 ? "" : "s"}
            </div>
          </div>
          {result.errors.length > 0 && (
            <ul className="space-y-1 border-t border-line-subtle pt-3 text-xs text-warn">
              {result.errors.slice(0, 12).map((e, i) => <li key={i}>{e.message}</li>)}
            </ul>
          )}
          {result.imported > 0 && (
            <p className="border-t border-line-subtle pt-3 text-sm text-fg-muted">
              Done — open <a href="/capabilities" className="text-brand hover:underline">Capability Intelligence</a> or{" "}
              <a href="/briefing" className="text-brand hover:underline">the Executive Briefing</a> to see it reflected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
