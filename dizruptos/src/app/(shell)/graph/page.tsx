"use client";

// Dependency Graph — rendered directly from the generic relationship layer
// (src/lib/graph.ts). Nodes carry live state; edges are canonical registry
// types with strength/evidence. Not decorative topology: the red chain is the
// "what breaks if Sarah leaves?" traversal.

import * as React from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
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
} from "lucide-react";
import Link from "next/link";
import { relationships, expertiseConcentration, reachable } from "@/lib/graph";
import type { EntityType } from "@/lib/graph";

type GraphData = {
  label: string;
  sub: string;
  kind: EntityType;
  tone: string;
  href?: string;
  alert?: boolean;
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
      className={`flex w-52 items-center gap-2.5 rounded-xl border bg-ink-elevated px-3 py-2.5 shadow-card transition-shadow hover:shadow-card-hover ${
        d.alert ? "border-danger/50 animate-pulseRed" : "border-line"
      }`}
    >
      <span className="rounded-lg p-1.5" style={{ background: `${d.tone}1f`, color: d.tone }}>
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-fg">{d.label}</div>
        <div className="truncate text-2xs text-fg-muted">{d.sub}</div>
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
  "dec-1": { x: 1240, y: 160, label: "Ledger-first decision", sub: "Decision · Active", kind: "decision", tone: "#8B5CF6", href: "/decisions" },
};

export default function GraphPage() {
  // Relationship exploration: hovering a node ignites its edges and recedes
  // everything else — motion communicating connection, not decoration.
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const { nodes, edges, blastRadius, busFactor } = React.useMemo(() => {
    // Bus factor: how concentrated is payments expertise?
    const conc = expertiseConcentration(relationships, "cap-payments");
    const top = conc[0];

    // Impact set: everything within 3 hops of Sarah.
    const blast = reachable(relationships, "u-sarah", 3);
    const blastIds = new Set(blast.map((b) => b.ref.id));

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
          labelStyle: { fill: "rgb(var(--fg-secondary))", fontSize: 9, fontFamily: "var(--font-plex-mono)" },
          labelBgStyle: { fill: "rgb(var(--ink-surface))", fillOpacity: 0.9 },
        };
      });

    return { nodes, edges, blastRadius: blastIds.size, busFactor: top };
  }, []);

  // Hover emphasis layer — recompute edge styling without touching node
  // positions (nodes stay uncontrolled so dragging keeps working).
  const displayEdges = React.useMemo(() => {
    if (!hoveredId) return edges;
    return edges.map((e) => {
      const connected = e.source === hoveredId || e.target === hoveredId;
      return {
        ...e,
        animated: connected,
        style: {
          ...e.style,
          stroke: connected ? "#6366F1" : (e.style?.stroke as string),
          strokeWidth: connected ? 2.5 : 1,
          opacity: connected ? 1 : 0.12,
          transition: "opacity 0.2s ease, stroke 0.2s ease",
        },
        labelStyle: {
          ...e.labelStyle,
          opacity: connected ? 1 : 0.15,
        },
      };
    });
  }, [edges, hoveredId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-2xs text-fg-muted">
        <span className="rounded-full border border-danger/40 bg-danger-soft px-2.5 py-1 font-medium text-danger">
          Scenario: “What breaks if Sarah leaves?” — {blastRadius} entities in 3-hop blast radius
        </span>
        {busFactor && (
          <span className="rounded-full border border-warn/40 bg-warn-soft px-2.5 py-1 font-medium text-warn">
            Payments bus factor: top holder carries {(busFactor.share * 100).toFixed(0)}% of expertise depth
          </span>
        )}
        <span className="ml-auto">edge width ∝ strength · “·~” marks inferred edges</span>
      </div>

      <div className="panel h-[620px] overflow-hidden">
        <ReactFlow
          defaultNodes={nodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          fitView
          fitViewOptions={{ padding: 0.18 }}
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
            nodeColor={() => "#6366F1"}
            nodeStrokeColor={() => "transparent"}
          />
        </ReactFlow>
      </div>
      <p className="text-2xs text-fg-muted">
        Rendered from the generic relationship layer (canonical registry types:
        funds · produces · threatened_by · supported_by · causes · mitigates).
        1-hop traversals are direct reads; this page&apos;s blast-radius and
        bus-factor figures come from the same utilities the scenario engine will use.
      </p>
    </div>
  );
}
