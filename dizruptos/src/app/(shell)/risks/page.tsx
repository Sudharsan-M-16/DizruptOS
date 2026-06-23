"use client";

// Risk Register — risks as first-class entities. Probability × impact matrix
// (PRD §28.2 severity law) plus a dense register with signals and mitigation.

import * as React from "react";

function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin guard */ }
}
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Plus, ShieldAlert, X } from "lucide-react";
import { employeeById, employees, projectById, projects, tasks } from "@/lib/data";
import { PERSONAS, useSession } from "@/lib/session";
import { useRisks, useCreateRisk } from "@/lib/hooks/live";
import { risksForRole } from "@/lib/rbac";
import {
  EmpAvatar,
  Explain,
  SectionHeader,
  SeverityBadge,
} from "@/components/ui/primitives";
import { cn, fmtDate } from "@/lib/utils";
import type { Risk, RiskImpact, RiskProbability } from "@/lib/types";

import { SEVERITY_MATRIX, severityOf } from "@/lib/risk";

const CATEGORIES = ["operational", "vendor", "security", "compliance", "financial", "people"] as const;
const PROBS = ["low", "medium", "high"] as const;
const IMPACTS = ["low", "medium", "high", "critical"] as const;

function AddRiskPanel({ onClose }: { onClose: () => void }) {
  const { mutate: createRisk, isPending } = useCreateRisk();
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<Risk["category"]>("operational");
  const [probability, setProbability] = React.useState<RiskProbability>("medium");
  const [impact, setImpact] = React.useState<RiskImpact>("medium");
  const [ownerId, setOwnerId] = React.useState(employees[0]?.id ?? "");
  const [projectId, setProjectId] = React.useState("");
  const [mitigation, setMitigation] = React.useState("");

  const teamMembers = employees.filter((e) => e.role !== "client");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createRisk({
      title: title.trim(),
      category,
      probability,
      impact,
      ownerId,
      projectId: projectId || undefined,
      mitigationPlan: mitigation.trim() || "Under assessment",
    }, { onSuccess: () => onClose() });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.form
        onSubmit={submit}
        initial={{ x: 64, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 64, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto border-l border-line bg-ink p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Log Risk</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-fg-muted hover:text-fg"><X size={16} /></button>
        </div>
        <div>
          <label className="label-xs mb-1 block">Title <span className="text-danger">*</span></label>
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Describe the risk…" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-danger/60" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-xs mb-1 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Risk["category"])} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs mb-1 block">Probability</label>
            <select value={probability} onChange={(e) => setProbability(e.target.value as RiskProbability)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
              {PROBS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label-xs mb-1 block">Impact</label>
          <div className="grid grid-cols-4 gap-1.5">
            {IMPACTS.map((imp) => (
              <button key={imp} type="button" onClick={() => setImpact(imp)}
                className={cn("rounded-lg border py-1.5 text-xs font-medium transition-colors capitalize", impact === imp ? "border-danger/60 bg-danger-soft text-danger" : "border-line bg-ink-elevated text-fg-muted hover:border-line-strong")}
              >{imp}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label-xs mb-1 block">Owner</label>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
            {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-xs mb-1 block">Project <span className="text-fg-muted">(optional)</span></label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="">— no project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-xs mb-1 block">Mitigation plan <span className="text-fg-muted">(optional)</span></label>
          <textarea value={mitigation} onChange={(e) => setMitigation(e.target.value)} rows={3} placeholder="How will this risk be mitigated?" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand resize-none" />
        </div>
        <button type="submit" disabled={isPending} className="mt-auto w-full rounded-card bg-danger py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_#EF444433] transition-opacity hover:opacity-90 disabled:opacity-60">
          {isPending ? "Logging…" : "Log risk"}
        </button>
      </motion.form>
    </motion.div>
  );
}

const PROB = ["high", "medium", "low"] as const;
const IMPACT = ["low", "medium", "high", "critical"] as const;

const cellTone = (sev: string) =>
  sev === "Critical"
    ? "bg-danger-soft border-danger/30"
    : sev === "High"
      ? "bg-warn-soft border-warn/30"
      : sev === "Medium"
        ? "bg-info-soft border-info/25"
        : "bg-ink-elevated border-line-subtle";

const statusTone: Record<Risk["status"], string> = {
  OPEN: "text-warn bg-warn-soft",
  MITIGATING: "text-info bg-info-soft",
  MONITORING: "text-brand bg-brand-soft",
  ACCEPTED: "text-fg-muted bg-ink-elevated",
  ESCALATED: "text-danger bg-danger-soft",
  CLOSED: "text-ok bg-ok-soft",
};

export default function RisksPage() {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const personaId = useSession((s) => s.personaId);
  const canLog = useSession((s) => s.can("reallocate"));
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const isEmployee = persona.role === "employee" || persona.role === "client";
  const { data: liveRisks } = useRisks();

  // Dynamic view: employees see the risks that touch them (owned, or on a
  // project they execute) — the full register is a manager instrument.
  const visibleRisks = risksForRole(liveRisks, persona.role, persona.id, (empId, projectId) =>
    projectId ? tasks.some((t) => t.assigneeId === empId && t.projectId === projectId) : false
  );

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#EF444422", border: "1px solid #EF444444" }}>
          <AlertTriangle size={15} style={{ color: "#EF4444" }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Risk Register</div>
          <div className="text-[11px] text-fg-muted">{visibleRisks.length} risks · probability × impact matrix</div>
        </div>
        {canLog && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger-soft px-3 py-1.5 text-2xs font-semibold text-danger hover:bg-danger/20 transition-colors"
          >
            <Plus size={11} /> Log risk
          </button>
        )}
      </div>
      <div aria-live="polite" aria-atomic="false" className="flex-1 overflow-y-auto p-5">
      <div className="grid gap-6 xl:grid-cols-5">
      {/* Matrix — manager instrument; employees go straight to their risks */}
      {!isEmployee && (
      <section className="xl:col-span-2">
        <SectionHeader
          title="Severity matrix"
          hint="Severity auto-computed from probability × impact — never set by hand."
        />
        <div className="panel p-4">
          <div className="grid grid-cols-[64px_repeat(4,1fr)] gap-1.5">
            <div />
            {IMPACT.map((i) => (
              <div key={i} className="label-xs pb-1 text-center">{i}</div>
            ))}
            {PROB.map((p) => (
              <React.Fragment key={p}>
                <div className="label-xs flex items-center">{p}</div>
                {IMPACT.map((i) => {
                  const cellRisks = visibleRisks.filter(
                    (r) => r.probability === p && r.impact === i
                  );
                  const sev = SEVERITY_MATRIX[p][i];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex min-h-14 flex-wrap content-start gap-1 rounded-lg border p-1.5",
                        cellTone(sev)
                      )}
                    >
                      {cellRisks.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setSelected(r.id)}
                          title={r.title}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold transition-transform hover:scale-110",
                            selected === r.id
                              ? "border-fg bg-ink text-fg"
                              : "border-line bg-ink-surface text-fg-secondary"
                          )}
                        >
                          {r.id.replace("r-", "")}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
            <ShieldAlert size={11} />
            Probability rows × impact columns. Click a marker to highlight it in the register.
          </div>
        </div>
      </section>
      )}

      {/* Register */}
      <section className={isEmployee ? "xl:col-span-5 mx-auto w-full max-w-3xl" : "xl:col-span-3"}>
        <SectionHeader
          title={
            isEmployee
              ? `Risks that touch your work — ${visibleRisks.length}`
              : `Register — ${visibleRisks.length} risks`
          }
          hint={
            isEmployee
              ? "Risks you own or that sit on a project you execute. The full register is a manager view."
              : "Each risk carries owner, mitigation, and the signals that raised it."
          }
        />
        <div className="space-y-4">
          {visibleRisks.map((r) => {
            const owner = employeeById(r.ownerId);
            const proj = projectById(r.projectId);
            const sev = severityOf(r);
            return (
              <article
                key={r.id}
                className={cn(
                  "panel p-5 transition-all",
                  selected === r.id && "border-brand/60 shadow-glow"
                )}
              >
                {/* line 1: identity — title carries the row, badges follow */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <span className="font-mono text-xs text-fg-faint">#{r.id.replace("r-", "")}</span>
                  <h3 className="text-sm font-semibold tracking-tight">{r.title}</h3>
                  <Explain title="Signals that raised this risk" signals={r.signals} />
                  <span className="ml-auto text-xs text-fg-muted">opened {fmtDate(r.createdAt)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={sev} />
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusTone[r.status])}>
                    {r.status.toLowerCase()}
                  </span>
                  <span className="rounded-full border border-line bg-ink-elevated px-2.5 py-0.5 text-xs capitalize text-fg-secondary">
                    {r.category}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 border-t border-line-subtle pt-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="label-xs mb-1.5">
                      Mitigation ·{" "}
                      <span
                        className={cn(
                          r.mitigationStatus === "complete"
                            ? "text-ok"
                            : r.mitigationStatus === "in_progress"
                              ? "text-info"
                              : "text-warn"
                        )}
                      >
                        {r.mitigationStatus.replace("_", " ")}
                      </span>
                    </div>
                    <p className="max-w-xl text-xs leading-6 text-fg-secondary">{r.mitigationPlan}</p>
                  </div>
                  <div className="flex items-start gap-5">
                    {proj && (
                      <button onClick={() => launchApp("r-projects")} className="text-xs text-fg-muted transition-colors hover:text-brand">
                        <div className="label-xs">Project</div>
                        <div className="mt-1 font-mono text-xs">{proj.code}</div>
                      </button>
                    )}
                    {owner && (
                      <button onClick={() => launchApp("directory")} className="flex items-center gap-2.5 text-xs text-fg-secondary transition-colors hover:text-brand">
                        <EmpAvatar initials={owner.initials} accent={owner.accent} size={26} />
                        <div>
                          <div className="label-xs">Owner</div>
                          <div className="mt-0.5 text-xs">{owner.name.split(" ")[0]}</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      </div>
      </div>
      <AnimatePresence>
        {showAdd && <AddRiskPanel onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
