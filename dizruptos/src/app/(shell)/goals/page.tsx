"use client";

// Goals & OKRs — strategic anchors with traceable execution links.

import Link from "next/link";
import { Target } from "lucide-react";
import { employeeById, goals, projects } from "@/lib/data";
import { CapacityBar, EmpAvatar, HealthPill } from "@/components/ui/primitives";
import { cn, fmtDate, fmtPct } from "@/lib/utils";

export default function GoalsPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {goals.map((g) => {
        const owner = employeeById(g.ownerId);
        const linked = projects.filter((p) => p.goalId === g.id);
        return (
          <article key={g.id} className="panel p-5">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-brand-soft p-2 text-brand">
                <Target size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[15px] font-semibold leading-snug">{g.title}</h3>
                <div className="mt-1.5 flex items-center gap-2.5 text-xs text-fg-secondary">
                  <span>target {fmtDate(g.targetDate)}</span>
                  {owner && (
                    <span className="flex items-center gap-1">
                      <EmpAvatar initials={owner.initials} accent={owner.accent} size={16} />
                      {owner.name}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "font-mono text-lg font-bold",
                  g.progress >= 0.6 ? "text-ok" : g.progress >= 0.4 ? "text-warn" : "text-danger"
                )}
              >
                {fmtPct(g.progress)}
              </span>
            </div>

            <CapacityBar pct={g.progress * 0.79} className="mt-4" />

            <div className="mt-4 space-y-2.5">
              {g.keyResults.map((kr) => (
                <div key={kr.title} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-5 text-fg">{kr.title}</span>
                  <CapacityBar pct={kr.progress * 0.79} className="w-28" height={5} />
                  <span className="w-10 text-right font-mono text-xs text-fg-secondary">{fmtPct(kr.progress)}</span>
                </div>
              ))}
            </div>

            {linked.length > 0 && (
              <div className="mt-4 border-t border-line-subtle pt-3">
                <div className="label-xs mb-2">Executing projects</div>
                <div className="flex flex-wrap gap-2">
                  {linked.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center gap-2 rounded-lg border border-line bg-ink-elevated px-3 py-2 text-xs text-fg transition-colors hover:border-brand/40"
                    >
                      <span className="font-mono text-brand">{p.code}</span>
                      {p.name}
                      <HealthPill health={p.health} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
