"use client";

// Risk Register — risks as first-class entities. Probability × impact matrix
// (PRD §28.2 severity law) plus a dense register with signals and mitigation.

import * as React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { employeeById, projectById, risks } from "@/lib/data";
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

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      {/* Matrix */}
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
                            "flex h-6 w-6 items-center justify-center rounded-md border text-2xs font-bold transition-transform hover:scale-110",
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
          <div className="mt-3 flex items-center gap-2 text-2xs text-fg-muted">
            <ShieldAlert size={11} />
            Probability rows × impact columns. Click a marker to highlight it in the register.
          </div>
        </div>
      </section>

      {/* Register */}
      <section className="xl:col-span-3">
        <SectionHeader
          title={`Register — ${risks.length} risks`}
          hint="Each risk carries owner, mitigation, and the signals that raised it."
        />
        <div className="space-y-3">
          {risks.map((r) => {
            const owner = employeeById(r.ownerId);
            const proj = projectById(r.projectId);
            const sev = severityOf(r);
            return (
              <article
                key={r.id}
                className={cn(
                  "panel p-4 transition-all",
                  selected === r.id && "border-brand/60 shadow-glow"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-2xs text-fg-faint">#{r.id.replace("r-", "")}</span>
                  <h3 className="text-xs font-semibold">{r.title}</h3>
                  <SeverityBadge severity={sev} />
                  <span className={cn("rounded-full px-2 py-px text-2xs font-semibold", statusTone[r.status])}>
                    {r.status.toLowerCase()}
                  </span>
                  <span className="rounded-full border border-line bg-ink-elevated px-2 py-px text-2xs text-fg-muted">
                    {r.category}
                  </span>
                  <Explain title="Signals that raised this risk" signals={r.signals} />
                  <span className="ml-auto text-2xs text-fg-faint">opened {fmtDate(r.createdAt)}</span>
                </div>
                <div className="mt-3 grid gap-3 border-t border-line-subtle pt-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="label-xs mb-1">Mitigation · {r.mitigationStatus.replace("_", " ")}</div>
                    <p className="text-2xs leading-relaxed text-fg-secondary">{r.mitigationPlan}</p>
                  </div>
                  <div className="flex items-start gap-4">
                    {proj && (
                      <Link href={`/projects/${proj.id}`} className="text-2xs text-fg-muted hover:text-brand">
                        <div className="label-xs">Project</div>
                        <div className="mt-1 font-mono">{proj.code}</div>
                      </Link>
                    )}
                    {owner && (
                      <Link href={`/people/${owner.id}`} className="flex items-center gap-2 text-2xs text-fg-secondary hover:text-brand">
                        <EmpAvatar initials={owner.initials} accent={owner.accent} size={22} />
                        <div>
                          <div className="label-xs">Owner</div>
                          <div className="mt-0.5">{owner.name.split(" ")[0]}</div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
