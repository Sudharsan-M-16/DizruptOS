"use client";

// Dependency Graph —" rendered directly from the generic relationship layer
// (src/lib/graph.ts). Nodes carry live state; edges are canonical registry
// types with strength/evidence.
//
// The chips above the canvas are LENSES, not labels: click one and the graph
// answers the question —" the affected entities stay lit, everything else
// recedes, and a breakdown panel shows the numbers behind the headline.

import * as React from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Brain,
  Building2,
  Flame,
  Handshake,
  KanbanSquare,
  Search,
  Shield,
  ShieldAlert,
  Target,
  User,
  X,
} from "lucide-react";
import { relationships, expertiseConcentration, reachable } from "@/lib/graph";
import type { EntityType } from "@/lib/graph";
import { employeeById } from "@/lib/data";
import { cn } from "@/lib/utils";

type GraphData = {
  label: string;
  sub: string;
  kind: EntityType;
  tone: string;
  appId?: string;
  alert?: boolean;
  dimmed?: boolean;
  influential?: boolean;
};

const KIND_ICON: Partial<Record<EntityType, React.ElementType>> = {
  employee: User,
  project: KanbanSquare,
  risk: ShieldAlert,
  goal: Target,
  capability: Flame,
  vendor: Building2,
  customer: Handshake,
  decision: KanbanSquare,
  assumption: Brain,
  policy: Shield,
};

function EntityNode({ data }: NodeProps) {
  const d = data as unknown as GraphData;
  const Icon = KIND_ICON[d.kind] ?? KanbanSquare;
  const launch = d.appId
    ? () => window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id: d.appId } }))
    : undefined;
  return (
    <div className="relative">
      {d.influential && (
        <span className="absolute -top-2.5 right-3 z-10 rounded-full bg-brand px-2 py-px text-[9px] font-black uppercase tracking-widest text-black">
          TOP
        </span>
      )}
      <div
        role={launch ? "button" : undefined}
        tabIndex={launch ? 0 : undefined}
        onClick={launch}
        onKeyDown={launch ? (e) => { if (e.key === "Enter" || e.key === " ") launch(); } : undefined}
        className={cn(
          "flex w-80 items-center gap-3 rounded-xl border bg-ink-elevated px-4 py-3.5 shadow-card transition-all duration-300",
          launch && "cursor-pointer hover:shadow-card-hover hover:border-white/30",
          d.alert ? "border-danger/50 animate-pulseRed" : d.influential ? "border-brand/40" : "border-line",
          d.dimmed && "opacity-20 saturate-50"
        )}
      >
        <span className="rounded-lg p-2 shrink-0" style={{ background: `${d.tone}1f`, color: d.tone }}>
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-fg">{d.label}</div>
          <div className="truncate text-xs text-fg-muted">{d.sub}</div>
        </div>
        <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-line-strong" />
        <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-line-strong" />
      </div>
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

function StatChip({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-elevated px-3 py-1 text-xs font-medium">
      <span className="font-bold tabular-nums" style={{ color: color ?? "rgb(var(--fg))" }}>{value}</span>
      <span className="text-fg-muted">{label}</span>
    </span>
  );
}

function approximateBetweenness(rels: typeof relationships, nodeIds: string[]): Record<string, number> {
  const idSet = new Set(nodeIds);
  const scores: Record<string, number> = Object.fromEntries(nodeIds.map((id) => [id, 0]));

  for (const src of nodeIds) {
    const dist: Record<string, number> = { [src]: 0 };
    const sigma: Record<string, number> = { [src]: 1 };
    const pred: Record<string, string[]> = {};
    const queue = [src];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = rels
        .filter((r) => (r.source.id === curr || r.target.id === curr) && idSet.has(r.source.id) && idSet.has(r.target.id))
        .map((r) => (r.source.id === curr ? r.target.id : r.source.id));

      for (const nb of neighbors) {
        if (dist[nb] === undefined) {
          dist[nb] = dist[curr] + 1;
          sigma[nb] = sigma[curr];
          pred[nb] = [curr];
          queue.push(nb);
        } else if (dist[nb] === dist[curr] + 1) {
          sigma[nb] = (sigma[nb] ?? 0) + (sigma[curr] ?? 0);
          pred[nb] = [...(pred[nb] ?? []), curr];
        }
      }
    }

    const delta: Record<string, number> = Object.fromEntries(nodeIds.map((id) => [id, 0]));
    const visited = Object.keys(dist).sort((a, b) => (dist[b] ?? 0) - (dist[a] ?? 0));
    for (const v of visited) {
      if (v === src) continue;
      for (const p of pred[v] ?? []) {
        const frac = ((sigma[p] ?? 0) / (sigma[v] ?? 1)) * (1 + (delta[v] ?? 0));
        delta[p] = (delta[p] ?? 0) + frac;
      }
      if (v !== src) scores[v] = (scores[v] ?? 0) + (delta[v] ?? 0);
    }
  }

  const max = Math.max(...Object.values(scores), 1);
  Object.keys(scores).forEach((k) => { scores[k] /= max; });
  return scores;
}

/** PageRank (eigenvector-style centrality) —" damped random-walk iteration. */
function computePageRank(
  rels: typeof relationships,
  nodeIds: string[],
  damping = 0.85,
  iters = 35,
): Record<string, number> {
  const N = nodeIds.length;
  if (N === 0) return {};
  const idSet = new Set(nodeIds);
  const out: Record<string, string[]> = Object.fromEntries(nodeIds.map((id) => [id, []]));
  for (const r of rels) {
    if (idSet.has(r.source.id) && idSet.has(r.target.id)) {
      out[r.source.id].push(r.target.id);
      out[r.target.id].push(r.source.id);
    }
  }
  let rank: Record<string, number> = Object.fromEntries(nodeIds.map((id) => [id, 1 / N]));
  for (let i = 0; i < iters; i++) {
    const next: Record<string, number> = Object.fromEntries(nodeIds.map((id) => [id, (1 - damping) / N]));
    for (const id of nodeIds) {
      const links = out[id];
      if (!links.length) { for (const t of nodeIds) next[t] += rank[id] * damping / N; continue; }
      const share = (rank[id] * damping) / links.length;
      for (const t of links) next[t] += share;
    }
    rank = next;
  }
  const max = Math.max(...Object.values(rank), 1e-9);
  Object.keys(rank).forEach((k) => { rank[k] /= max; });
  return rank;
}

/* Presentation layer for the registry slice: position + live-state labels.
   Anything in `relationships` without a card here simply doesn't render. */
const NODE_META: Record<string, { x: number; y: number } & GraphData> = {
  "g-revenue":    { x: 0,    y: 200,  label: "Launch the AI Chatbot",    sub: "Goal · CEO",                   kind: "goal",       tone: "#C084FC", appId: "r-goals" },
  "g-expansion":  { x: 0,    y: 460,  label: "Ship Fitness App & Store",  sub: "Goal · Product",               kind: "goal",       tone: "#C084FC", appId: "r-goals" },
  "p-atlas":      { x: 420,  y: 110,  label: "AI Support Chatbot",        sub: "Project · CRITICAL",           kind: "project",    tone: "#EF4444", appId: "r-projects", alert: true },
  "p-helio":      { x: 420,  y: 460,  label: "Fitness Mobile App",        sub: "Project · On Track",           kind: "project",    tone: "#10B981", appId: "r-projects" },
  "c-acme":       { x: 420,  y: -80,  label: "Acme Support",              sub: "Customer · Chatbot",           kind: "customer",   tone: "#38BDF8", appId: "r-projects" },
  "cap-payments": { x: 860,  y: 20,   label: "Backend & APIs",            sub: "",                             kind: "capability", tone: "#F59E0B", appId: "r-capabilities" },
  "u-sarah":      { x: 860,  y: 220,  label: "Sarah Okafor",              sub: "Lead · 115% · burnout flag",   kind: "employee",   tone: "#EF4444", appId: "directory", alert: true },
  "u-ahmed":      { x: 860,  y: 420,  label: "Ahmed Hassan",              sub: "Backend · headroom",           kind: "employee",   tone: "#10B981", appId: "directory" },
  "v-clearsettle":{ x: 1300, y: 20,   label: "SecureCloud Ltd",           sub: "Vendor · blocking review",     kind: "vendor",     tone: "#F87171", appId: "r-risks" },
  "r-1":          { x: 1300, y: 220,  label: "Backend in one person",     sub: "Risk · Critical severity",     kind: "risk",       tone: "#EF4444", appId: "r-risks" },
  "r-2":          { x: 1300, y: 420,  label: "Vendor delay",              sub: "Risk · Escalated",             kind: "risk",       tone: "#F59E0B", appId: "r-risks" },
  "dec-1":        { x: 1740, y: 220,  label: "Build UI + AI together",    sub: "Decision · Active",            kind: "decision",   tone: "#2BD9FF", appId: "r-decisions" },
};

type Lens = "blast" | "bus" | "influence" | "pagerank" | null;

export default function GraphPage() {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [lens, setLens] = React.useState<Lens>(null);
  const [searchQ, setSearchQ] = React.useState("");

  // Track the live theme so the canvas (and edge contrast) follow light/dark.
  const [mode, setMode] = React.useState<"light" | "dark">("dark");
  React.useEffect(() => {
    const read = () => setMode(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  // Edge colour that reads clearly on BOTH themes (light-mode edges were nearly
  // invisible when they used the faint --line-strong token).
  const edgeBase = mode === "light" ? "#64748B" : "#8A94A6";

  const { nodes, edges, blast, blastIds, busHolders, busIds, busTopShare, betweenness, influenceIds, pagerank, pagerankIds } =
    React.useMemo(() => {
      // Bus factor: how concentrated is payments expertise?
      const holders = expertiseConcentration(relationships, "cap-payments");
      const busIds = new Set(["cap-payments", ...holders.map((h) => h.holderId)]);

      // Impact set: everything within 3 hops of Sarah.
      const blast = reachable(relationships, "u-sarah", 3);
      const blastIds = new Set(["u-sarah", ...blast.map((b) => b.ref.id)]);

      // Betweenness centrality — top nodes by network influence
      const nodeIds = Object.keys(NODE_META);
      const betweenness = approximateBetweenness(relationships, nodeIds);
      const INFLUENCE_THRESHOLD = 0.4;
      const influenceIds = new Set(
        Object.entries(betweenness)
          .filter(([, score]) => score >= INFLUENCE_THRESHOLD)
          .map(([id]) => id)
      );

      // PageRank — eigenvector centrality
      const pagerank = computePageRank(relationships, nodeIds);
      const PR_THRESHOLD = 0.55;
      const pagerankIds = new Set(
        Object.entries(pagerank)
          .filter(([, s]) => s >= PR_THRESHOLD)
          .map(([id]) => id)
      );

      const top = holders[0];
      const nodes: Node[] = Object.entries(NODE_META).map(([id, m]) => ({
        id,
        position: { x: m.x, y: m.y },
        type: "entity",
        data: {
          ...m,
          sub:
            id === "cap-payments" && top
              ? `Capability · top holder ${(top.share * 100).toFixed(0)}% of depth`
              : m.sub,
        } as unknown as Record<string, unknown>,
      }));

      const edges: Edge[] = relationships
        .filter((r) => NODE_META[r.source.id] && NODE_META[r.target.id])
        .map((r) => {
          const danger =
            r.type === "causes" || r.type === "threatened_by" || r.type === "owns_risk" ||
            (r.source.id === "u-sarah" && r.strength >= 0.9);
          return {
            id: r.id,
            source: r.source.id,
            target: r.target.id,
            label: `${r.type}${r.evidence === "inferred" || r.evidence === "ai_derived" ? " ·~" : ""}`,
            animated: danger || r.strength >= 0.95,
            data: { danger },
            style: { strokeWidth: 2 + r.strength * 1.8 },
            labelStyle: { fill: "rgb(var(--fg-secondary))", fontSize: 12, fontFamily: "var(--font-plex-mono)" },
            labelBgStyle: { fill: "rgb(var(--ink-surface))", fillOpacity: 0.92 },
          };
        });

      return {
        nodes,
        edges,
        blast,
        blastIds,
        busHolders: holders,
        busIds,
        busTopShare: top?.share ?? 0,
        betweenness,
        influenceIds,
        pagerank,
        pagerankIds,
      };
    }, []);

  // Controlled nodes so lens dimming re-renders while dragging keeps working.
  const [rfNodes, , onNodesChange] = useNodesState(nodes);

  const lensIds = lens === "blast" ? blastIds : lens === "bus" ? busIds : lens === "influence" ? influenceIds : lens === "pagerank" ? pagerankIds : null;

  const searchMatch = React.useMemo(() => {
    if (!searchQ.trim()) return null;
    const q = searchQ.toLowerCase();
    return new Set(
      Object.entries(NODE_META)
        .filter(([, m]) => m.label.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q) || m.kind.toLowerCase().includes(q))
        .map(([id]) => id)
    );
  }, [searchQ]);

  const displayNodes = React.useMemo(
    () =>
      rfNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          dimmed: searchMatch ? !searchMatch.has(n.id) : lensIds ? !lensIds.has(n.id) : false,
          influential: lens === "influence" ? influenceIds.has(n.id) : false,
        },
      })),
    [rfNodes, lensIds, lens, influenceIds, searchMatch]
  );

  // Edge styling lives here (theme-aware): danger edges are red in both themes,
  // everything else uses the readable `edgeBase`; hover/lens emphasis lifts an
  // edge while the rest recede to a still-visible 0.25 opacity (was 0.1 —" that
  // was invisible, especially in light mode).
  const displayEdges = React.useMemo(() => {
    return edges.map((e) => {
      const danger = (e.data as { danger?: boolean } | undefined)?.danger;
      const base = danger ? "#EF4444" : edgeBase;
      const baseWidth = (e.style?.strokeWidth as number) ?? 1.5;
      let stroke = base, opacity = 1, strokeWidth = baseWidth, animated = e.animated;
      if (hoveredId) {
        const connected = e.source === hoveredId || e.target === hoveredId;
        stroke = connected ? "#00ED82" : base;
        opacity = connected ? 1 : 0.25;
        strokeWidth = connected ? 2.6 : baseWidth;
        animated = connected;
      } else if (lensIds) {
        const inLens = lensIds.has(e.source) && lensIds.has(e.target);
        const lensColor = lens === "blast" ? "#EF4444" : lens === "influence" ? "#00ED82" : lens === "pagerank" ? "#C084FC" : "#F59E0B";
        stroke = inLens ? lensColor : base;
        opacity = inLens ? 1 : 0.25;
        strokeWidth = inLens ? 2.6 : baseWidth;
        animated = inLens;
      }
      return {
        ...e,
        animated,
        style: { ...e.style, stroke, strokeWidth, opacity, transition: "opacity 0.2s ease, stroke 0.2s ease" },
        labelStyle: { ...e.labelStyle, opacity: opacity < 0.5 ? 0.25 : 1 },
      };
    });
  }, [edges, hoveredId, lensIds, lens, edgeBase]);

  const toggle = (l: Exclude<Lens, null>) => setLens((cur) => (cur === l ? null : l));

  const nodeCount = Object.keys(NODE_META).length;
  const edgeCount = relationships.filter((r) => NODE_META[r.source.id] && NODE_META[r.target.id]).length;
  const avgDegree = nodeCount > 0 ? ((edgeCount * 2) / nodeCount).toFixed(1) : "0";

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#6366F122", border: "1px solid #6366F144" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v3M5.2 17.5l4.8-5.5M18.8 17.5l-4.8-5.5"/></svg>
        </span>
        <div>
          <div className="text-sm font-semibold">Dependency Graph</div>
          <div className="text-[11px] text-fg-muted">{nodeCount} nodes · {edgeCount} relationships · blast radius + bus factor + influence lenses</div>
        </div>
      </div>
    <div className="flex-1 overflow-auto p-3 space-y-3">
      {/* Search + stats row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-elevated px-3 py-1.5">
          <Search size={13} className="text-fg-muted" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search nodes…"
            aria-label="Search graph nodes"
            className="w-40 bg-transparent text-xs text-fg placeholder:text-fg-faint focus:outline-none"
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} aria-label="Clear search" className="text-fg-muted hover:text-fg">
              <X size={11} />
            </button>
          )}
        </div>
        {searchQ && searchMatch && (
          <span className="text-xs text-fg-muted">{searchMatch.size} matching node{searchMatch.size !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Graph stats row */}
      <div className="flex flex-wrap items-center gap-2">
        <StatChip label="nodes" value={nodeCount} color="#00ED82" />
        <StatChip label="edges" value={edgeCount} color="#2BD9FF" />
        <StatChip label="avg degree" value={avgDegree} />
        <StatChip label="top influencers" value={influenceIds.size} color="#C084FC" />
        <StatChip label="high pagerank" value={pagerankIds.size} color="#F97316" />
      </div>

      {/* Lenses —" click to interrogate the graph, click again to release */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
        <button
          onClick={() => toggle("blast")}
          aria-pressed={lens === "blast"}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
            lens === "blast"
              ? "border-danger bg-danger/20 text-danger shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              : "border-danger/40 bg-danger-soft text-danger hover:border-danger/70"
          )}
        >
          Scenario: &ldquo;What breaks if Sarah leaves?&rdquo; &mdash; {blastIds.size - 1} entities in 3-hop blast radius
        </button>
        <button
          onClick={() => toggle("bus")}
          aria-pressed={lens === "bus"}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
            lens === "bus"
              ? "border-warn bg-warn/20 text-warn shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              : "border-warn/40 bg-warn-soft text-warn hover:border-warn/70"
          )}
        >
          Payments bus factor: top holder carries {(busTopShare * 100).toFixed(0)}% of expertise depth
        </button>
        <button
          onClick={() => toggle("influence")}
          aria-pressed={lens === "influence"}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
            lens === "influence"
              ? "border-brand bg-brand/20 text-brand shadow-[0_0_12px_rgba(0,237,130,0.3)]"
              : "border-brand/40 text-brand/80 hover:border-brand/70"
          )}
        >
          Influence map: {influenceIds.size} high-betweenness nodes (TOP)
        </button>
        <button
          onClick={() => toggle("pagerank")}
          aria-pressed={lens === "pagerank"}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
            lens === "pagerank"
              ? "border-orange-400 bg-orange-400/20 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]"
              : "border-orange-400/40 text-orange-400/80 hover:border-orange-400/70"
          )}
        >
          PageRank: {pagerankIds.size} structurally dominant nodes
        </button>
        <span className="ml-auto">
          {lens ? "click the active chip to release the lens" : 'click a chip to focus the graph · edge width ˆ strength · "·~" marks inferred edges'}
        </span>
      </div>

      {/* Lens breakdown —" the numbers behind the headline */}
      {lens && (
        <div className="panel animate-riseIn flex flex-wrap items-start gap-x-8 gap-y-3 p-4">
          {lens === "blast" ? (
            <>
              <div className="min-w-48">
                <div className="label-xs text-danger">Blast radius · departure scenario</div>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-fg-secondary">
                  Everything reachable within 3 relationship hops of Sarah Okafor.
                  If she leaves, these entities lose a load-bearing connection &mdash;
                  highlighted nodes stay lit, the rest of the org recedes.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {blast.map((b) => (
                  <span
                    key={b.ref.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-elevated px-2 py-0.5 font-mono text-xs text-fg-secondary"
                  >
                    {NODE_META[b.ref.id]?.label ?? b.ref.id}
                    <span className="text-fg-faint">{b.hops} hop{b.hops > 1 ? "s" : ""}</span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="min-w-48">
                <div className="label-xs text-warn">Bus factor · payments capability</div>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-fg-secondary">
                  Share of total expertise depth each person holds on the
                  Payments capability. One person above 60% means a single
                  resignation takes the capability down &mdash; the cross-training
                  edge (Sarah &rarr; Ahmed) is the live mitigation.
                </p>
              </div>
              <div className="min-w-56 flex-1 space-y-2">
                {busHolders.map((h) => {
                  const emp = employeeById(h.holderId);
                  return (
                    <div key={h.holderId} className="flex items-center gap-3">
                      <span className="w-28 truncate text-xs font-medium text-fg">
                        {emp?.name ?? h.holderId}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-raised">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${h.share * 100}%`,
                            background: h.share > 0.6 ? "#EF4444" : h.share > 0.4 ? "#F59E0B" : "#10B981",
                          }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-xs text-fg-secondary">
                        {(h.share * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {lens === "influence" && (
            <>
              <div className="min-w-48">
                <div className="label-xs text-brand">Influence map · betweenness centrality</div>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-fg-secondary">
                  Nodes with the highest betweenness centrality &mdash; they sit on the
                  most shortest paths between other nodes. Losing them would
                  fragment the graph most severely. Marked with a TOP badge.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...influenceIds].map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 font-mono text-xs text-brand"
                  >
                    {NODE_META[id]?.label ?? id}
                    <span className="text-brand/60">{((betweenness[id] ?? 0) * 100).toFixed(0)}%</span>
                  </span>
                ))}
              </div>
            </>
          )}
          {lens === "pagerank" && (
            <>
              <div className="min-w-48">
                <div className="label-xs" style={{ color: "#F97316" }}>PageRank · eigenvector centrality</div>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-fg-secondary">
                  Nodes that are connected to other highly-connected nodes score highest.
                  Unlike betweenness, PageRank rewards being embedded in a dense, well-linked
                  cluster &mdash; the structural core of the org graph.
                </p>
              </div>
              <div className="min-w-56 flex-1 space-y-2">
                {Object.entries(pagerank)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([id, score]) => (
                    <div key={id} className="flex items-center gap-3">
                      <span className="w-36 truncate text-xs font-medium text-fg">
                        {NODE_META[id]?.label ?? id}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-raised">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${score * 100}%`, background: score > 0.7 ? "#F97316" : score > 0.5 ? "#F59E0B" : "#94A3B8" }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-xs text-fg-secondary">
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
          <button
            onClick={() => setLens(null)}
            aria-label="Release lens"
            className="ml-auto rounded-lg border border-line bg-ink-elevated p-1.5 text-fg-muted transition-colors hover:text-fg"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="panel h-[700px] overflow-hidden">
        <ReactFlow
          nodes={displayNodes}
          onNodesChange={onNodesChange}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          fitView
          fitViewOptions={{ padding: 0.18, minZoom: 0.1, maxZoom: 1 }}
          minZoom={0.1}
          proOptions={{ hideAttribution: true }}
          colorMode={mode}
          style={{ background: "transparent" }}
        >
          <Background color={mode === "light" ? "rgb(var(--line))" : "rgb(var(--line-subtle))"} gap={26} size={1} />
          <Controls
            showInteractive={false}
            className="!rounded-lg !border !border-line !bg-ink-elevated !shadow-card [&>button]:!border-line [&>button]:!bg-ink-elevated [&_svg]:!fill-fg-secondary"
          />
          <MiniMap
            pannable
            zoomable
            className="!h-28 !w-44 !rounded-lg !border !border-line !bg-ink-elevated"
            maskColor="rgba(10,10,15,0.55)"
            nodeColor={() => "#00ED82"}
            nodeStrokeColor={() => "transparent"}
          />
        </ReactFlow>
      </div>
      <p className="text-xs text-fg-muted">
        Rendered from the generic relationship layer (canonical registry types:
        funds · produces · threatened_by · supported_by · causes · mitigates).
        1-hop traversals are direct reads; the blast-radius and bus-factor
        lenses run the same utilities the scenario engine will use.
      </p>
    </div>
    </div>
  );
}
