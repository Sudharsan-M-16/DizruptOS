"use client";

// Goals & OKRs — strategic anchors with traceable execution links.

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Target, X } from "lucide-react";
import { employeeById, employees, goals, projects } from "@/lib/data";
import { useSession } from "@/lib/session";
import { CapacityBar, EmpAvatar, HealthPill } from "@/components/ui/primitives";
import { cn, fmtDate, fmtPct } from "@/lib/utils";
import type { Goal } from "@/lib/types";

function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin guard */ }
}

function AddGoalPanel({ onAdd, onClose }: { onAdd: (g: Goal) => void; onClose: () => void }) {
  const [title, setTitle] = React.useState("");
  const [ownerId, setOwnerId] = React.useState(employees[0]?.id ?? "");
  const [targetDate, setTargetDate] = React.useState(
    new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)
  );
  const [kr1, setKr1] = React.useState("");
  const [kr2, setKr2] = React.useState("");
  const [kr3, setKr3] = React.useState("");

  const teamMembers = employees.filter((e) => e.role !== "client");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const keyResults = [kr1, kr2, kr3]
      .filter((k) => k.trim())
      .map((k) => ({ title: k.trim(), progress: 0 }));
    onAdd({
      id: `goal-${Date.now()}`,
      title: title.trim(),
      ownerId,
      targetDate,
      progress: 0,
      keyResults: keyResults.length > 0 ? keyResults : [{ title: "Define key result", progress: 0 }],
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
          <h2 className="font-display text-base font-semibold">Add OKR</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-fg-muted hover:text-fg"><X size={16} /></button>
        </div>
        <div>
          <label className="label-xs mb-1 block">Objective <span className="text-danger">*</span></label>
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you want to achieve?" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="label-xs mb-1 block">Owner</label>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
            {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-xs mb-1 block">Target date</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div className="space-y-2">
          <label className="label-xs block">Key results <span className="text-fg-muted">(up to 3)</span></label>
          {[{ val: kr1, set: setKr1 }, { val: kr2, set: setKr2 }, { val: kr3, set: setKr3 }].map((item, i) => (
            <input key={i} value={item.val} onChange={(e) => item.set(e.target.value)} placeholder={`KR ${i + 1}…`} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
          ))}
        </div>
        <button type="submit" className="mt-auto w-full rounded-card bg-brand py-2.5 text-sm font-semibold text-ink shadow-[0_0_20px_#00ED8244] transition-opacity hover:opacity-90">
          Add OKR
        </button>
      </motion.form>
    </motion.div>
  );
}

export default function GoalsPage() {
  const [showAdd, setShowAdd] = React.useState(false);
  const [extraGoals, setExtraGoals] = React.useState<Goal[]>([]);
  const canManage = useSession((s) => s.can("reallocate"));

  const allGoals = React.useMemo(() => [...goals, ...extraGoals], [extraGoals]);

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#10B98122", border: "1px solid #10B98144" }}>
          <Target size={15} style={{ color: "#10B981" }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Goals &amp; OKRs</div>
          <div className="text-[11px] text-fg-muted">{allGoals.length} strategic goals · {allGoals.reduce((s, g) => s + g.keyResults.length, 0)} key results tracked</div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#10B981]/40 bg-[#10B981]/10 px-3 py-1.5 text-2xs font-semibold text-[#10B981] hover:bg-[#10B981]/20 transition-colors"
          >
            <Plus size={11} /> Add OKR
          </button>
        )}
      </div>
      {/* content */}
      <div aria-live="polite" aria-atomic="false" className="flex-1 overflow-y-auto p-5">
      {allGoals.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-fg-muted">
          <Target size={32} className="opacity-30" />
          <p className="text-sm">No goals yet — add your first OKR to start tracking strategic progress.</p>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
      {allGoals.map((g) => {
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
      <AnimatePresence>
        {showAdd && (
          <AddGoalPanel
            onAdd={(g) => setExtraGoals((prev) => [...prev, g])}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
