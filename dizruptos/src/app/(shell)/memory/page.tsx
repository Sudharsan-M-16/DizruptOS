"use client";

// Organizational Memory — the institution's recall surface. For every decision
// it answers the six questions that survive the people who made it:
//   Why? · What evidence? · What assumptions? · What happened? · What did we
//   learn? · Would we decide it again?
// Built on the decision-memory + lineage (0011) engines: reasoning made
// first-class and falsifiable (assumptions can be marked violated; hypotheses
// confirmed/refuted).

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/primitives";
import {
  useMemory,
  type MemoryDecision,
  type AssumptionStatus,
  type HypothesisStatus,
} from "@/lib/hooks/use-executive";
import { ChevronDown, CheckCircle2, XCircle, HelpCircle, GitBranch, BookOpen, BrainCircuit, Boxes, ScrollText, TrendingUp } from "lucide-react";
import DecisionsPage from "../decisions/page";
import CapabilitiesPage from "../capabilities/page";
import LearningPage from "../learning/page";

// Org Memory — the merged "Intelligence" area. One app, four tabs: the memory
// recall surface, the Decision log, the Capabilities/succession map, and the
// Learning loop. (These used to be four separate dock apps.)
type MemTab = "memory" | "decisions" | "capabilities" | "learnings";
const MEM_TABS: { id: MemTab; label: string; icon: React.ElementType }[] = [
  { id: "memory", label: "Memory", icon: BrainCircuit },
  { id: "decisions", label: "Decisions", icon: ScrollText },
  { id: "capabilities", label: "Capabilities", icon: Boxes },
  { id: "learnings", label: "Learnings", icon: TrendingUp },
];

export default function OrgMemoryPage() {
  const [tab, setTab] = useState<MemTab>("memory");
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-line bg-ink-elevated/50 px-3 py-1.5 shrink-0">
        {MEM_TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", active ? "bg-ink-elevated text-fg" : "text-fg-muted hover:text-fg")}
              style={active ? { boxShadow: "inset 0 -2px 0 var(--os-accent,#C084FC)" } : undefined}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tab === "memory" && <MemoryTab />}
        {tab === "decisions" && <DecisionsPage />}
        {tab === "capabilities" && <CapabilitiesPage />}
        {tab === "learnings" && <LearningPage />}
      </div>
    </div>
  );
}

const repeatMeta: Record<string, { label: string; tone: string }> = {
  yes: { label: "Would decide again", tone: "text-ok bg-ok-soft border-ok/40" },
  yes_with_changes: { label: "Repeat with changes", tone: "text-warn bg-warn-soft border-warn/40" },
  no: { label: "Would not repeat", tone: "text-danger bg-danger-soft border-danger/40" },
  too_early: { label: "Too early to say", tone: "text-fg-muted bg-ink-elevated border-line" },
};
const riskTone: Record<string, string> = {
  critical: "text-danger", high: "text-warn", medium: "text-info", low: "text-ok",
};
const assumptionIcon: Record<AssumptionStatus, { icon: React.ElementType; tone: string }> = {
  holds: { icon: CheckCircle2, tone: "text-ok" },
  violated: { icon: XCircle, tone: "text-danger" },
  unknown: { icon: HelpCircle, tone: "text-fg-muted" },
};
const hypoTone: Record<HypothesisStatus, string> = {
  confirmed: "text-ok", refuted: "text-danger", open: "text-fg-muted",
};

function MemoryTab() {
  const memory = useMemory();
  const [open, setOpen] = useState<string | null>(null);

  if (memory.isLoading)
    return (
      <div className="space-y-4">
        <div className="panel h-20 animate-pulse" />
        {[0, 1, 2].map((i) => <div key={i} className="panel h-28 animate-pulse" />)}
      </div>
    );

  if (memory.isError)
    return (
      <div className="panel flex flex-col items-start gap-3 p-8">
        <div className="text-lg font-semibold text-danger">Couldn&apos;t open organizational memory</div>
        <p className="text-sm text-fg-muted">{(memory.error as Error)?.message}</p>
        <button onClick={() => memory.refetch()} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-[#04281A]">Retry</button>
      </div>
    );

  const decisions = memory.data?.decisions ?? [];
  const gov = memory.data?.governance;

  return (
    <div className="space-y-6">
      {/* Governance strip */}
      {gov && (
        <section className="panel flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-brand" />
            <span className="font-display text-lg font-bold tracking-tight">Institutional memory</span>
          </div>
          <div className="ml-auto flex gap-6 text-sm">
            <span className="text-fg-muted">{decisions.length} decisions on record</span>
            <span className="text-fg-muted">·</span>
            <span className="text-fg-muted">{gov.approved} approved / {gov.pending} pending</span>
            {gov.busiestApprover && (
              <>
                <span className="text-fg-muted">·</span>
                <span className="text-fg-muted">
                  {Math.round(gov.ownershipConcentration * 100)}% decided by {gov.busiestApprover}
                </span>
              </>
            )}
          </div>
        </section>
      )}

      <SectionHeader title="Decisions" hint="Why we decided · what we assumed · what happened · what we learned." />

      {decisions.length === 0 && (
        <div className="panel p-6 text-fg-muted">No decisions recorded yet — the organizational memory is empty.</div>
      )}

      <div className="space-y-3">
        {decisions.map((d) => (
          <MemoryCard key={d.memory.decisionId} d={d} open={open === d.memory.decisionId} onToggle={() => setOpen(open === d.memory.decisionId ? null : d.memory.decisionId)} />
        ))}
      </div>
    </div>
  );
}

function MemoryCard({ d, open, onToggle }: { d: MemoryDecision; open: boolean; onToggle: () => void }) {
  const m = d.memory;
  const a = d.analysis;
  const repeat = repeatMeta[m.repeatRecommendation] ?? repeatMeta.too_early;

  return (
    <div className="panel overflow-hidden">
      {/* Header row — always visible */}
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-ink-elevated/40">
        <span className="font-display text-lg font-bold tracking-tight">{m.title}</span>
        <span className={cn("rounded-md border px-2 py-0.5 text-2xs font-semibold uppercase", repeat.tone)}>{repeat.label}</span>
        {m.violatedAssumptions.length > 0 && (
          <span className="rounded-md border border-danger/40 bg-danger-soft px-2 py-0.5 text-2xs font-semibold text-danger">
            assumption broken
          </span>
        )}
        <span className={cn("ml-auto font-mono text-xs uppercase", riskTone[a.risk])}>{a.risk} risk</span>
        <ChevronDown size={18} className={cn("shrink-0 text-fg-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-line-subtle p-5">
          {/* Why */}
          <Block label="Why we decided this">
            <p className="text-base leading-7 text-fg-secondary">{m.why}</p>
          </Block>

          {/* Evidence */}
          {m.evidence.length > 0 && (
            <Block label="What evidence existed">
              <ul className="space-y-1.5">
                {m.evidence.map((e) => (
                  <li key={e} className="flex items-start gap-2.5 text-sm text-fg-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-info/70" /> {e}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {/* Assumptions */}
          {m.assumptions.length > 0 && (
            <Block label="What assumptions we made">
              <ul className="space-y-2">
                {m.assumptions.map((as) => {
                  const ic = assumptionIcon[as.status];
                  const Icon = ic.icon;
                  return (
                    <li key={as.statement} className="flex items-start gap-2.5">
                      <Icon size={16} className={cn("mt-0.5 shrink-0", ic.tone)} />
                      <div>
                        <span className="text-sm text-fg-secondary">{as.statement}</span>
                        <span className={cn("ml-2 text-2xs font-semibold uppercase", ic.tone)}>{as.status}</span>
                        <span className="ml-1.5 text-2xs text-fg-muted">· {as.criticality}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Block>
          )}

          {/* Hypotheses */}
          {m.hypotheses.length > 0 && (
            <Block label="What we predicted">
              <ul className="space-y-1.5">
                {m.hypotheses.map((h) => (
                  <li key={h.statement} className="flex items-start gap-2.5 text-sm text-fg-secondary">
                    <span className={cn("mt-0.5 font-mono text-2xs font-bold uppercase", hypoTone[h.status])}>[{h.status}]</span>
                    <span>{h.statement}{h.confidence != null && <span className="text-fg-muted"> · {Math.round(h.confidence * 100)}% confidence</span>}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {/* What happened */}
          <Block label="What happened afterward">
            <ul className="space-y-1.5">
              {m.whatHappened.map((w, i) => (
                <li key={i} className="text-sm text-fg-secondary">
                  <span className="font-semibold capitalize text-fg">{w.status}</span> — {w.detail}
                </li>
              ))}
            </ul>
          </Block>

          {/* Learned */}
          {m.learned.length > 0 && (
            <Block label="What we learned">
              <ul className="space-y-1.5">
                {m.learned.map((l) => (
                  <li key={l} className="flex items-start gap-2.5 text-sm text-fg-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ok/70" /> {l}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {/* Lineage chain */}
          <Block label="Lineage">
            <div className="rounded-lg border border-line-subtle bg-ink-elevated/40 p-3 font-mono text-xs leading-6 text-fg-muted">
              {m.lineage.map((line, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {i === 0 && <GitBranch size={12} className="text-brand" />}
                  <span className={i === 0 ? "text-fg-secondary" : ""}>{line}</span>
                </div>
              ))}
            </div>
          </Block>

          {/* Verdict */}
          <div className={cn("rounded-lg border p-3 text-sm", repeat.tone)}>
            <span className="font-semibold">Would we decide this again? </span>
            {m.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-xs mb-2">{label}</div>
      {children}
    </div>
  );
}
