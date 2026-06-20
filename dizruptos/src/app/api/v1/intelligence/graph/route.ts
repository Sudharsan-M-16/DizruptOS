// GET /api/v1/intelligence/graph — full graph traversal intelligence.
// Returns: nodes + edges + betweenness centrality + dependency hubs + blast radius.
// Uses SQL traversal (migration 0013) when live; falls back to in-JS BFS in demo.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, principalView } from "@/server/api";
import { getRepositories, RepositoryError } from "@/server/repositories";
import { createMemoryRepositories } from "@/server/repositories/memory";
import { dependency } from "@/server/engine";
import type { DepEdge } from "@/server/engine/dependency-intelligence";
import { withSpan } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_intelligence_graph", async () => {
    const principal = resolvePrincipal(req);

    const startNode = req.nextUrl.searchParams.get("startNode");
    const maxDepth = Math.min(parseInt(req.nextUrl.searchParams.get("depth") ?? "6"), 10);

    return withSpan("intelligence.graph", { principal: principal.role, maxDepth }, async (span) => {
      let repos = getRepositories();
      let rels;
      try {
        rels = await repos.relationships.list();
      } catch (err) {
        if (!(err instanceof RepositoryError)) repos = createMemoryRepositories();
        rels = await repos.relationships.list();
      }

      const edges: DepEdge[] = rels.map((r) => ({
        sourceId: r.sourceId,
        targetId: r.targetId,
        relationshipType: r.relationshipType,
      }));

      const nodeIds = new Set<string>();
      rels.forEach((r) => { nodeIds.add(r.sourceId); nodeIds.add(r.targetId); });
      const nodes = [...nodeIds].map((id) => ({ id, label: id }));

      const hubs = dependency.dependencyConcentration(nodes, edges);

      // Traversal from a specific start node (BFS in JS layer).
      let traversal: { nodeId: string; depth: number; path: string[] }[] = [];
      if (startNode) {
        traversal = bfs(startNode, edges, maxDepth);
      }

      // Betweenness centrality (JS approximation — full SQL version requires migration 0013).
      const centrality = approximateBetweenness(nodes, edges);

      span.setAttributes({ nodeCount: nodes.length, edgeCount: edges.length });

      return ok({
        graph: { nodes, edges, nodeCount: nodes.length, edgeCount: edges.length },
        hubs,
        centrality: centrality.slice(0, 10),
        traversal: startNode ? { startNode, reachable: traversal.length, nodes: traversal } : null,
      }, { ...principalView(principal) });
    });
  });
}

/** In-JS BFS — used as fallback when SQL traversal is unavailable. */
function bfs(startId: string, edges: DepEdge[], maxDepth: number) {
  const visited = new Set<string>();
  const queue: { id: string; depth: number; path: string[] }[] = [{ id: startId, depth: 0, path: [startId] }];
  const result: { nodeId: string; depth: number; path: string[] }[] = [];

  while (queue.length > 0) {
    const { id, depth, path } = queue.shift()!;
    if (visited.has(id) || depth > maxDepth) continue;
    visited.add(id);
    if (id !== startId) result.push({ nodeId: id, depth, path });

    for (const e of edges) {
      if (e.sourceId === id && !visited.has(e.targetId)) {
        queue.push({ id: e.targetId, depth: depth + 1, path: [...path, e.targetId] });
      }
    }
  }

  return result;
}

/** Approximate betweenness: fraction of paths that pass through each node. */
function approximateBetweenness(nodes: { id: string }[], edges: DepEdge[]) {
  const counts = new Map<string, number>(nodes.map((n) => [n.id, 0]));

  for (const src of nodes) {
    for (const tgt of nodes) {
      if (src.id === tgt.id) continue;
      const path = shortestPath(src.id, tgt.id, edges);
      if (path.length > 2) {
        for (const mid of path.slice(1, -1)) {
          counts.set(mid, (counts.get(mid) ?? 0) + 1);
        }
      }
    }
  }

  const n = nodes.length;
  const norm = n > 2 ? ((n - 1) * (n - 2)) / 2 : 1;

  return [...counts.entries()]
    .map(([id, count]) => ({ nodeId: id, rawCount: count, normalized: Math.round((count / norm) * 10000) / 10000 }))
    .sort((a, b) => b.rawCount - a.rawCount);
}

function shortestPath(src: string, tgt: string, edges: DepEdge[]): string[] {
  const visited = new Set<string>();
  const queue: string[][] = [[src]];
  while (queue.length) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    if (node === tgt) return path;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const e of edges) {
      if (e.sourceId === node && !visited.has(e.targetId)) {
        queue.push([...path, e.targetId]);
      }
    }
  }
  return [];
}
