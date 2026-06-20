"use client";

// Risk Register — risks as first-class entities. Probability × impact matrix
// (PRD §28.2 severity law) plus a dense register with signals and mitigation.

import * as React from "react";

function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin guard */ }
}
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { employeeById, projectById, risks, tasks } from "@/lib/data";
import { PERSONAS, useSession } from "@/lib/session";
import { risksForRole } from "@/lib/rbac";
import {
  EmpAvatar,
  Explain,
  SectionHeader,
  SeverityBadge,
} from "@/components/ui/primitives";
import { cn, fmtDate } from "@/lib/utils";
import type { Risk } from "@/lib/types";

import { SEVERITY_MATRIX, severityOf } from "@/lib/risk";

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
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const isEmployee = persona.role === "employee" || persona.role === "client";

  // Dynamic view: employees see the risks that touch them (owned, or on a
  // project they execute) — the full register is a manager instrument.
  const visibleRisks = risksForRole(risks, persona.role, persona.id, (empId, projectId) =>
    projectId ? tasks.some((t) => t.assigneeId === empId && t.projectId === projectId) : false
  );

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#EF444422", border: "1px solid #EF444444" }}>
          <AlertTriangle size={15} style={{ color: "#EF4444" }} />
        </span>
        <div>
          <div className="text-sm font-semibold">Risk Register</div>
          <div className="text-[11px] text-fg-muted">{visibleRisks.length} risks · probability × impact matrix</div>
        </div>
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
                  const cellRisks = risks.filter(
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
    </div>
  );
}
