"use client";

import * as React from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import type { StepProps } from "../page";

const BRAND_GREEN = "#00ED82";
const BRAND_TEAL = "#00D9D5";

type ImportStatus = "idle" | "uploading" | "success" | "error";

export function StepImportData({ state, updateState, onNext, onBack }: StepProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<ImportStatus>("idle");
  const [importedCount, setImportedCount] = React.useState(0);
  const [errors, setErrors] = React.useState<string[]>([]);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) { setErrors(["Please upload a .csv file."]); return; }
    setFile(f);
    setStatus("idle");
    setErrors([]);
  };

  const runImport = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrors([]);
    try {
      const text = await file.text();
      const res = await fetch("/api/v1/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "hris_bulk", csv: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Import failed.");
      const n = data.data?.imported ?? data.data?.rows ?? 0;
      setImportedCount(n);
      updateState({ importedCount: state.importedCount + n });
      setStatus("success");
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Import failed."]);
      setStatus("error");
    }
  };

  const csvTemplate = `name,email,title,role,department,location,capacity_hours
Sarah Chen,sarah@company.com,Engineering Manager,dept_head,Engineering,San Francisco,40
James Kim,james@company.com,Backend Engineer,employee,Engineering,Remote,40`;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>Step 3 of 5</span>
        </div>
        <h2 className="mb-1.5 text-[1.75rem] font-light tracking-tight" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>
          Import your <em style={{ fontStyle: "italic" }}>people</em>.
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(160,200,195,0.75)" }}>
          Upload a CSV with your team data. DIZRUPT will build your org graph automatically. You can skip and add people manually later.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl p-8 text-center transition-all duration-200"
        style={{
          background: dragOver ? "rgba(0,200,195,0.08)" : "rgba(0,180,170,0.03)",
          border: `2px dashed ${dragOver ? "rgba(0,200,195,0.5)" : file ? "rgba(0,237,130,0.35)" : "rgba(0,200,195,0.2)"}`,
        }}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {status === "success" ? (
          <>
            <CheckCircle2 size={32} style={{ color: BRAND_GREEN }} />
            <div>
              <div className="font-semibold" style={{ color: BRAND_GREEN }}>{importedCount} people imported</div>
              <div className="text-[12px]" style={{ color: "rgba(0,200,195,0.6)" }}>Your org graph is building…</div>
            </div>
          </>
        ) : file ? (
          <>
            <FileText size={28} style={{ color: BRAND_TEAL }} />
            <div>
              <div className="font-medium" style={{ color: "#E8FFFC" }}>{file.name}</div>
              <div className="text-[12px]" style={{ color: "rgba(100,160,155,0.7)" }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </>
        ) : (
          <>
            <Upload size={28} style={{ color: "rgba(0,200,195,0.5)" }} />
            <div>
              <div className="font-medium" style={{ color: "#C0E8E5" }}>Drop your HRIS CSV here</div>
              <div className="text-[12px]" style={{ color: "rgba(100,160,155,0.6)" }}>or click to browse</div>
            </div>
          </>
        )}
      </div>

      {/* Template download */}
      <div className="rounded-lg p-3.5" style={{ background: "rgba(0,180,170,0.05)", border: "1px solid rgba(0,200,195,0.12)" }}>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(0,200,195,0.7)" }}>Required columns</div>
        <code className="block text-[11px] leading-relaxed" style={{ color: "rgba(160,210,205,0.8)" }}>
          name, email, title, role, department, location, capacity_hours
        </code>
        <button
          onClick={() => {
            const blob = new Blob([csvTemplate], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dizrupt-template.csv"; a.click();
          }}
          className="mt-2.5 text-[11px] font-medium underline transition-colors hover:no-underline"
          style={{ color: BRAND_TEAL }}
        >
          Download template CSV
        </button>
      </div>

      {errors.map((e, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg px-3.5 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle size={13} style={{ color: "#F87171", flexShrink: 0 }} />
          <p className="text-[12px]" style={{ color: "#FCA5A5" }}>{e}</p>
        </div>
      ))}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex h-11 items-center gap-2 rounded-lg px-4 text-[13px] font-medium transition-all hover:brightness-110"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(200,240,235,0.7)" }}>
          <ArrowLeft size={14} />
        </button>
        {file && status !== "success" ? (
          <button onClick={runImport} disabled={status === "uploading"}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-bold tracking-wide transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: BRAND_TEAL, color: "#02181A" }}>
            {status === "uploading" ? "Importing…" : "Import people"}
            <Upload size={14} />
          </button>
        ) : (
          <button onClick={onNext}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-bold tracking-wide transition-all hover:brightness-110"
            style={{ background: BRAND_GREEN, color: "#021A0E" }}>
            Continue
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      <button onClick={onNext} className="w-full text-center text-[12px] transition-colors hover:text-white" style={{ color: "rgba(100,160,155,0.6)" }}>
        Skip — I&apos;ll add people manually
      </button>
    </div>
  );
}
