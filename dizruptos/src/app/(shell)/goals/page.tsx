"use client";

// Goals & OKRs — strategic anchors with traceable execution links.

import { Target } from "lucide-react";
import { employeeById, goals, projects } from "@/lib/data";
import { CapacityBar, EmpAvatar, HealthPill } from "@/components/ui/primitives";
import { cn, fmtDate, fmtPct } from "@/lib/utils";

function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin guard */ }
}

export default function GoalsPage() {
  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#10B98122", border: "1px solid #10B98144" }}>
          <Target size={15} style={{ color: "#10B981" }} />
        </span>
        <div>
          <div className="text-sm font-semibold">Goals &amp; OKRs</div>
          <div className="text-[11px] text-fg-muted">{goals.length} strategic goals · {goals.reduce((s, g) => s + g.keyResults.length, 0)} key results tracked</div>
        </div>
      </div>
      {/* content */}
      <div aria-live="polite" aria-atomic="false" className="flex-1 overflow-y-auto p-5">
      {goals.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-fg-muted">
          <Target size={32} className="opacity-30" />
          <p className="text-sm">No goals yet — add your first OKR to start tracking strategic progress.</p>
        </div>
      )}
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
                    <button
                      key={p.id}
                      onClick={() => launchApp("r-projects")}
                      className="flex items-center gap-2 rounded-lg border border-line bg-ink-elevated px-3 py-2 text-xs text-fg transition-colors hover:border-brand/40"
                    >
                      <span className="font-mono text-brand">{p.code}</span>
                      {p.name}
                      <HealthPill health={p.health} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
      </div>
      </div>
    </div>
  );
}
