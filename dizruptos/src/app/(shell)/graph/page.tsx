"use client";

// Dependency Graph — rendered directly from the generic relationship layer
// (src/lib/graph.ts). Nodes carry live state; edges are canonical registry
// types with strength/evidence.
//
// The chips above the canvas are LENSES, not labels: click one and the graph
// answers the question — the affected entities stay lit, everything else
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
  Building2,
  Flame,
  Handshake,
  KanbanSquare,
  ShieldAlert,
  Target,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { relationships, expertiseConcentration, reachable } from "@/lib/graph";
import type { EntityType } from "@/lib/graph";
import { employeeById } from "@/lib/data";
import { cn } from "@/lib/utils";

type GraphData = {
  label: string;
  sub: string;
  kind: EntityType;
  tone: string;
  href?: string;
  alert?: boolean;
  dimmed?: boolean;
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
};

function EntityNode({ data }: NodeProps) {
  const d = data as unknown as GraphData;
  const Icon = KIND_ICON[d.kind] ?? KanbanSquare;
  const inner = (
    <div
      className={cn(
        "flex w-72 items-center gap-3 rounded-xl border bg-ink-elevated px-4 py-3.5 shadow-card transition-all duration-300 hover:shadow-card-hover",
        d.alert ? "border-danger/50 animate-pulseRed" : "border-line",
        d.dimmed && "opacity-20 saturate-50"
      )}
    >
      <span className="rounded-lg p-2" style={{ background: `${d.tone}1f`, color: d.tone }}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-base font-semibold text-fg">{d.label}</div>
        <div className="truncate text-sm text-fg-muted">{d.sub}</div>
      </div>
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-line-strong" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-line-strong" />
    </div>
  );
  return d.href ? <Link href={d.href}>{inner}</Link> : inner;
}

const nodeTypes = { entity: EntityNode };

/* Presentation layer for the registry slice: position + live-state labels.
   Anything in `relationships` without a card here simply doesn't render. */
const NODE_META: Record<string, { x: number; y: number } & GraphData> = {
  "g-revenue": { x: 0, y: 150, label: "Protect $4.2M ARR", sub: "Goal · COO", kind: "goal", tone: "#C084FC", href: "/goals" },
  "g-expansion": { x: 0, y: 330, label: "Land 3 enterprise logos", sub: "Goal · Client Ops", kind: "goal", tone: "#C084FC", href: "/goals" },
  "p-atlas": { x: 300, y: 90, label: "Atlas Payments Migration", sub: "Project · CRITICAL", kind: "project", tone: "#EF4444", href: "/projects/p-atlas", alert: true },
  "p-helio": { x: 300, y: 330, label: "Helio Client Portal", sub: "Project · At Risk", kind: "project", tone: "#F59E0B", href: "/projects/p-helio" },
  "c-acme": { x: 300, y: -60, label: "Acme Corp", sub: "Customer · $4.2M ARR", kind: "customer", tone: "#38BDF8" },
  "cap-payments": { x: 620, y: 20, label: "Payments Capability", sub: "", kind: "capability", tone: "#F59E0B" },
  "u-sarah": { x: 620, y: 160, label: "Sarah Okafor", sub: "Lead · 112% · burnout flag", kind: "employee", tone: "#EF4444", href: "/people/u-sarah", alert: true },
  "u-ahmed": { x: 620, y: 300, label: "Ahmed Hassan", sub: "Backend · headroom", kind: "employee", tone: "#10B981", href: "/people/u-ahmed" },
  "v-clearsettle": { x: 940, y: 20, label: "ClearSettle Ltd", sub: "Vendor · 8 days late", kind: "vendor", tone: "#F87171" },
  "r-1": { x: 940, y: 160, label: "Expertise concentration", sub: "Risk · Critical severity", kind: "risk", tone: "#EF4444", href: "/risks" },
  "r-2": { x: 940, y: 300, label: "Vendor slippage", sub: "Risk · Escalated", kind: "risk", tone: "#F59E0B", href: "/risks" },
  "dec-1": { x: 1240, y: 160, label: "Ledger-first decision", sub: "Decision · Active", kind: "decision", tone: "#2BD9FF", href: "/decisions" },
};

type Lens = "blast" | "bus" | null;

export default function GraphPage() {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [lens, setLens] = React.useState<Lens>(null);

  const { nodes, edges, blast, blastIds, busHolders, busIds, busTopShare } =
    React.useMemo(() => {
      // Bus factor: how concentrated is payments expertise?
      const holders = expertiseConcentration(relationships, "cap-payments");
      const busIds = new Set(["cap-payments", ...holders.map((h) => h.holderId)]);

      // Impact set: everything within 3 hops of Sarah.
      const blast = reachable(relationships, "u-sarah", 3);
      const blastIds = new Set(["u-sarah", ...blast.map((b) => b.ref.id)]);

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
            style: {
              stroke: danger ? "#EF444488" : "rgb(var(--line-strong))",
              strokeWidth: 1 + r.strength,
            },
            labelStyle: { fill: "rgb(var(--fg-secondary))", fontSize: 16, fontFamily: "var(--font-plex-mono)" },
            labelBgStyle: { fill: "rgb(var(--ink-surface))", fillOpacity: 0.9 },
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
      };
    }, []);

  // Controlled nodes so lens dimming re-renders while dragging keeps working.
  const [rfNodes, , onNodesChange] = useNodesState(nodes);

  const lensIds = lens === "blast" ? blastIds : lens === "bus" ? busIds : null;

  const displayNodes = React.useMemo(
    () =>
      rfNodes.map((n) => ({
        ...n,
        data: { ...n.data, dimmed: lensIds ? !lensIds.has(n.id) : false },
      })),
    [rfNodes, lensIds]
  );

  // Edge emphasis: hover wins, then the active lens, then the base styling.
  const displayEdges = React.useMemo(() => {
    return edges.map((e) => {
      if (hoveredId) {
        const connected = e.source === hoveredId || e.target === hoveredId;
        return {
          ...e,
          animated: connected,
          style: {
            ...e.style,
            stroke: connected ? "#00ED82" : (e.style?.stroke as string),
            strokeWidth: connected ? 2.5 : 1,
            opacity: connected ? 1 : 0.12,
            transition: "opacity 0.2s ease, stroke 0.2s ease",
          },
          labelStyle: { ...e.labelStyle, opacity: connected ? 1 : 0.15 },
        };
      }
      if (lensIds) {
        const inLens = lensIds.has(e.source) && lensIds.has(e.target);
        return {
          ...e,
          animated: inLens,
          style: {
            ...e.style,
            stroke: inLens ? (lens === "blast" ? "#EF4444" : "#F59E0B") : (e.style?.stroke as string),
            strokeWidth: inLens ? 2.5 : 1,
            opacity: inLens ? 1 : 0.1,
            transition: "opacity 0.2s ease, stroke 0.2s ease",
          },
          labelStyle: { ...e.labelStyle, opacity: inLens ? 1 : 0.12 },
        };
      }
      return e;
    });
  }, [edges, hoveredId, lensIds, lens]);

  const toggle = (l: Exclude<Lens, null>) => setLens((cur) => (cur === l ? null : l));

  return (
    <div className="space-y-3">
      {/* Lenses — click to interrogate the graph, click again to release */}
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
          Scenario: “What breaks if Sarah leaves?” — {blastIds.size - 1} entities in 3-hop blast radius
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
        <span className="ml-auto">
          {lens ? "click the active chip to release the lens" : "click a chip to focus the graph · edge width ∝ strength · “·~” marks inferred edges"}
        </span>
      </div>

      {/* Lens breakdown — the numbers behind the headline */}
      {lens && (
        <div className="panel animate-riseIn flex flex-wrap items-start gap-x-8 gap-y-3 p-4">
          {lens === "blast" ? (
            <>
              <div className="min-w-48">
                <div className="label-xs text-danger">Blast radius · departure scenario</div>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-fg-secondary">
                  Everything reachable within 3 relationship hops of Sarah Okafor.
                  If she leaves, these entities lose a load-bearing connection —
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
                  resignation takes the capability down — the cross-training
                  edge (Sarah → Ahmed) is the live mitigation.
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
          <button
            onClick={() => setLens(null)}
            aria-label="Release lens"
            className="ml-auto rounded-lg border border-line bg-ink-elevated p-1.5 text-fg-muted transition-colors hover:text-fg"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="panel h-[640px] overflow-hidden">
        <ReactFlow
          nodes={displayNodes}
          onNodesChange={onNodesChange}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          fitView
          fitViewOptions={{ padding: 0.1, minZoom: 0.7 }}
          minZoom={0.4}
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
          style={{ background: "transparent" }}
        >
          <Background color="rgb(var(--line-subtle))" gap={24} size={1} />
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
  );
}
