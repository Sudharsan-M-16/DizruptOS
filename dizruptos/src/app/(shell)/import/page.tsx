"use client";

// Data Import — paste/upload a CSV, pick the entity, import into the live graph.
// Features: dry-run preview, job history, webhook connectivity test, enhanced result display.

import * as React from "react";
import {
  CheckCircle2, ClipboardCopy, Download, Github, XCircle,
  AlertTriangle, Clock, RefreshCw, ChevronDown, ChevronUp, Wifi,
} from "lucide-react";
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

type ImportEntity = (typeof ENTITIES)[number]["id"];

type Result = {
  entity: string;
  parsed: number;
  imported: number;
  errors: { row?: number; message: string }[];
  jobId?: string;
  dryRun?: boolean;
};

type ConnectorStatus = {
  name: string;
  status: "ready" | "missing_secret" | "unknown";
  webhookUrl: string;
  instructions?: string;
};

type ImportJob = {
  id: string;
  entity: string;
  source: string;
  status: "pending" | "running" | "success" | "failed" | "partial";
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  parsed: number;
  imported: number;
  errors: { row?: number; message: string }[];
  triggeredBy: string;
};

const CONNECTOR_SOURCES = [
  { name: "Jira", source: "jira" as const, envKey: "JIRA_WEBHOOK_SECRET" },
  { name: "Linear", source: "linear" as const, envKey: "LINEAR_WEBHOOK_SECRET" },
  { name: "GitHub", source: "github" as const, envKey: "GITHUB_WEBHOOK_SECRET" },
];

const STATUS_COLOR: Record<ImportJob["status"], string> = {
  success: "text-[#10B981]",
  partial: "text-[#F59E0B]",
  failed: "text-danger",
  pending: "text-fg-muted",
  running: "text-brand",
};

const STATUS_ICON: Record<ImportJob["status"], React.ReactNode> = {
  success: <CheckCircle2 size={12} className="text-[#10B981]" />,
  partial: <AlertTriangle size={12} className="text-[#F59E0B]" />,
  failed: <XCircle size={12} className="text-danger" />,
  pending: <Clock size={12} className="text-fg-muted" />,
  running: <RefreshCw size={12} className="animate-spin text-brand" />,
};

export default function ImportPage() {
  const [entity, setEntity] = React.useState<ImportEntity>("capabilities");
  const [csv, setCsv] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [dryRun, setDryRun] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [connectors, setConnectors] = React.useState<ConnectorStatus[]>([]);
  const [testingSource, setTestingSource] = React.useState<string | null>(null);
  const [jobs, setJobs] = React.useState<ImportJob[]>([]);
  const [jobsOpen, setJobsOpen] = React.useState(false);
  const [errorsOpen, setErrorsOpen] = React.useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.dizrupt.io";
  const csvBytes = React.useMemo(() => new Blob([csv]).size, [csv]);

  const onFile = (f: File) => f.text().then(setCsv);

  const run = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const endpoint = dryRun ? "/api/v1/import/validate" : "/api/v1/import";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, csv }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message ?? j.code ?? "Import failed");
      setResult({ ...(j.data as Result), dryRun });
      if (!dryRun) loadJobs(); // refresh job history after real import
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const testConnector = async (source: string) => {
    setTestingSource(source);
    try {
      const res = await fetch("/api/v1/import/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const j = await res.json();
      if (res.ok) {
        const d = j.data as ConnectorStatus & { source: string };
        setConnectors((prev) => {
          const next = prev.filter((c) => c.name.toLowerCase() !== source);
          const name = CONNECTOR_SOURCES.find((c) => c.source === source)?.name ?? source;
          return [...next, { name, status: d.status, webhookUrl: d.webhookUrl, instructions: d.instructions }];
        });
      }
    } catch { /* silent */ } finally { setTestingSource(null); }
  };

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/v1/import/jobs?limit=20");
      const j = await res.json();
      if (res.ok) setJobs(j.data as ImportJob[]);
    } catch { /* silent */ }
  };

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const meta = ENTITIES.find((e) => e.id === entity)!;
  const connectorMap = React.useMemo(
    () => Object.fromEntries(connectors.map((c) => [c.name, c])),
    [connectors]
  );

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-white/[0.07] bg-[#040C12]/80 px-5 py-3.5 backdrop-blur-sm">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#F59E0B22", border: "1px solid #F59E0B44" }}>
          <Download size={15} style={{ color: "#F59E0B" }} />
        </span>
        <div>
          <div className="text-sm font-semibold text-white">Data Import</div>
          <div className="text-[11px] text-white/40">CSV upload · webhook connectors (Jira, Linear, GitHub)</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl space-y-8">

          {/* Webhook connectors */}
          <section>
            <SectionHeader title="Live connectors" hint="HMAC-verified webhooks — data flows straight into the graph." />
            <div className="grid gap-3 sm:grid-cols-3">
              {CONNECTOR_SOURCES.map((c) => {
                const tested = connectorMap[c.name];
                const isTesting = testingSource === c.source;
                return (
                  <div key={c.name} className="panel p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Github size={14} className="text-fg-muted" />
                      <span className="text-sm font-semibold">{c.name}</span>
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold">
                        {tested ? (
                          tested.status === "ready"
                            ? <><CheckCircle2 size={11} className="text-[#10B981]" /> <span className="text-[#10B981]">ready</span></>
                            : <><XCircle size={11} className="text-fg-muted" /> <span className="text-fg-muted">no secret</span></>
                        ) : (
                          <span className="text-fg-faint">not tested</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-line bg-ink px-2.5 py-1.5 font-mono text-[10px] text-fg-faint">
                      <span className="flex-1 truncate">{baseUrl}/api/v1/import/{c.source}</span>
                      <button onClick={() => copy(`${baseUrl}/api/v1/import/${c.source}`, c.name)} className="shrink-0 hover:text-fg">
                        {copied === c.name ? <CheckCircle2 size={11} className="text-[#10B981]" /> : <ClipboardCopy size={11} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-fg-faint">Set <code className="rounded bg-ink-elevated px-1">{c.envKey}</code></p>
                      <button
                        onClick={() => testConnector(c.source)}
                        disabled={isTesting}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-brand hover:bg-brand/10 disabled:opacity-50 transition-colors"
                      >
                        {isTesting ? <RefreshCw size={9} className="animate-spin" /> : <Wifi size={9} />}
                        {isTesting ? "Testing…" : "Test"}
                      </button>
                    </div>
                    {tested?.instructions && (
                      <p className="text-[10px] text-fg-faint leading-relaxed">{tested.instructions}</p>
                    )}
                  </div>
                );
              })}
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
                <div className="flex items-center justify-between mb-2">
                  <div className="label-xs">CSV</div>
                  {csv && (
                    <span className="text-[10px] text-fg-faint">
                      {csvBytes < 1024 ? `${csvBytes} B` : `${(csvBytes / 1024).toFixed(1)} KB`}
                    </span>
                  )}
                </div>
                <textarea
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  placeholder={`Paste CSV or upload below...\n${meta.cols}`}
                  className="h-44 w-full resize-y rounded-lg border border-line bg-ink px-3 py-2.5 font-mono text-sm text-fg outline-none focus:border-brand/50"
                />
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                  className="mt-2 text-sm text-fg-muted file:mr-3 file:rounded-md file:border-0 file:bg-ink-elevated file:px-3 file:py-1.5 file:text-fg-secondary"
                />
              </div>

              {/* Dry-run toggle */}
              <label className="flex cursor-pointer items-center gap-2.5">
                <div
                  onClick={() => setDryRun((v) => !v)}
                  className={cn(
                    "relative h-4 w-7 rounded-full transition-colors",
                    dryRun ? "bg-brand" : "bg-ink-elevated border border-line"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
                    dryRun ? "translate-x-3.5" : "translate-x-0.5"
                  )} />
                </div>
                <span className="text-sm text-fg-secondary">
                  Preview only <span className="text-fg-faint">(validate without importing)</span>
                </span>
              </label>

              <button
                onClick={run}
                disabled={busy || !csv.trim()}
                className={cn(
                  "h-11 rounded-lg px-6 text-sm font-bold transition hover:brightness-110 disabled:opacity-50",
                  dryRun
                    ? "border border-brand/50 bg-transparent text-brand"
                    : "bg-brand text-[#04281A]"
                )}
              >
                {busy ? (dryRun ? "Validating…" : "Importing…") : (dryRun ? "Validate (dry run)" : "Import into graph")}
              </button>
            </div>
          </section>

          {error && (
            <div className="panel border-danger/40 p-4 text-sm text-danger flex items-start gap-2">
              <XCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className={cn("panel space-y-3 p-6", result.dryRun ? "border-brand/30" : "")}>
              {result.dryRun && (
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
                  Dry run — no data written
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="font-display text-3xl font-bold text-brand">
                  {result.dryRun ? result.parsed : result.imported}
                </span>
                <div className="text-sm text-fg-secondary">
                  {result.dryRun ? (
                    <>
                      valid rows in <span className="font-medium text-fg">{result.entity}</span>
                      {" "}&middot; {result.parsed} parsed &middot; {result.errors.length} issue{result.errors.length === 1 ? "" : "s"}
                    </>
                  ) : (
                    <>
                      imported into <span className="font-medium text-fg">{result.entity}</span>
                      {" "}&middot; {result.parsed} parsed &middot; {result.errors.length} issue{result.errors.length === 1 ? "" : "s"}
                      {result.jobId && <span className="ml-2 font-mono text-[10px] text-fg-faint">job:{result.jobId}</span>}
                    </>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <button
                    onClick={() => setErrorsOpen((v) => !v)}
                    className="ml-auto flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg"
                  >
                    {errorsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {errorsOpen ? "Hide" : "Show"} errors
                  </button>
                )}
              </div>

              {errorsOpen && result.errors.length > 0 && (
                <ul className="space-y-1 border-t border-line-subtle pt-3 text-xs text-[#F59E0B]">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                      <span>{e.message}</span>
                    </li>
                  ))}
                  {result.errors.length > 20 && (
                    <li className="text-fg-faint">…and {result.errors.length - 20} more</li>
                  )}
                </ul>
              )}

              {!result.dryRun && result.imported > 0 && (
                <p className="border-t border-line-subtle pt-3 text-sm text-fg-muted">
                  Done &mdash; open{" "}
                  <button onClick={() => launchApp("r-memory")} className="text-brand hover:underline">Org Memory</button>
                  {" "}or{" "}
                  <button onClick={() => launchApp("r-briefing")} className="text-brand hover:underline">the Executive Briefing</button>
                  {" "}to see it reflected.
                </p>
              )}
            </div>
          )}

          {/* Recent import jobs */}
          <section>
            <div className="flex items-center justify-between">
              <SectionHeader title="Recent imports" hint="Last 20 import jobs across CSV and webhook sources." />
              <div className="flex items-center gap-2">
                <button
                  onClick={loadJobs}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-fg-muted hover:text-fg hover:bg-ink-elevated transition-colors"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
                <button
                  onClick={() => { setJobsOpen((v) => !v); if (!jobsOpen) loadJobs(); }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-fg-muted hover:text-fg hover:bg-ink-elevated transition-colors"
                >
                  {jobsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {jobsOpen ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {jobsOpen && (
              <div className="panel divide-y divide-line-subtle overflow-hidden">
                {jobs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-fg-faint">No import jobs yet.</div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="flex items-center gap-3 px-4 py-3">
                      <span>{STATUS_ICON[job.status]}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-fg truncate">{job.entity}</span>
                          <span className="rounded-sm bg-ink-elevated px-1.5 py-0.5 text-[10px] text-fg-muted">{job.source}</span>
                          <span className={cn("text-[10px] font-semibold", STATUS_COLOR[job.status])}>{job.status}</span>
                        </div>
                        <div className="text-[11px] text-fg-faint">
                          {new Date(job.startedAt).toLocaleTimeString()} &middot; {job.imported}/{job.parsed} rows
                          {job.durationMs != null && ` · ${job.durationMs}ms`}
                          {job.errors.length > 0 && <span className="ml-1 text-[#F59E0B]">{job.errors.length} error{job.errors.length === 1 ? "" : "s"}</span>}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-fg-faint shrink-0">{job.triggeredBy}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
