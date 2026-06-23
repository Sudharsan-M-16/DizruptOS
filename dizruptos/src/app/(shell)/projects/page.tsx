"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FolderKanban, Plus, X } from "lucide-react";
import { useOps } from "@/lib/store";
import { PERSONAS, useSession } from "@/lib/session";
import { departmentById, departments, employeeById, employees } from "@/lib/data";
import { useProjects, useCreateProject } from "@/lib/hooks/live";
import {
  CapacityBar,
  EmpAvatar,
  Explain,
  HealthPill,
} from "@/components/ui/primitives";
import { SparkArea } from "@/components/ui/spark";
import { cn, fmtDate, fmtMoney } from "@/lib/utils";

function AddProjectPanel({ onClose }: { onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [ownerId, setOwnerId] = React.useState(employees[0]?.id ?? "");
  const [departmentId, setDepartmentId] = React.useState(departments[0]?.id ?? "");
  const [budget, setBudget] = React.useState(100_000);
  const [targetDate, setTargetDate] = React.useState(
    new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)
  );
  const [customer, setCustomer] = React.useState("");
  const { mutate: createProject, isPending } = useCreateProject();

  const teamMembers = employees.filter((e) => e.role !== "client");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject({
      name: name.trim(),
      description: description.trim() || `${name.trim()} project`,
      ownerId,
      departmentId: departmentId || departments[0]?.id,
      budgetHours: Math.round(budget / 150),
      budgetMicro: budget * 1_000_000,
      targetDate,
      customer: customer.trim() || undefined,
    }, { onSuccess: () => onClose() });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.form
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-t-2xl border border-line bg-ink-surface p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold tracking-tight">New project</h2>
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-ink-elevated text-fg-muted hover:text-fg">
            <X size={13} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label-xs mb-1 block">Project name</label>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Atlas Payments v2" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>

          <div>
            <label className="label-xs mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does this project do?" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block">Owner</label>
              <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
                {teamMembers.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-xs mb-1 block">Department</label>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block">Budget ($)</label>
              <input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="label-xs mb-1 block">Target date</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
          </div>

          <div>
            <label className="label-xs mb-1 block">Customer <span className="text-fg-muted">(optional)</span></label>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Acme Corp" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>

        <button type="submit" disabled={isPending} className="mt-5 w-full rounded-card bg-brand py-2.5 text-sm font-semibold text-ink shadow-[0_0_20px_#00ED8244] transition-opacity hover:opacity-90 disabled:opacity-60">
          {isPending ? "Creating…" : "Create project"}
        </button>
      </motion.form>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const tasks = useOps((s) => s.tasks);
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((pp) => pp.id === personaId) ?? PERSONAS[0];
  const isEmployee = persona.role === "employee" || persona.role === "client";
  const canManageProjects = useSession((s) => s.can("reallocate"));
  const [addingProject, setAddingProject] = React.useState(false);
  const { data: allProjects } = useProjects();

  const onProject = (projectId: string) =>
    tasks.some((t) => t.projectId === projectId && t.assigneeId === persona.id);
  const ordered = isEmployee
    ? [...allProjects].sort((a, b) => Number(onProject(b.id)) - Number(onProject(a.id)))
    : allProjects;

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#0EA5E922", border: "1px solid #0EA5E944" }}>
          <FolderKanban size={15} style={{ color: "#0EA5E9" }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Projects</div>
          <div className="text-[11px] text-fg-muted">{allProjects.length} active projects · portfolio view</div>
        </div>
        {canManageProjects && (
          <button
            onClick={() => setAddingProject(true)}
            className="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-3 py-1.5 text-2xs font-semibold text-brand hover:bg-brand/20 transition-colors"
          >
            <Plus size={11} /> New project
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {ordered.map((p) => {
          const owner = employeeById(p.ownerId);
          const open = tasks.filter(
            (t) => t.projectId === p.id && t.status !== "COMPLETED"
          ).length;
          const blocked = tasks.filter(
            (t) => t.projectId === p.id && t.status === "BLOCKED"
          ).length;
          const burn = p.consumedHours / p.budgetHours;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="panel panel-hover p-5"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-ink-elevated px-2 py-1 font-mono text-xs font-semibold text-brand">
                  {p.code}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-[15px] font-semibold">
                      {p.name}
                    </h3>
                    <HealthPill health={p.health} pulse />
                    {isEmployee && onProject(p.id) && (
                      <span className="rounded-full border border-brand/40 bg-brand-soft px-2 py-px text-2xs font-semibold text-brand">
                        yours
                      </span>
                    )}
                    <Explain title={`${p.name} health`} signals={p.healthReasons} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-fg-secondary">
                    {p.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4 border-t border-line-subtle pt-3.5 text-xs">
                <Stat label="Open tasks" value={`${open}`} sub={blocked ? `${blocked} blocked` : "0 blocked"} subTone={blocked ? "text-danger" : undefined} />
                <Stat label="Budget burn" value={`${Math.round(burn * 100)}%`} sub={`${fmtMoney(p.consumedMicro)} of ${fmtMoney(p.budgetMicro)}`} />
                <Stat label="Target" value={fmtDate(p.targetDate)} sub={departmentById(p.departmentId)?.name ?? ""} />
                <div>
                  <div className="label-xs">Velocity</div>
                  <div className="mt-1 h-8">
                    <SparkArea
                      data={p.velocityTrend}
                      color={p.health === "CRITICAL" ? "#EF4444" : p.health === "ON_TRACK" ? "#10B981" : "#F59E0B"}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <CapacityBar pct={burn * 0.8} className="flex-1" height={5} />
                {owner && (
                  <div className="flex items-center gap-1.5 text-2xs text-fg-muted">
                    <EmpAvatar initials={owner.initials} accent={owner.accent} size={18} />
                    {owner.name}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <AnimatePresence>
        {addingProject && (
          <AddProjectPanel onClose={() => setAddingProject(false)} />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  subTone,
}: {
  label: string;
  value: string;
  sub: string;
  subTone?: string;
}) {
  return (
    <div>
      <div className="label-xs">{label}</div>
      <div className="mt-1.5 font-mono text-[15px] font-semibold text-fg">{value}</div>
      <div className={`mt-0.5 text-2xs ${subTone ?? "text-fg-secondary"}`}>{sub}</div>
    </div>
  );
}
