"use client";

// Project Matrix — the DizruptOS work board. A high-density, readable Kanban
// grouped by status with fluid drag-and-drop (@hello-pangea/dnd) across columns.
// Cards carry priority, assignee, hours, subtask progress and labels. Light- and
// dark-mode native (token surfaces only).
//
// State: tasks are read LIVE from the ops store; a drop calls the stable
// `moveTask(taskId, sourceCol, destCol, newIndex)` mutation — the one seam a
// distributed/CRDT backend replaces. The board itself stays pure.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Circle, Clock, Filter, ListChecks, Plus, Sparkles, X } from "lucide-react";
import { WEEKS, employees, projects } from "@/lib/data";
import { TaskSuggestionsPanel } from "@/components/desktop/task-suggestions-panel";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const COLUMNS: { id: TaskStatus; label: string; tone: string }[] = [
  { id: "BACKLOG", label: "Backlog", tone: "#8A8F98" },
  { id: "TO_DO", label: "To Do", tone: "#38BDF8" },
  { id: "IN_PROGRESS", label: "In Progress", tone: "#F59E0B" },
  { id: "BLOCKED", label: "Blocked", tone: "#EF4444" },
  { id: "REVIEW", label: "In Review", tone: "#7C6CFF" },
  { id: "CLIENT_REVIEW", label: "Client Review", tone: "#2BD9FF" },
  { id: "COMPLETED", label: "Done", tone: "#10B981" },
];

const PRIORITY: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-danger/15 text-danger" },
  HIGH: { label: "High", cls: "bg-warn/15 text-warn" },
  MEDIUM: { label: "Medium", cls: "bg-info/15 text-info" },
  LOW: { label: "Low", cls: "bg-fg-muted/15 text-fg-muted" },
};

function AddTaskQuick({ defaultProjectId, onClose }: { defaultProjectId?: string; onClose: () => void }) {
  const addTask = useOps((s) => s.addTask);
  const personaId = useSession((s) => s.personaId);
  const canAssignOthers = useSession((s) => s.can("reallocate"));
  const [title, setTitle] = useState("");
  const [projId, setProjId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState(canAssignOthers ? "" : personaId);
  const [hours, setHours] = useState(4);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");

  const teamMembers = employees.filter((e) => e.role !== "client");
  const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), projectId: projId, assigneeId: assigneeId || teamMembers[0]?.id, estimatedHours: hours, dueDate, priority, status: "TO_DO", weekStart: WEEKS[0] });
    onClose();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <motion.form initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-md rounded-t-2xl border border-line bg-ink-surface p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">New task</h2>
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-ink-elevated text-fg-muted hover:text-fg"><X size={13} /></button>
        </div>
        <div className="space-y-3">
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
          <select required value={projId} onChange={(e) => setProjId(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
            {projects.filter((p) => p.status === "ACTIVE").map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </select>
          {canAssignOthers && (
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand">
              <option value="">Unassigned</option>
              {teamMembers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
            <input type="number" min={0} max={200} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} placeholder="Hours" className="rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {PRIORITIES.map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={cn("rounded-card border py-1 text-xs font-medium transition-colors", priority === p ? "border-brand bg-brand/10 text-brand" : "border-line text-fg-muted hover:border-line-strong")}>
                {p[0] + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="mt-4 w-full rounded-card bg-brand py-2.5 text-sm font-semibold text-ink shadow-[0_0_20px_#00ED8244] hover:opacity-90">Create task</button>
      </motion.form>
    </motion.div>
  );
}

export function ProjectMatrix() {
  const tasks = useOps((s) => s.tasks);
  const moveTask = useOps((s) => s.moveTask);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);
  const personaId = useSession((s) => s.personaId);
  const canReallocate = useSession((s) => s.can("reallocate"));
  const canDrag = (t: Task) => canReallocate || t.assigneeId === personaId; // RBAC: own tasks only
  const [projectId, setProjectId] = useState<string | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const scoped = useMemo(
    () => (projectId === "all" ? tasks : tasks.filter((t) => t.projectId === projectId)),
    [tasks, projectId]
  );
  const byCol = (s: TaskStatus) => scoped.filter((t) => t.status === s);
  const empById = (id?: string) => employees.find((e) => e.id === id);

  const onDragEnd = (r: DropResult) => {
    if (!r.destination) return;
    const src = r.source.droppableId as TaskStatus;
    const dst = r.destination.droppableId as TaskStatus;
    if (src === dst && r.source.index === r.destination.index) return;
    moveTask(r.draggableId, src, dst, r.destination.index);
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* toolbar */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary">
          <Filter size={13} /> Project
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterChip active={projectId === "all"} onClick={() => setProjectId("all")}>All</FilterChip>
          {projects.map((p) => (
            <FilterChip key={p.id} active={projectId === p.id} onClick={() => setProjectId(p.id)}>
              <span className="font-mono text-[11px] opacity-70">{p.code}</span> {p.name.split(" ")[0]}
            </FilterChip>
          ))}
        </div>
        <span className="ml-auto flex items-center gap-2">
          <span className="rounded-full border border-line bg-ink-elevated px-2.5 py-0.5 text-2xs font-medium text-fg-secondary">
            {scoped.length} tasks · {canReallocate ? "drag to update" : "drag your tasks"}
          </span>
          {canReallocate && (
            <button onClick={() => setShowSuggestions(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#7C6CFF]/40 bg-[#7C6CFF]/10 px-2.5 py-1 text-xs font-semibold text-[#7C6CFF] transition-colors hover:bg-[#7C6CFF]/20">
              <Sparkles size={12} /> Suggestions
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand/20">
            <Plus size={12} /> New task
          </button>
        </span>
      </div>

      {/* board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="-mx-1 flex min-h-0 flex-1 gap-3 overflow-x-auto px-1 pb-1">
          {COLUMNS.map((col) => {
            const items = byCol(col.id);
            return (
              <div key={col.id} className="flex w-[244px] shrink-0 flex-col">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: col.tone }} />
                  <span className="text-xs font-semibold tracking-tight">{col.label}</span>
                  <span className="ml-auto font-mono text-2xs text-fg-muted">{items.length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex min-h-[80px] flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-1 transition-colors",
                        snapshot.isDraggingOver ? "bg-[var(--os-accent-soft,rgba(0,237,130,0.10))] outline-2 outline-dashed outline-[var(--os-accent,#00ED82)]" : "outline-2 outline-transparent"
                      )}
                      style={{ outlineStyle: snapshot.isDraggingOver ? "dashed" : "solid" }}
                    >
                      {items.map((t, index) => (
                        <Draggable key={t.id} draggableId={t.id} index={index} isDragDisabled={!canDrag(t)}>
                          {(dp, ds) => (
                            <div
                              ref={dp.innerRef}
                              {...dp.draggableProps}
                              {...dp.dragHandleProps}
                              onClick={() => openTaskDrawer(t.id)}
                              style={dp.draggableProps.style as React.CSSProperties}
                              className={cn(
                                "cursor-pointer rounded-xl border bg-ink-surface p-3 transition-shadow",
                                ds.isDragging ? "border-[var(--os-accent,#00ED82)] shadow-2xl" : "border-line shadow-[var(--shadow-card)] hover:border-line-strong"
                              )}
                              title="Click for details · drag to move"
                            >
                              <Card task={t} tone={col.tone} emp={empById(t.assigneeId)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="rounded-xl border border-dashed border-line py-6 text-center text-2xs text-fg-faint">Drop here</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <AnimatePresence>
        {showAdd && (
          <AddTaskQuick
            defaultProjectId={projectId !== "all" ? projectId : undefined}
            onClose={() => setShowAdd(false)}
          />
        )}
        {showSuggestions && (
          <TaskSuggestionsPanel
            scopeProjectId={projectId}
            onClose={() => setShowSuggestions(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({ task: t, tone, emp }: { task: Task; tone: string; emp?: (typeof employees)[number] }) {
  const pr = PRIORITY[t.priority] ?? PRIORITY.MEDIUM;
  return (
    <>
      <div className="flex items-center gap-1.5">
        <span className={cn("rounded-md px-1.5 py-px text-[11px] font-semibold", pr.cls)}>{pr.label}</span>
        {t.labels?.slice(0, 1).map((l) => (
          <span key={l} className="rounded-md bg-ink-elevated px-1.5 py-px text-[11px] text-fg-muted">{l}</span>
        ))}
      </div>
      <p className="mt-2 text-xs font-medium leading-snug text-fg">{t.title}</p>
      <div className="mt-2.5 flex items-center gap-2">
        {emp ? <EmpAvatar initials={emp.initials} accent={emp.accent} size={22} /> : <span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-dashed border-line text-fg-faint"><Circle size={10} /></span>}
        <span className="flex items-center gap-1 font-mono text-2xs text-fg-muted"><Clock size={11} /> {t.loggedHours ?? 0}/{t.estimatedHours}h</span>
        {t.subtasks && (
          <span className="ml-auto flex items-center gap-1 font-mono text-2xs text-fg-muted">
            <ListChecks size={11} /> {t.subtasks.done}/{t.subtasks.total}
          </span>
        )}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-elevated">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((t.loggedHours ?? 0) / t.estimatedHours) * 100)}%`, background: tone }} />
      </div>
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-2xs font-medium transition-colors",
        active ? "border-transparent text-black" : "border-line text-fg-secondary hover:bg-ink-elevated"
      )}
      style={active ? { background: "var(--os-accent, #00ED82)" } : undefined}
    >
      {children}
    </button>
  );
}
