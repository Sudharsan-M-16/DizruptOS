"use client";

// Decision Registry — organizational memory. Rationale, alternatives weighed,
// expected vs actual outcome (confidence calibration), lifecycle states.

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GitCommitHorizontal, Plus, Scale, X } from "lucide-react";
import { decisions, employeeById, employees, projectById, projects } from "@/lib/data";
import { EmpAvatar } from "@/components/ui/primitives";
import { useSession } from "@/lib/session";
import { cn, fmtDate } from "@/lib/utils";
import type { Decision, DecisionStatus } from "@/lib/types";

function AddDecisionPanel({ onAdd, onClose }: { onAdd: (d: Decision) => void; onClose: () => void }) {
  const [title, setTitle] = React.useState("");
  const [context, setContext] = React.useState("");
  const [chosenOption, setChosenOption] = React.useState("");
  const [rationale, setRationale] = React.useState("");
  const [confidence, setConfidence] = React.useState<"low" | "medium" | "high">("medium");
  const [ownerId, setOwnerId] = React.useState(employees[0]?.id ?? "");
  const [projectId, setProjectId] = React.useState("");

  const teamMembers = employees.filter((e) => e.role !== "client");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !chosenOption.trim()) return;
    onAdd({
      id: `dec-${Date.now()}`,
      title: title.trim(),
      context: context.trim() || "No context provided.",
      chosenOption: chosenOption.trim(),
      rationale: rationale.trim() || "No rationale captured.",
      optionsConsidered: [],
      confidence,
      ownerId,
      projectId: projectId || undefined,
      status: "DRAFT",
      decidedAt: new Date().toISOString(),
      expectedOutcome: "To be defined.",
      linkedRiskIds: [],
    });
    onClose();
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
          <h2 className="font-display text-base font-semibold">Record Decision</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-fg-muted hover:text-fg"><X size={16} /></button>
        </div>
        <div>
          <label className="label-xs mb-1 block">Decision title <span className="text-danger">*</span></label>
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What was decided?" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="label-xs mb-1 block">Chosen option <span className="text-danger">*</span></label>
          <input required value={chosenOption} onChange={(e) => setChosenOption(e.target.value)} placeholder="The option that was selected" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="label-xs mb-1 block">Context <span className="text-fg-muted">(optional)</span></label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} placeholder="Background and constraints…" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand resize-none" />
        </div>
        <div>
          <label className="label-xs mb-1 block">Rationale <span className="text-fg-muted">(optional)</span></label>
          <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={2} placeholder="Why this option over others?" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand resize-none" />
        </div>
        <div>
          <label className="label-xs mb-1 block">Confidence</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["low", "medium", "high"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setConfidence(c)}
                className={cn("rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors", confidence === c ? "border-brand/60 bg-brand-soft text-brand" : "border-line bg-ink-elevated text-fg-muted hover:border-line-strong")}
              >{c}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
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
        </div>
        <button type="submit" className="mt-auto w-full rounded-card bg-brand py-2.5 text-sm font-semibold text-ink shadow-[0_0_20px_#00ED8244] transition-opacity hover:opacity-90">
          Record decision
        </button>
      </motion.form>
    </motion.div>
  );
}

const statusTone: Record<DecisionStatus, string> = {
  DRAFT: "text-fg-muted bg-ink-elevated",
  PROPOSED: "text-info bg-info-soft",
  APPROVED: "text-brand bg-brand-soft",
  ACTIVE: "text-ok bg-ok-soft",
  SUPERSEDED: "text-fg-muted bg-ink-elevated line-through",
  REVERSED: "text-danger bg-danger-soft",
};

export default function DecisionsPage() {
  const [open, setOpen] = React.useState<string | null>(decisions[0]?.id ?? null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [extraDecisions, setExtraDecisions] = React.useState<Decision[]>([]);
  const canRecord = useSession((s) => s.can("reallocate"));

  const allDecisions = React.useMemo(() => [...decisions, ...extraDecisions], [extraDecisions]);

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#C084FC22", border: "1px solid #C084FC44" }}>
          <Scale size={15} style={{ color: "#C084FC" }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Decision Registry</div>
          <div className="text-[11px] text-fg-muted">{allDecisions.length} decisions · organizational memory</div>
        </div>
        {canRecord && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#C084FC]/40 bg-[#C084FC]/10 px-3 py-1.5 text-2xs font-semibold text-[#C084FC] hover:bg-[#C084FC]/20 transition-colors"
          >
            <Plus size={11} /> Record decision
          </button>
        )}
      </div>
      {allDecisions.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-fg-muted">
          <Scale size={32} className="opacity-30" />
          <p className="text-sm">No decisions recorded yet.</p>
        </div>
      )}
      <div aria-live="polite" aria-atomic="false" className="flex-1 overflow-y-auto p-5">
      <div className="mx-auto max-w-3xl">
      {/* Timeline spine */}
      <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-line">
        {allDecisions.map((d) => {
          const owner = employeeById(d.ownerId);
          const proj = projectById(d.projectId);
          const expanded = open === d.id;
          return (
            <article key={d.id} className="relative pl-10">
              <span
                className={cn(
                  "absolute left-[9px] top-5 h-3.5 w-3.5 rounded-full border-2 border-ink",
                  d.status === "ACTIVE" ? "bg-ok" : d.status === "REVERSED" ? "bg-danger" : d.status === "SUPERSEDED" ? "bg-fg-faint" : "bg-brand"
                )}
              />
              <div className={cn("panel overflow-hidden transition-all", expanded && "border-brand/40")}>
                <button
                  onClick={() => setOpen(expanded ? null : d.id)}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  <GitCommitHorizontal size={15} className="mt-0.5 shrink-0 text-brand-secondary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-semibold leading-snug">
                        {d.title}
                      </h3>
                      <span className={cn("rounded-full px-2 py-px text-xs font-semibold", statusTone[d.status])}>
                        {d.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-fg-muted">
                      <span>{fmtDate(d.decidedAt)}</span>
                      {proj && <span className="font-mono text-brand">{proj.code}</span>}
                      {owner && (
                        <span className="flex items-center gap-1">
                          <EmpAvatar initials={owner.initials} accent={owner.accent} size={16} />
                          {owner.name}
                        </span>
                      )}
                      <span className="rounded-full border border-line bg-ink-elevated px-2 py-px">
                        confidence: {d.confidence}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={14}
                    className={cn("mt-1 shrink-0 text-fg-muted transition-transform", expanded && "rotate-180")}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Expanded record — sized to be READ, not decoded:
                          13px body on near-white, labels above perception floor */}
                      <div className="space-y-5 border-t border-line-subtle px-5 py-5">
                        <Block label="Context">{d.context}</Block>
                        <Block label="Chosen — rationale">
                          <span className="font-semibold text-fg">{d.chosenOption}.</span>{" "}
                          {d.rationale}
                        </Block>

                        <div>
                          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
                            <Scale size={12} /> Options considered
                          </div>
                          <div className="grid gap-2.5 md:grid-cols-2">
                            {d.optionsConsidered.map((o) => (
                              <div
                                key={o.option}
                                className={cn(
                                  "rounded-lg border p-3.5",
                                  o.option === d.chosenOption
                                    ? "border-ok/40 bg-ok-soft/30"
                                    : "border-line bg-ink-elevated"
                                )}
                              >
                                <div className="text-sm font-semibold text-fg">{o.option}</div>
                                <div className="mt-2 text-xs leading-5 text-ok">+ {o.pros}</div>
                                <div className="mt-1 text-xs leading-5 text-danger">− {o.cons}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-2.5 md:grid-cols-2">
                          <div className="rounded-lg border border-line bg-ink-elevated p-3.5">
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
                              Expected outcome
                            </div>
                            <p className="mt-1.5 text-sm leading-6 text-fg">{d.expectedOutcome}</p>
                          </div>
                          <div
                            className={cn(
                              "rounded-lg border p-3.5",
                              d.actualOutcome ? "border-ok/40 bg-ok-soft/20" : "border-dashed border-line bg-transparent"
                            )}
                          >
                            <div
                              className={cn(
                                "text-xs font-semibold uppercase tracking-[0.12em]",
                                d.actualOutcome ? "text-ok" : "text-fg-secondary"
                              )}
                            >
                              Actual outcome — calibration
                            </div>
                            <p className="mt-1.5 text-sm leading-6 text-fg">
                              {d.actualOutcome ?? "Not yet recorded — review scheduled."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-fg-muted">
        Decisions are first-class entities. When people leave, the rationale stays.
      </p>
      </div>
      </div>
      <AnimatePresence>
        {showAdd && (
          <AddDecisionPanel
            onAdd={(d) => setExtraDecisions((prev) => [...prev, d])}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
        {label}
      </div>
      <p className="max-w-2xl text-sm leading-6 text-fg">{children}</p>
    </div>
  );
}
