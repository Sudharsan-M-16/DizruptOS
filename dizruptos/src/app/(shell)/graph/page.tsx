"use client";

// Dependency Graph — a LIVE map of who's doing what. Three columns:
//   People  →  Projects  →  Goals
// A person→project line IS a current task assignment, so when work is reassigned
// the lines redraw. Project colour = live health; person colour = live load.
// The chips are simple, live lenses: who's overloaded, which projects have no
// owner, and where a project rides on a single person. Click a node to open it.

import * as React from "react";
import {
  Background, Controls, Handle, MiniMap, Position, ReactFlow, useNodesState,
  type Edge, type Node, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertTriangle, Flame, KanbanSquare, Search, Target, User, UserX } from "lucide-react";
import { employees, goals as seedGoals, projects as seedProjects, employeeById, WEEKS } from "@/lib/data";
import { useOps } from "@/lib/store";
import { cn, fmtPct } from "@/lib/utils";
import type { HealthStatus } from "@/lib/types";

const HEALTH_TONE: Record<HealthStatus, string> = {
  ON_TRACK: "#10B981", DELAYED: "#F59E0B", AT_RISK: "#F59E0B", BLOCKED: "#EF4444", CRITICAL: "#EF4444",
};
const loadTone = (u: number) => (u >= 1 ? "#EF4444" : u >= 0.8 ? "#F59E0B" : u < 0.6 ? "#38BDF8" : "#10B981");

type Kind = "person" | "project" | "goal";
type GData = { kind: Kind; label: string; sub: string; tone: string; appId?: string; alert?: boolean; dimmed?: boolean; highlight?: boolean };

const KIND_ICON: Record<Kind, React.ElementType> = { person: User, project: KanbanSquare, goal: Target };

function EntityNode({ data }: NodeProps) {
  const d = data as unknown as GData;
  const Icon = KIND_ICON[d.kind];
  const launch = d.appId ? () => window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id: d.appId } })) : undefined;
  return (
    <div
      role={launch ? "button" : undefined}
      tabIndex={launch ? 0 : undefined}
      onClick={launch}
      onKeyDown={launch ? (e) => { if (e.key === "Enter" || e.key === " ") launch(); } : undefined}
      className={cn(
        "flex w-64 items-center gap-3 rounded-xl border bg-ink-elevated px-3.5 py-3 shadow-card transition-all duration-300",
        launch && "cursor-pointer hover:border-white/30",
        d.highlight ? "border-brand/70 shadow-glow" : d.alert ? "border-danger/50" : "border-line",
        d.dimmed && "opacity-20 saturate-50",
      )}
    >
      <span className="shrink-0 rounded-lg p-2" style={{ background: `${d.tone}1f`, color: d.tone }}><Icon size={18} /></span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-fg">{d.label}</div>
        <div className="truncate text-2xs text-fg-muted">{d.sub}</div>
      </div>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-line-strong" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-line-strong" />
    </div>
  );
}
const nodeTypes = { entity: EntityNode };

type Lens = "overload" | "understaffed" | "keyperson" | null;

export default function GraphPage() {
  const tasks = useOps((s) => s.tasks);
  const utilization = useOps((s) => s.utilization);
  const overrides = useOps((s) => s.projectOverrides);
  const extraProjects = useOps((s) => s.extraProjects);
  const [lens, setLens] = React.useState<Lens>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");

  const [mode, setMode] = React.useState<"light" | "dark">("dark");
  React.useEffect(() => {
    const read = () => setMode(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  const edgeBase = mode === "light" ? "#64748B" : "#8A94A6";

  const { nodes, edges, overloadIds, understaffedIds, keyIds, stats } = React.useMemo(() => {
    const week = WEEKS[0];
    // Live projects: static seed + manager stage overrides + session-created.
    const projects = [...seedProjects.map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p)), ...extraProjects];
    const active = tasks.filter((t) => t.status !== "COMPLETED");

    // People who currently have work; projects (all); goals referenced by projects.
    const peopleIds = Array.from(new Set(active.map((t) => t.assigneeId).filter(Boolean) as string[]));
    const people = peopleIds.map((id) => employeeById(id)).filter(Boolean) as typeof employees;
    const goalsUsed = seedGoals.filter((g) => projects.some((p) => p.goalId === g.id));

    // distinct assignees per project (for single-point-of-failure)
    const assigneesByProject = new Map<string, Set<string>>();
    const unownedByProject = new Map<string, number>();
    for (const t of active) {
      if (t.assigneeId) {
        if (!assigneesByProject.has(t.projectId)) assigneesByProject.set(t.projectId, new Set());
        assigneesByProject.get(t.projectId)!.add(t.assigneeId);
      } else {
        unownedByProject.set(t.projectId, (unownedByProject.get(t.projectId) ?? 0) + 1);
      }
    }

    const overloadIds = new Set(people.filter((e) => utilization(e.id, week) >= 1).map((e) => e.id));
    const understaffedIds = new Set(projects.filter((p) => (unownedByProject.get(p.id) ?? 0) > 0).map((p) => p.id));
    // single point of failure: a project with exactly one person on it → that person + project
    const keyIds = new Set<string>();
    for (const [pid, set] of assigneesByProject) if (set.size === 1) { keyIds.add(pid); keyIds.add([...set][0]); }

    const nodes: Node[] = [];
    people.forEach((e, i) => {
      const u = utilization(e.id, week);
      nodes.push({ id: e.id, type: "entity", position: { x: 0, y: i * 104 }, data: {
        kind: "person", label: e.name, sub: `${e.title} · ${fmtPct(u)}`, tone: loadTone(u), appId: "r-capacity", alert: u >= 1,
      } as unknown as Record<string, unknown> });
    });
    projects.forEach((p, i) => {
      nodes.push({ id: p.id, type: "entity", position: { x: 680, y: i * 176 + 20 }, data: {
        kind: "project", label: p.name, sub: `Project · ${p.health.replace("_", " ").toLowerCase()}`, tone: HEALTH_TONE[p.health], appId: "r-projects", alert: p.health === "CRITICAL" || p.health === "BLOCKED",
      } as unknown as Record<string, unknown> });
    });
    goalsUsed.forEach((g, i) => {
      nodes.push({ id: g.id, type: "entity", position: { x: 1360, y: i * 220 + 40 }, data: {
        kind: "goal", label: g.title, sub: `Goal · ${Math.round(g.progress * 100)}% complete`, tone: "#C084FC", appId: "r-goals",
      } as unknown as Record<string, unknown> });
    });

    const edges: Edge[] = [];
    const seen = new Set<string>();
    for (const t of active) {
      if (!t.assigneeId) continue;
      const key = `${t.assigneeId}::${t.projectId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const count = active.filter((x) => x.assigneeId === t.assigneeId && x.projectId === t.projectId).length;
      edges.push({ id: `a-${key}`, source: t.assigneeId, target: t.projectId, data: { kind: "assign" }, style: { strokeWidth: 1.4 + count * 0.7 } });
    }
    for (const p of projects) {
      if (p.goalId && goalsUsed.some((g) => g.id === p.goalId)) {
        edges.push({ id: `g-${p.id}`, source: p.id, target: p.goalId, data: { kind: "goal" }, style: { strokeWidth: 1.4, strokeDasharray: "4 4" } });
      }
    }

    const stats = { people: people.length, projects: projects.length, overloaded: overloadIds.size, understaffed: understaffedIds.size, keyPeople: [...keyIds].filter((id) => id.startsWith("u-")).length };
    return { nodes, edges, overloadIds, understaffedIds, keyIds, stats };
  }, [tasks, overrides, extraProjects, utilization]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  React.useEffect(() => { setRfNodes(nodes); }, [nodes, setRfNodes]);

  const lensIds = lens === "overload" ? overloadIds : lens === "understaffed" ? understaffedIds : lens === "keyperson" ? keyIds : null;

  const searchMatch = React.useMemo(() => {
    if (!q.trim()) return null;
    const s = q.toLowerCase();
    return new Set(nodes.filter((n) => { const d = n.data as unknown as GData; return d.label.toLowerCase().includes(s) || d.sub.toLowerCase().includes(s); }).map((n) => n.id));
  }, [q, nodes]);

  const displayNodes = React.useMemo(() => rfNodes.map((n) => ({
    ...n,
    data: { ...n.data, dimmed: searchMatch ? !searchMatch.has(n.id) : lensIds ? !lensIds.has(n.id) : false, highlight: lensIds ? lensIds.has(n.id) : false },
  })), [rfNodes, lensIds, searchMatch]);

  const displayEdges = React.useMemo(() => edges.map((e) => {
    const isGoal = (e.data as { kind?: string } | undefined)?.kind === "goal";
    let stroke = isGoal ? "#C084FC88" : edgeBase, opacity = 1, animated = false;
    if (hovered) {
      const on = e.source === hovered || e.target === hovered;
      stroke = on ? "#00ED82" : stroke; opacity = on ? 1 : 0.18; animated = on;
    } else if (lensIds) {
      const on = lensIds.has(e.source) && lensIds.has(e.target);
      stroke = on ? "#00ED82" : stroke; opacity = on ? 1 : 0.18; animated = on;
    }
    return { ...e, animated, style: { ...e.style, stroke, opacity, transition: "opacity .2s, stroke .2s" } };
  }), [edges, hovered, lensIds, edgeBase]);

  const LENSES: { id: Lens; label: string; icon: React.ElementType; tone: string; count: number }[] = [
    { id: "overload", label: "Overloaded people", icon: Flame, tone: "#EF4444", count: stats.overloaded },
    { id: "understaffed", label: "Understaffed projects", icon: UserX, tone: "#F59E0B", count: stats.understaffed },
    { id: "keyperson", label: "Single point of failure", icon: AlertTriangle, tone: "#C084FC", count: stats.keyPeople },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#A78BFA22", border: "1px solid #A78BFA44" }}>
          <KanbanSquare size={15} style={{ color: "#A78BFA" }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Dependency Graph</div>
          <div className="text-[11px] text-fg-muted">Who&apos;s doing what, live · {stats.people} people · {stats.projects} projects · lines are current assignments</div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-surface px-2.5">
            <Search size={13} className="text-fg-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a person or project…" className="h-8 w-48 bg-transparent text-xs outline-none placeholder:text-fg-faint" />
          </div>
          {LENSES.map((l) => {
            const Icon = l.icon;
            const active = lens === l.id;
            return (
              <button key={l.id} onClick={() => setLens(active ? null : l.id)}
                className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors", active ? "text-fg" : "border-line text-fg-secondary hover:text-fg")}
                style={active ? { borderColor: `${l.tone}88`, background: `${l.tone}1a` } : undefined}>
                <Icon size={12} style={{ color: l.tone }} /> {l.label}
                <span className="rounded-full bg-ink-elevated px-1.5 text-[10px] font-bold">{l.count}</span>
              </button>
            );
          })}
          {lens && <button onClick={() => setLens(null)} className="text-2xs text-fg-muted hover:text-fg">clear</button>}
          <span className="ml-auto hidden text-2xs text-fg-muted lg:block">Reassign a task and the lines redraw here.</span>
        </div>

        <div className="panel h-[calc(100vh-180px)] min-h-[480px] overflow-hidden">
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            onNodeMouseEnter={(_, n) => setHovered(n.id)}
            onNodeMouseLeave={() => setHovered(null)}
            fitView
            fitViewOptions={{ padding: 0.18, minZoom: 0.1, maxZoom: 1 }}
            minZoom={0.1}
            proOptions={{ hideAttribution: true }}
            colorMode={mode}
            style={{ background: "transparent" }}
          >
            <Background color={mode === "light" ? "rgb(var(--line))" : "rgb(var(--line-subtle))"} gap={26} size={1} />
            <Controls showInteractive={false} className="!rounded-lg !border !border-line !bg-ink-elevated !shadow-card [&>button]:!border-line [&>button]:!bg-ink-elevated [&_svg]:!fill-fg-secondary" />
            <MiniMap pannable zoomable className="!h-28 !w-44 !rounded-lg !border !border-line !bg-ink-elevated" maskColor="rgba(10,10,15,0.55)" nodeColor={(n) => ((n.data as unknown as GData).tone)} nodeStrokeColor={() => "transparent"} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
