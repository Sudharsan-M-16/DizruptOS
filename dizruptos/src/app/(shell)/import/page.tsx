"use client";

// Data Import — paste/upload a CSV, pick the entity, import into the live graph.
// Thin shell over POST /api/v1/import (parse → validate → upsert). Imported rows
// flow straight into the intelligence engines (capability/people/health).

import * as React from "react";
import { CheckCircle2, ClipboardCopy, Download, Github, XCircle } from "lucide-react";
import { SectionHeader } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin */ }
}

const ENTITIES = [
  { id: "capabilities", label: "Capabilities", cols: "name, category, strategic_importance" },
  { id: "employees", label: "People", cols: "name, email, role, title, capacity_hours" },
  { id: "employee_capabilities", label: "Skills (person→capability)", cols: "email, capability, proficiency" },
  { id: "hris_bulk", label: "HRIS Bulk (People + Skills)", cols: "name, email, title, role, department, location, capacity_hours" },
] as const;

type Result = { entity: string; parsed: number; imported: number; errors: { row: number; message: string }[] };

const CONNECTORS = [
  { name: "Jira", endpoint: "/api/v1/import/jira", envKey: "JIRA_WEBHOOK_SECRET" },
  { name: "Linear", endpoint: "/api/v1/import/linear", envKey: "LINEAR_WEBHOOK_SECRET" },
  { name: "GitHub", endpoint: "/api/v1/import/github", envKey: "GITHUB_WEBHOOK_SECRET" },
];

export default function ImportPage() {
  const [entity, setEntity] = React.useState<(typeof ENTITIES)[number]["id"]>("capabilities");
  const [csv, setCsv] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

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

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const meta = ENTITIES.find((e) => e.id === entity)!;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.dizrupt.io";

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#F59E0B22", border: "1px solid #F59E0B44" }}>
          <Download size={15} style={{ color: "#F59E0B" }} />
        </span>
        <div>
          <div className="text-sm font-semibold">Data Import</div>
          <div className="text-[11px] text-fg-muted">CSV upload · webhook connectors (Jira, Linear, GitHub)</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl space-y-8">

          {/* Webhook connectors status */}
          <section>
            <SectionHeader title="Live connectors" hint="HMAC-verified webhooks — data flows straight into the graph." />
            <div className="grid gap-3 sm:grid-cols-3">
              {CONNECTORS.map((c) => (
                <div key={c.name} className="panel p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Github size={14} className="text-fg-muted" />
                    <span className="text-sm font-semibold">{c.name}</span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-fg-muted">
                      <XCircle size={11} className="text-fg-muted" /> not configured
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-line bg-ink px-2.5 py-1.5 font-mono text-[10px] text-fg-faint">
                    <span className="flex-1 truncate">{baseUrl}{c.endpoint}</span>
                    <button onClick={() => copy(baseUrl + c.endpoint, c.name)} className="shrink-0 hover:text-fg">
                      {copied === c.name ? <CheckCircle2 size={11} className="text-[#10B981]" /> : <ClipboardCopy size={11} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-fg-faint">Set <code className="rounded bg-ink-elevated px-1">{c.envKey}</code> to activate</p>
                </div>
              ))}
            </div>
          </section>

          {/* CSV import */}
          <section>
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
                  placeholder={`Paste CSV or upload below...\n${meta.cols}`}
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
                {busy ? "Importing..." : "Import into graph"}
              </button>
            </div>
          </section>

          {error && <div className="panel border-danger/40 p-4 text-sm text-danger">{error}</div>}

          {result && (
            <div className="panel space-y-3 p-6">
              <div className="flex items-center gap-4">
                <span className="font-display text-3xl font-bold text-brand">{result.imported}</span>
                <div className="text-sm text-fg-secondary">
                  imported into <span className="font-medium text-fg">{result.entity}</span> &middot; {result.parsed} parsed &middot;{" "}
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
                  Done &mdash; open{" "}
                  <button onClick={() => launchApp("r-capabilities")} className="text-brand hover:underline">Capability Intelligence</button>
                  {" "}or{" "}
                  <button onClick={() => launchApp("r-briefing")} className="text-brand hover:underline">the Executive Briefing</button>
                  {" "}to see it reflected.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
