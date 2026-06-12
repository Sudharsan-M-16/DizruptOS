"use client";

// Decision Registry — organizational memory. Rationale, alternatives weighed,
// expected vs actual outcome (confidence calibration), lifecycle states.

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GitCommitHorizontal, Scale } from "lucide-react";
import { decisions, employeeById, projectById } from "@/lib/data";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn, fmtDate } from "@/lib/utils";
import type { DecisionStatus } from "@/lib/types";

const statusTone: Record<DecisionStatus, string> = {
  DRAFT: "text-fg-muted bg-ink-elevated",
  PROPOSED: "text-info bg-info-soft",
  APPROVED: "text-brand bg-brand-soft",
  ACTIVE: "text-ok bg-ok-soft",
  SUPERSEDED: "text-fg-muted bg-ink-elevated line-through",
  REVERSED: "text-danger bg-danger-soft",
};

export default function DecisionsPage() {
  const [open, setOpen] = React.useState<string | null>(decisions[0].id);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Timeline spine */}
      <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-line">
        {decisions.map((d) => {
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
                      <h3 className="font-display text-[13px] font-semibold leading-snug">
                        {d.title}
                      </h3>
                      <span className={cn("rounded-full px-2 py-px text-2xs font-semibold", statusTone[d.status])}>
                        {d.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-2xs text-fg-muted">
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
                          <div className="mb-2.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
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
                                <div className="text-[13px] font-semibold text-fg">{o.option}</div>
                                <div className="mt-2 text-xs leading-5 text-ok">+ {o.pros}</div>
                                <div className="mt-1 text-xs leading-5 text-danger">− {o.cons}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-2.5 md:grid-cols-2">
                          <div className="rounded-lg border border-line bg-ink-elevated p-3.5">
                            <div className="text-2xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
                              Expected outcome
                            </div>
                            <p className="mt-1.5 text-[13px] leading-6 text-fg">{d.expectedOutcome}</p>
                          </div>
                          <div
                            className={cn(
                              "rounded-lg border p-3.5",
                              d.actualOutcome ? "border-ok/40 bg-ok-soft/20" : "border-dashed border-line bg-transparent"
                            )}
                          >
                            <div
                              className={cn(
                                "text-2xs font-semibold uppercase tracking-[0.12em]",
                                d.actualOutcome ? "text-ok" : "text-fg-secondary"
                              )}
                            >
                              Actual outcome — calibration
                            </div>
                            <p className="mt-1.5 text-[13px] leading-6 text-fg">
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
      <p className="mt-6 text-center text-2xs text-fg-muted">
        Decisions are first-class entities. When people leave, the rationale stays.
      </p>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
        {label}
      </div>
      <p className="max-w-2xl text-[13px] leading-6 text-fg">{children}</p>
    </div>
  );
}
